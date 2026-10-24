---
title: 'Story 1.1: See room availability'
type: 'feature'
created: '2026-10-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Members cannot see which of the three fixed meeting rooms are free; the app currently displays only a starter message. Story 1.1 requires today and current-week availability in half-hour slots, with saved bookings occupying only their own room and half-open time interval.

**Approach:** Show the three rooms and their capacities/equipment in a phone-friendly availability view with Today and This Week controls. Put date, slot, and availability calculations in React-free `src/domain/` modules with boundary tests. The view will accept booking data through a single source that later stories can connect to persistence; Story 1.1 does not create or save bookings.

</frozen-after-approval>

## Implementation Notes

- Added fixed room inventory in `src/domain/rooms.ts` and local-date, week, half-hour slot, and booking overlap rules in `src/domain/availability.ts`.
- Replaced the starter screen in `src/App.tsx` with Today and This Week views. `App` accepts booking intervals as input so later stories can connect creation and persistence without moving availability rules into React.
- Added responsive styling in `src/styles.css`, domain edge-case tests in `src/domain/availability.test.ts`, and UI interaction tests in `src/App.test.tsx`.
- `npm.cmd run verify` passes: typecheck, seven tests, and production build.
- Review fixes: the live view refreshes at local midnight, date headings include a year, and tests cover a booked slot in both views plus adjacent bookings. Final `npm.cmd run verify` passes with eight tests.

## Review Triage Log

- `medium` — The initial view captured today's date only at render, so an open tab could show yesterday after midnight. Added a local-midnight clock refresh.
- `low` — Day labels omitted the year, making a December–January week ambiguous. Added the year.
- `low` — The UI test did not prove a booking appeared in both views. Added the week-view assertion.
- `low` — The domain test did not exercise adjacent same-room bookings. Added adjacent-interval coverage.
