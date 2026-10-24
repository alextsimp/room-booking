export interface BookingInterval {
  roomId: string;
  date: string;
  startMinute: number;
  endMinute: number;
}

export interface Slot {
  startMinute: number;
  endMinute: number;
  available: boolean;
}

export const OPEN_MINUTE = 8 * 60;
export const CLOSE_MINUTE = 20 * 60;
export const SLOT_MINUTES = 30;

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentWeekDates(today: Date): Date[] {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

export function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

export function getAvailability(
  roomId: string,
  date: string,
  bookings: readonly BookingInterval[],
): Slot[] {
  return Array.from(
    { length: (CLOSE_MINUTE - OPEN_MINUTE) / SLOT_MINUTES },
    (_, index) => {
      const startMinute = OPEN_MINUTE + index * SLOT_MINUTES;
      const endMinute = startMinute + SLOT_MINUTES;
      const occupied = bookings.some(
        (booking) =>
          booking.roomId === roomId &&
          booking.date === date &&
          booking.startMinute < endMinute &&
          booking.endMinute > startMinute,
      );
      return { startMinute, endMinute, available: !occupied };
    },
  );
}
