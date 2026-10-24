# Proposal

## Why

Members need to use different rooms for different purposes on the same day. A limit shared across all rooms would prevent a member who used the small room for a call from reserving the large room for a later team meeting.

## What Changes

- Limit each member to two total booked hours in each room on each local date, counting all of that member's bookings in that room and date.
- Match member names after trimming surrounding whitespace and ignoring letter case.
- Reject a booking that would exceed that allowance with a clear message. Keep the existing two-hour maximum for a single booking and the other booking rules.

## Capabilities

### New Capabilities

- `room-booking-limits`: Limits a member's cumulative booked time per room and local date.

### Modified Capabilities

None. This project has no existing OpenSpec capability specs.

## Impact

- Booking validation in `src/domain/booking.ts`, its unit tests, and the local storage booking flow in `src/bookingStore.ts`.
- No new runtime dependencies or storage format change is expected.
