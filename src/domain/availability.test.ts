import { describe, expect, it } from 'vitest';
import { currentWeekDates, getAvailability, localDateKey, OPEN_MINUTE } from './availability';

describe('availability', () => {
  it('generates 24 half-hour slots from 08:00 to 20:00', () => {
    const slots = getAvailability('small', '2026-10-24', []);
    expect(slots).toHaveLength(24);
    expect(slots[0]).toEqual({ startMinute: 480, endMinute: 510, available: true });
    expect(slots[23]).toEqual({ startMinute: 1170, endMinute: 1200, available: true });
  });

  it('marks only overlapping slots in the same room and date unavailable', () => {
    const bookings = [{ roomId: 'small', date: '2026-10-24', startMinute: 510, endMinute: 570 }];
    const slots = getAvailability('small', '2026-10-24', bookings);
    expect(slots[0]).toMatchObject({ available: true });
    expect(slots[1]).toMatchObject({ available: false });
    expect(slots[2]).toMatchObject({ available: false });
    expect(slots[3]).toMatchObject({ available: true });
    expect(getAvailability('medium', '2026-10-24', bookings).every((slot) => slot.available)).toBe(true);
    expect(getAvailability('small', '2026-10-25', bookings).every((slot) => slot.available)).toBe(true);
  });

  it('treats the end of a booking as free, including closing boundary', () => {
    const slots = getAvailability('small', '2026-10-24', [
      { roomId: 'small', date: '2026-10-24', startMinute: OPEN_MINUTE, endMinute: 510 },
      { roomId: 'small', date: '2026-10-24', startMinute: 1170, endMinute: 1200 },
    ]);
    expect(slots[0]).toMatchObject({ available: false });
    expect(slots[1]).toMatchObject({ available: true });
    expect(slots[23]).toMatchObject({ available: false });
  });

  it('keeps adjacent bookings separate with a free slot after them', () => {
    const slots = getAvailability('small', '2026-10-24', [
      { roomId: 'small', date: '2026-10-24', startMinute: 480, endMinute: 510 },
      { roomId: 'small', date: '2026-10-24', startMinute: 510, endMinute: 540 },
    ]);
    expect(slots[0]).toMatchObject({ available: false });
    expect(slots[1]).toMatchObject({ available: false });
    expect(slots[2]).toMatchObject({ available: true });
  });

  it('uses Monday through Sunday in local calendar time across a month boundary', () => {
    expect(currentWeekDates(new Date(2026, 10, 1)).map(localDateKey)).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29',
      '2026-10-30', '2026-10-31', '2026-11-01',
    ]);
  });

  it('pads early years in local date keys', () => {
    const date = new Date(0);
    date.setFullYear(99, 11, 31);
    expect(localDateKey(date)).toBe('0099-12-31');
  });
});
