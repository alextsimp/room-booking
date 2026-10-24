import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { createBookingStore } from './bookingStore';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

function fillBooking(name: string) {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Book room' }));
}

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Room Booking' })).toBeDefined();
  });

  it('shows the three rooms and switches between today and the current week', () => {
    render(<App today={new Date(2026, 9, 24)} />);
    expect(screen.getByRole('heading', { name: 'Small room' })).toBeDefined();
    expect(screen.getByText('8 people')).toBeDefined();
    expect(screen.getByText('14 people · Projector')).toBeDefined();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'This week' }));
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'This week' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a saved booking only in its own room and time', () => {
    render(
      <App
        today={new Date(2026, 9, 24)}
        bookings={[{ roomId: 'small', date: '2026-10-24', startMinute: 480, endMinute: 510 }]}
      />,
    );
    const small = screen.getByRole('region', { name: 'Small room' });
    const medium = screen.getByRole('region', { name: 'Medium room' });
    expect(within(small).getByLabelText('08:00 to 08:30, booked')).toBeDefined();
    expect(within(small).getByLabelText('08:30 to 09:00, free')).toBeDefined();
    expect(within(medium).getByLabelText('08:00 to 08:30, free')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'This week' }));
    const saturday = screen.getByRole('region', { name: /Saturday.*24.*2026/ });
    const weeklySmall = within(saturday).getByRole('region', { name: 'Small room' });
    expect(within(weeklySmall).getByLabelText('08:00 to 08:30, booked')).toBeDefined();
  });

  it('books a room, updates today and week, and restores after remount', () => {
    const today = new Date(2026, 9, 24, 8, 0);
    const store = createBookingStore(localStorage, () => 'booking-1');
    const view = render(<App today={today} bookingStore={store} />);
    fillBooking('Ada');
    expect(screen.getByRole('status').textContent).toMatch(/saved/);
    expect(within(screen.getByRole('region', { name: 'Small room' })).getByLabelText('09:00 to 09:30, booked')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'This week' }));
    const saturday = screen.getByRole('region', { name: /Saturday.*24.*2026/ });
    expect(within(saturday).getByLabelText('09:00 to 09:30, booked')).toBeDefined();
    view.unmount();
    render(<App today={today} bookingStore={store} />);
    expect(within(screen.getByRole('region', { name: 'Small room' })).getByLabelText('09:00 to 09:30, booked')).toBeDefined();
  });

  it('shows conflict and validation feedback without changing availability', () => {
    const today = new Date(2026, 9, 24, 8, 0);
    render(<App today={today} bookingStore={createBookingStore(localStorage, () => 'booking-1')} />);
    fillBooking('Ada');
    fillBooking('Ben');
    expect(screen.getByRole('status').textContent).toMatch(/already booked/);
    expect(within(screen.getByRole('region', { name: 'Small room' })).getByLabelText('10:00 to 10:30, free')).toBeDefined();
    fillBooking(' ');
    expect(screen.getByRole('status').textContent).toMatch(/name/);
    expect(within(screen.getByRole('region', { name: 'Small room' })).getByLabelText('10:00 to 10:30, free')).toBeDefined();
  });

  it('books the selected room, date, and times', () => {
    render(<App today={new Date(2026, 9, 24, 8)} bookingStore={createBookingStore(localStorage, () => 'chosen-slot')} />);
    fireEvent.change(screen.getByLabelText('Room'), { target: { value: 'medium' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-25' } });
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '11:00' } });
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '12:00' } });
    fillBooking('Ada');
    fireEvent.click(screen.getByRole('button', { name: 'This week' }));
    const sunday = screen.getByRole('region', { name: /Sunday.*25.*2026/ });
    const medium = within(sunday).getByRole('region', { name: 'Medium room' });
    expect(within(medium).getByLabelText('11:00 to 11:30, booked')).toBeDefined();
    expect(within(medium).getByLabelText('11:30 to 12:00, booked')).toBeDefined();
    expect(within(medium).getByLabelText('10:30 to 11:00, free')).toBeDefined();
    expect(within(within(sunday).getByRole('region', { name: 'Small room' })).getByLabelText('11:00 to 11:30, free')).toBeDefined();
  });

  it('follows Today across midnight until the date is edited', () => {
    const view = render(<App today={new Date(2026, 9, 24, 23, 59)} />);
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-10-24');
    view.rerender(<App today={new Date(2026, 9, 25, 0, 1)} />);
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-10-25');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-26' } });
    view.rerender(<App today={new Date(2026, 9, 27, 0, 1)} />);
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-10-26');
  });

  it('uses the default localStorage path for booking and remount restoration', () => {
    const today = new Date(2026, 9, 24, 8);
    const view = render(<App today={today} />);
    fillBooking('Ada');
    expect(screen.getByRole('status').textContent).toMatch(/saved/);
    view.unmount();
    render(<App today={today} />);
    expect(within(screen.getByRole('region', { name: 'Small room' })).getByLabelText('09:00 to 09:30, booked')).toBeDefined();
  });
});
