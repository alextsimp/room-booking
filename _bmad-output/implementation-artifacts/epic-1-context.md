# Epic 1 Context: Find and book a room

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A member using the prototype device can find free time in one of three meeting rooms and create a valid booking without double booking that room. The prototype replaces a shared spreadsheet for use in one browser profile and one active tab; availability reflects bookings saved there.

## Stories

- Story 1.1: See room availability
- Story 1.2: Book an available slot
- Story 1.3: Keep bookings after reload

## Requirements & Constraints

- Show three fixed rooms: small (4 people), medium (8), and large (14, with projector).
- Show availability for today and the current Monday–Sunday week. Use local dates and 30-minute slots from 08:00 through 20:00.
- A member may book under a nonblank name without logging in. Bookings must last from 30 minutes to 2 hours, use 30-minute boundaries, and stay within opening hours.
- Reject overlapping bookings for the same room and date. Adjacent bookings and bookings in different rooms are allowed. Invalid input and conflicts leave saved bookings unchanged.
- Persist bookings in this browser, restore them after reload, and explain to users that bookings are not shared with other devices. Missing storage starts empty; malformed or unsupported data produces a visible recovery message.
- The availability view, booking form, and feedback must be usable on a phone without horizontal page scrolling.
- Cancellation, editing, recurring bookings, room displays, and cross-device sharing are outside this epic.

## Technical Decisions

- Keep booking validation, overlap detection, and availability calculation in plain TypeScript under `src/domain/`, independent of React and browser APIs. Unit-test domain rules and boundaries.
- Represent bookings with local calendar dates and half-open intervals `[start, end)`. A booking ending when a slot starts leaves that slot free.
- Use stable room IDs and booking IDs; names are display data rather than identifiers.
- Keep one versioned booking collection in `localStorage`. A single storage adapter owns reads, parsing, invalid-data handling, and writes. Each mutation reads current data, validates through domain rules, and writes the result; UI components do not write booking data directly.
- Treat one browser profile and one active tab as the data authority. Simultaneous tabs and separate devices have no shared or atomic booking state.

## UX & Interaction Patterns

- Let members switch between today and this week, see each room's available slots, and choose a room, date, start, and end for a booking.
- Show a clear message for invalid input or a conflict. Reflect a successful booking in both availability views.
- Make the device-local nature of the bookings visible in the interface.

## Cross-Story Dependencies

- Story 1.1 supplies the room inventory, slot model, and availability rules used by Story 1.2. Story 1.2 adds booking validation and creation. Story 1.3 makes created bookings survive reload and feeds restored bookings back into the availability views.
