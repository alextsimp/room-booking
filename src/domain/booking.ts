import { CLOSE_MINUTE, localDateKey, OPEN_MINUTE, SLOT_MINUTES, type BookingInterval } from './availability';
import { ROOMS } from './rooms';

export interface BookingRequest extends BookingInterval {
  name: string;
}

export interface Booking extends BookingRequest {
  id: string;
}

export type BookingValidation = { ok: true; value: BookingRequest } | { ok: false; message: string };

export function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function validateBooking(
  request: BookingRequest,
  existing: readonly BookingInterval[],
  now: Date,
): BookingValidation {
  const name = request.name.trim();
  if (!name) return { ok: false, message: 'Enter your name.' };
  if (!ROOMS.some((room) => room.id === request.roomId)) {
    return { ok: false, message: 'Choose a valid room.' };
  }
  if (!isValidLocalDate(request.date)) return { ok: false, message: 'Choose a valid date.' };
  const { startMinute, endMinute } = request;
  if (![startMinute, endMinute].every((minute) => Number.isFinite(minute) && minute % SLOT_MINUTES === 0)) {
    return { ok: false, message: 'Choose times on 30-minute boundaries.' };
  }
  if (startMinute >= endMinute) return { ok: false, message: 'End time must be after start time.' };
  if (startMinute < OPEN_MINUTE || endMinute > CLOSE_MINUTE) {
    return { ok: false, message: 'Choose a time between 08:00 and 20:00.' };
  }
  if (endMinute - startMinute > 120) {
    return { ok: false, message: 'Bookings can last up to 2 hours.' };
  }
  if (request.date < localDateKey(now) ||
    (request.date === localDateKey(now) && startMinute < now.getHours() * 60 + now.getMinutes())) {
    return { ok: false, message: 'Choose a start time that is not in the past.' };
  }
  if (existing.some((booking) => booking.roomId === request.roomId && booking.date === request.date &&
    booking.startMinute < endMinute && booking.endMinute > startMinute)) {
    return { ok: false, message: 'This room is already booked at that time.' };
  }
  return { ok: true, value: { ...request, name } };
}
