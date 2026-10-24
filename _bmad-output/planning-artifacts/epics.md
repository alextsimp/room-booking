---
status: final
stepsCompleted:
  - requirements-extracted
  - epics-designed
  - stories-written
inputDocuments:
  - docs/idea.md
  - _bmad-output/planning-artifacts/architecture/architecture-agentic-sdlc-workshop-2026-10-24/ARCHITECTURE-SPINE.md
---

# Meeting-room booking prototype — epics and stories

This small prototype uses the idea and architecture spine directly. It is for one device and one active browser tab; bookings stored here are not shared with other devices. The product owner set a two-hour maximum per booking on 2026-10-24.

## Scope

Members can view availability for three fixed rooms today and during the current week, then book a slot under their name. Bookings use 30-minute boundaries within 08:00–20:00 and persist in this browser. The page works on a phone. Logins, cancellation, editing, recurring bookings, room displays, and cross-device sharing are outside this prototype.

## Epic 1: Find and book a room

**Goal:** A member using the prototype device can see free time and create a valid booking without double booking a room.

### Story 1.1: See room availability

As a member, I want to see which rooms are free today and this week so I can choose a suitable time.

**Acceptance criteria**

- The page shows the small room (4 people), medium room (8), and large room (14, projector).
- Members can switch between today and the current Monday–Sunday week and see each room's available 30-minute slots between 08:00 and 20:00 in local time.
- A saved booking marks its room and occupied slots unavailable in both views. A booking ending at a slot's start does not occupy that slot.
- Availability is derived by React-free rules under `src/domain/`, with unit tests for day boundaries, adjacent bookings, and room separation (AD-1, AD-3).
- The availability view is usable on a phone without horizontal page scrolling.

### Story 1.2: Book an available slot

As a member, I want to enter my name and reserve a room so I can use it at the chosen time.

**Acceptance criteria**

- A member can choose a room, local date, start, and end on 30-minute boundaries, and enter a nonblank name; no login is required.
- A booking must be at least 30 minutes and at most 2 hours long, start no earlier than 08:00, and end no later than 20:00.
- A booking that overlaps another booking for the same room and date is rejected with a clear message; adjacent bookings and bookings in different rooms are allowed.
- Invalid input or a conflict leaves saved bookings unchanged. Successful creation appears in today/week availability.
- Validation and overlap rules live under `src/domain/` with unit tests for empty names, length limits, opening-hour boundaries, same-room conflicts, and nonconflicts (AD-1, AD-3).
- The booking form and its feedback are usable on a phone.

### Story 1.3: Keep bookings after reload

As a member using the prototype device, I want my bookings to remain after reloading the page so I can trust the displayed availability.

**Acceptance criteria**

- Created bookings are saved in one versioned `localStorage` collection and restored after reload.
- One storage adapter owns booking reads and writes; creation reads current saved bookings, validates, then writes the resulting collection. UI components do not write booking data directly (AD-2).
- A missing collection starts empty. Malformed or unsupported stored data produces a visible recovery message rather than a crash or silent overwrite.
- Each booking has a stable ID independent of the member name.
- The UI makes clear that bookings belong to this browser on this device and are not synchronized (AD-4).

## Coverage

| Source requirement | Story |
| --- | --- |
| Three rooms and their capacities/equipment | 1.1 |
| Today and week availability | 1.1 |
| 30-minute steps, 08:00–20:00 | 1.1, 1.2 |
| Prevent overlapping room bookings | 1.2, 1.3 |
| Limit room use to 2 hours per booking | 1.2 |
| Name entry without login | 1.2 |
| Phone usability | 1.1, 1.2 |
| Browser-local persistence | 1.3 |

## Deferred

- Cancellation or editing needs an ownership rule because names do not verify identity.
- Recurring bookings and screens beside rooms are later ideas.
- Shared availability across devices or simultaneous tabs would require a different authority or concurrency design.
