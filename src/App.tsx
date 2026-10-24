import { useEffect, useState } from 'react';
import {
  currentWeekDates,
  formatMinute,
  getAvailability,
  localDateKey,
  type BookingInterval,
} from './domain/availability';
import { ROOMS } from './domain/rooms';

interface AppProps {
  bookings?: readonly BookingInterval[];
  today?: Date;
}

export function App({ bookings = [], today }: AppProps) {
  const [view, setView] = useState<'today' | 'week'>('today');
  const [clock, setClock] = useState(() => new Date());

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
  const dates = view === 'today' ? [currentDate] : currentWeekDates(currentDate);
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main className="app">
      <header className="page-header">
        <p className="eyebrow">Coworking space</p>
        <h1>Room Booking</h1>
        <p>Find a free meeting room between 08:00 and 20:00.</p>
        <p className="scope-note">Availability is shown for this device only.</p>
      </header>

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
                      {getAvailability(room.id, dateKey, bookings).map((slot) => (
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
