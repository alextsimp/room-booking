import { beforeEach, describe, expect, it } from 'vitest';
import { BOOKING_STORAGE_KEY, createBookingStore } from './bookingStore';
import type { BookingRequest } from './domain/booking';

const request: BookingRequest = {
  roomId: 'small', date: '2026-10-25', startMinute: 540, endMinute: 600, name: 'Ada',
};
const now = new Date(2026, 9, 24, 9, 15);

beforeEach(() => localStorage.clear());

describe('booking store', () => {
  it('starts empty, saves a versioned collection, and restores stable IDs', () => {
    const store = createBookingStore(localStorage, () => 'booking-1');
    expect(store.load()).toEqual({ bookings: [] });
    expect(store.create(request, now)).toEqual({ bookings: [{ ...request, id: 'booking-1' }] });
    expect(JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) ?? '')).toEqual({
      version: 1, bookings: [{ ...request, id: 'booking-1' }],
    });
    expect(createBookingStore(localStorage).load().bookings[0]?.id).toBe('booking-1');
  });

  it('reads current storage for each mutation and preserves it after conflicts and invalid input', () => {
    const store = createBookingStore(localStorage, () => 'booking-1');
    store.create(request, now);
    const saved = localStorage.getItem(BOOKING_STORAGE_KEY);
    expect(store.create({ ...request, startMinute: 570, endMinute: 630 }, now).error).toMatch(/already booked/);
    expect(store.create({ ...request, name: ' ' }, now).error).toMatch(/name/);
    expect(store.create({ ...request, date: '2026-10-23' }, now).error).toMatch(/past/);
    expect(localStorage.getItem(BOOKING_STORAGE_KEY)).toBe(saved);
  });

  it('allows adjacent slots and a separate room', () => {
    let next = 0;
    const store = createBookingStore(localStorage, () => `booking-${++next}`);
    store.create(request, now);
    expect(store.create({ ...request, startMinute: 600, endMinute: 630 }, now).bookings).toHaveLength(2);
    expect(store.create({ ...request, roomId: 'medium' }, now).bookings).toHaveLength(3);
  });

  it('enforces the daily room allowance across consecutive creates without saving a rejected request', () => {
    let next = 0;
    const store = createBookingStore(localStorage, () => `booking-${++next}`);
    expect(store.create(request, now).bookings).toHaveLength(1);
    expect(store.create({ ...request, name: ' aDA ', startMinute: 600, endMinute: 660 }, now).bookings).toHaveLength(2);
    const saved = localStorage.getItem(BOOKING_STORAGE_KEY);
    expect(store.create({ ...request, startMinute: 660, endMinute: 690 }, now).error)
      .toMatch(/2 hours per room per day/);
    expect(localStorage.getItem(BOOKING_STORAGE_KEY)).toBe(saved);
    expect(store.create({ ...request, roomId: 'large', startMinute: 660, endMinute: 690 }, now).bookings)
      .toHaveLength(3);
  });

  it('counts bookings from an existing version-1 collection without changing it on rejection', () => {
    const saved = JSON.stringify({ version: 1, bookings: [
      { ...request, name: ' ADA ', startMinute: 540, endMinute: 660, id: 'earlier' },
    ] });
    localStorage.setItem(BOOKING_STORAGE_KEY, saved);
    const store = createBookingStore(localStorage, () => 'new');
    expect(store.load().bookings).toHaveLength(1);
    expect(store.create({ ...request, startMinute: 660, endMinute: 690 }, now).error)
      .toMatch(/2 hours per room per day/);
    expect(localStorage.getItem(BOOKING_STORAGE_KEY)).toBe(saved);
  });

  it('chooses a unique ID when the generator repeats an existing one', () => {
    const store = createBookingStore(localStorage, () => 'same-id');
    expect(store.create(request, now).bookings[0]?.id).toBe('same-id');
    const second = store.create({ ...request, roomId: 'medium' }, now);
    expect(second.bookings.map((booking) => booking.id)).toEqual(['same-id', 'same-id-2']);
    expect(store.load()).toEqual(second);
  });

  it('preserves malformed and unsupported data without writing over it', () => {
    for (const raw of [
      '{',
      JSON.stringify({ version: 2, bookings: [] }),
      JSON.stringify({ version: 1, bookings: [{ id: 'bad', name: 'Ada', roomId: 'missing', date: '2026-10-25', startMinute: 540, endMinute: 600 }] }),
    ]) {
      localStorage.setItem(BOOKING_STORAGE_KEY, raw);
      const store = createBookingStore(localStorage);
      expect(store.load().error).toMatch(/could not be read/);
      expect(store.create(request, now).error).toMatch(/could not be read/);
      expect(localStorage.getItem(BOOKING_STORAGE_KEY)).toBe(raw);
    }
  });

  it('keeps storage unchanged when ID generation fails', () => {
    const empty = createBookingStore(localStorage, () => '');
    expect(empty.create(request, now).error).toMatch(/could not be saved/);
    expect(localStorage.getItem(BOOKING_STORAGE_KEY)).toBeNull();

    const throwing = createBookingStore(localStorage, () => { throw new Error('random unavailable'); });
    expect(throwing.create(request, now).error).toMatch(/could not be saved/);
    expect(localStorage.getItem(BOOKING_STORAGE_KEY)).toBeNull();
  });
});
