import { describe, expect, it } from 'vitest';
import { isValidLocalDate, validateBooking, type BookingRequest } from './booking';

const now = new Date(2026, 9, 24, 9, 15);
const valid: BookingRequest = { roomId: 'small', date: '2026-10-25', startMinute: 540, endMinute: 600, name: ' Ada ' };
const check = (changes: Partial<BookingRequest>, existing: BookingRequest[] = []) =>
  validateBooking({ ...valid, ...changes }, existing, now);

describe('validateBooking', () => {
  it('accepts valid years below 0100 without Date constructor remapping', () => {
    expect(isValidLocalDate('0001-01-01')).toBe(true);
    expect(isValidLocalDate('0099-12-31')).toBe(true);
    expect(isValidLocalDate('0099-02-29')).toBe(false);
  });
  it('trims a valid name and accepts an available slot', () => {
    expect(check({})).toEqual({ ok: true, value: { ...valid, name: 'Ada' } });
  });

  it.each([
    [{ name: '  ' }, 'name'],
    [{ roomId: 'unknown' }, 'room'],
    [{ date: '2026-02-30' }, 'date'],
    [{ date: '2026-2-3' }, 'date'],
    [{ startMinute: Number.NaN }, '30-minute'],
    [{ startMinute: Infinity }, '30-minute'],
    [{ startMinute: 541 }, '30-minute'],
    [{ endMinute: 540 }, 'after'],
    [{ endMinute: 690 }, '2 hours'],
    [{ startMinute: 450 }, '08:00'],
    [{ endMinute: 1230 }, '20:00'],
  ] as const)('rejects invalid details %#', (changes, message) => {
    const result = check(changes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(message);
  });

  it('rejects past starts but allows the current minute and closing boundary', () => {
    expect(check({ date: '2026-10-23' }).ok).toBe(false);
    expect(check({ date: '2026-10-24', startMinute: 540, endMinute: 570 }).ok).toBe(false);
    expect(check({ date: '2026-10-24', startMinute: 570, endMinute: 600 }).ok).toBe(true);
    expect(check({ startMinute: 1170, endMinute: 1200 }).ok).toBe(true);
  });

  it('rejects overlap in the same room and date, while allowing adjacency and another room', () => {
    const existing = [{ ...valid, startMinute: 540, endMinute: 600 }];
    expect(check({ startMinute: 570, endMinute: 630 }, existing).ok).toBe(false);
    expect(check({ startMinute: 600, endMinute: 630 }, existing).ok).toBe(true);
    expect(check({ roomId: 'medium' }, existing).ok).toBe(true);
    expect(check({ date: '2026-10-26' }, existing).ok).toBe(true);
  });

  it('allows bookings that bring a member to exactly 2 hours in one room and day', () => {
    const existing = [{ ...valid, name: 'Ada', startMinute: 540, endMinute: 600 }];
    expect(check({ startMinute: 600, endMinute: 660 }, existing).ok).toBe(true);
  });

  it('rejects an over-limit booking using the total of nonoverlapping bookings', () => {
    const existing = [
      { ...valid, name: 'Ada', startMinute: 540, endMinute: 600 },
      { ...valid, name: 'Ada', startMinute: 600, endMinute: 630 },
    ];
    const result = check({ startMinute: 630, endMinute: 690 }, existing);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/2 hours per room per day/);
  });

  it('counts trimmed names without regard to letter case', () => {
    const existing = [{ ...valid, name: '  aDA  ', startMinute: 540, endMinute: 660 }];
    expect(check({ name: ' ada ', startMinute: 660, endMinute: 690 }, existing).ok).toBe(false);
  });

  it('keeps allowances separate by room, date, and member', () => {
    const existing = [{ ...valid, name: 'Ada', startMinute: 540, endMinute: 660 }];
    const later = { startMinute: 660, endMinute: 690 };
    expect(check({ ...later, roomId: 'large' }, existing).ok).toBe(true);
    expect(check({ ...later, date: '2026-10-26' }, existing).ok).toBe(true);
    expect(check({ ...later, name: 'Bea' }, existing).ok).toBe(true);
  });
});
