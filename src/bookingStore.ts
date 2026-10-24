import { type Booking, type BookingRequest, isValidLocalDate, validateBooking } from './domain/booking';
import { CLOSE_MINUTE, OPEN_MINUTE, SLOT_MINUTES } from './domain/availability';
import { ROOMS } from './domain/rooms';

export const BOOKING_STORAGE_KEY = 'room-bookings';

export interface BookingStore {
  load(): { bookings: Booking[]; error?: string };
  create(request: BookingRequest, now: Date): { bookings: Booking[]; error?: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBooking(value: unknown): value is Booking {
  if (!isRecord(value)) return false;
  const { id, name, roomId, date, startMinute, endMinute } = value;
  return typeof id === 'string' && id.length > 0 && typeof name === 'string' && name.trim().length > 0 &&
    typeof roomId === 'string' && ROOMS.some((room) => room.id === roomId) &&
    typeof date === 'string' && isValidLocalDate(date) &&
    typeof startMinute === 'number' && typeof endMinute === 'number' &&
    Number.isFinite(startMinute) && Number.isFinite(endMinute) &&
    startMinute % SLOT_MINUTES === 0 && endMinute % SLOT_MINUTES === 0 &&
    startMinute >= OPEN_MINUTE && endMinute <= CLOSE_MINUTE &&
    endMinute - startMinute >= SLOT_MINUTES && endMinute - startMinute <= 120;
}

function parseCollection(raw: string | null): { bookings: Booking[]; error?: string } {
  if (raw === null) return { bookings: [] };
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.bookings) ||
      !data.bookings.every(isBooking)) throw new Error('invalid collection');
    const bookings: Booking[] = data.bookings;
    if (new Set(bookings.map((booking) => booking.id)).size !== bookings.length ||
      bookings.some((booking, index) => bookings.slice(0, index).some((prior) =>
        prior.roomId === booking.roomId && prior.date === booking.date &&
        prior.startMinute < booking.endMinute && prior.endMinute > booking.startMinute))) {
      throw new Error('invalid collection');
    }
    return { bookings };
  } catch {
    return { bookings: [], error: 'Saved bookings could not be read. Your existing data was left unchanged.' };
  }
}

export function createBookingStore(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  makeId: () => string = () => crypto.randomUUID(),
): BookingStore {
  function load() {
    try {
      return parseCollection(storage.getItem(BOOKING_STORAGE_KEY));
    } catch {
      return { bookings: [], error: 'Saved bookings could not be read. Your existing data was left unchanged.' };
    }
  }
  return {
    load,
    create(request, now) {
      const current = load();
      if (current.error) return current;
      const result = validateBooking(request, current.bookings, now);
      if (!result.ok) return { bookings: current.bookings, error: result.message };
      const generatedId = makeId();
      let id = generatedId;
      let suffix = 2;
      while (current.bookings.some((booking) => booking.id === id)) {
        id = `${generatedId}-${suffix++}`;
      }
      const booking: Booking = { ...result.value, id };
      const bookings = [...current.bookings, booking];
      try {
        storage.setItem(BOOKING_STORAGE_KEY, JSON.stringify({ version: 1, bookings }));
        return { bookings };
      } catch {
        return { bookings: current.bookings, error: 'Booking could not be saved. Please try again.' };
      }
    },
  };
}
