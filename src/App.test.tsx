import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

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
});
