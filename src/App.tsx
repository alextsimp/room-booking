import { useEffect, useState } from 'react';
import {
  currentWeekDates,
  formatMinute,
  getAvailability,
  localDateKey,
  type BookingInterval,
} from './domain/availability';
import { ROOMS } from './domain/rooms';
import { createBookingStore, type BookingStore } from './bookingStore';

interface AppProps {
  bookings?: readonly BookingInterval[];
  today?: Date;
  bookingStore?: BookingStore;
}

function minuteFromTime(value: string): number {
  if (!/^\d{2}:\d{2}$/.test(value)) return Number.NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return (hours ?? Number.NaN) * 60 + (minutes ?? Number.NaN);
}

export function App({ bookings, today, bookingStore }: AppProps) {
  const [view, setView] = useState<'today' | 'week'>('today');
  const [clock, setClock] = useState(() => new Date());
  const [store] = useState(() => bookingStore ?? createBookingStore(window.localStorage));
  const [initial] = useState<{ bookings: readonly BookingInterval[]; error?: string }>(() => bookings ? { bookings } : store.load());
  const [savedBookings, setSavedBookings] = useState<readonly BookingInterval[]>(initial.bookings);
  const [feedback, setFeedback] = useState(initial.error ?? '');
  const [roomId, setRoomId] = useState('small');
  const [date, setDate] = useState(() => localDateKey(today ?? new Date()));
  const [dateEdited, setDateEdited] = useState(false);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [name, setName] = useState('');

  useEffect(() => {
    if (today) return;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(() => {
        setClock(new Date());
        scheduleMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleMidnight();
    return () => clearTimeout(timer);
  }, [today]);

  const currentDate = today ?? clock;
  const currentDateKey = localDateKey(currentDate);
  useEffect(() => {
    if (!dateEdited) setDate(currentDateKey);
  }, [currentDateKey, dateEdited]);
  const dates = view === 'today' ? [currentDate] : currentWeekDates(currentDate);
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = store.create({
      roomId, date, startMinute: minuteFromTime(start), endMinute: minuteFromTime(end), name,
    }, today ?? new Date());
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setSavedBookings(result.bookings);
    setFeedback('Booking saved.');
  }

  return (
    <main className="app">
      <header className="page-header">
        <p className="eyebrow">Coworking space</p>
        <h1>Room Booking</h1>
        <p>Find a free meeting room between 08:00 and 20:00.</p>
        <p className="scope-note">Availability is shown for this device only.</p>
      </header>

      <section className="booking-panel" aria-labelledby="booking-title">
        <p className="booking-title" id="booking-title">Book a room</p>
        <form onSubmit={submitBooking} noValidate>
          <label>Room<select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
            {ROOMS.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select></label>
          <label>Date<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setDateEdited(true); }} /></label>
          <label>Start<input type="time" step="1800" value={start} onChange={(event) => setStart(event.target.value)} /></label>
          <label>End<input type="time" step="1800" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
          <label>Name<input type="text" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <button type="submit">Book room</button>
        </form>
        {feedback && <p className="booking-feedback" role="status">{feedback}</p>}
      </section>

      <div className="view-switch" role="group" aria-label="Availability period">
        <button type="button" aria-pressed={view === 'today'} onClick={() => setView('today')}>
          Today
        </button>
        <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>
          This week
        </button>
      </div>

      <div className="days">
        {dates.map((date) => {
          const dateKey = localDateKey(date);
          return (
            <section className="day" key={dateKey} aria-labelledby={`day-${dateKey}`}>
              <h2 id={`day-${dateKey}`}>{dateFormatter.format(date)}</h2>
              <div className="rooms">
                {ROOMS.map((room) => (
                  <section className="room" key={room.id} aria-label={room.name}>
                    <div className="room-heading">
                      <h3>{room.name}</h3>
                      <p>{room.capacity} people{room.projector ? ' · Projector' : ''}</p>
                    </div>
                    <ul className="slots" aria-label={`${room.name} slots on ${dateFormatter.format(date)}`}>
                      {getAvailability(room.id, dateKey, savedBookings).map((slot) => (
                        <li
                          key={slot.startMinute}
                          className={slot.available ? 'slot free' : 'slot occupied'}
                          aria-label={`${formatMinute(slot.startMinute)} to ${formatMinute(slot.endMinute)}, ${slot.available ? 'free' : 'booked'}`}
                        >
                          <span>{formatMinute(slot.startMinute)}</span>
                          <span className="slot-status">{slot.available ? 'Free' : 'Booked'}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
