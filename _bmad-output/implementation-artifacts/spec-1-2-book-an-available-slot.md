---
title: 'Story 1.2: Book an available slot'
type: 'feature'
created: '2026-10-24'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'dcce9eeaf348a88785cea90917b85de10f20494e'
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Members can see free time but cannot reserve a room. Story 1.2 requires a name-only booking flow that rejects invalid times and overlapping reservations, then immediately updates availability.

**Approach:** Add a phone-friendly booking form for a room, local date, start, end, and name. Validate the request in plain TypeScript domain code. Route successful creation through one booking storage adapter, which reads the current `localStorage` collection, validates, assigns a stable ID, writes, and returns the new collection to the UI. Restore that collection when the app opens so displayed availability matches the storage authority. Story 1.3 can focus on malformed/unsupported data recovery and persistence hardening.

**Scope decision:** Include save and reload behavior in Story 1.2 to preserve architecture decisions AD-2 and AD-4. The product owner selected this after reviewing the spec.

## Boundaries & Constraints

**Always:** A nonblank name, fixed room ID, valid local calendar date, finite numeric 30-minute start/end boundaries, duration 30 minutes to 2 hours, and interval within 08:00–20:00. Reject a start earlier than the current local minute using an injected clock in the pure validator. Reject overlap for the same room and date using half-open intervals; permit adjacent bookings and separate rooms. Invalid requests preserve the existing collection and show clear feedback. Successful requests appear in every availability view that contains their date.

**Never:** Add login, cancellation, editing, recurring bookings, backend, API route, runtime dependency, or direct booking-rule logic or storage writes in React.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Valid booking | Free room, local date, 09:00–10:00, name | Booking with stable ID saved; relevant slots show Booked, including after reload | None |
| Adjacent booking | Existing booking ends at 10:00; new one starts at 10:00 | Accepted | None |
| Conflict | Existing same-room booking overlaps requested interval | Collection unchanged | Show conflict message |
| Invalid details | Blank name, unknown room, impossible date, nonnumeric/off-grid time, wrong order, outside hours, or duration over 2 hours | Collection unchanged | Show validation message |
| Past slot | Start of requested interval is earlier than the current local minute | Collection unchanged | Show past-time message |

</frozen-after-approval>

## Code Map

- `src/App.tsx` — Today/This week view takes optional booking intervals; connect a booking form to the adapter and retain injected booking behavior for tests.
- `src/domain/availability.ts` — Contains `BookingInterval`, local date/slot helpers, and half-open overlap semantics; reuse these types and constants.
- `src/domain/rooms.ts` — Stable room IDs and display details; validate requested room IDs against this list.
- `src/styles.css` — Existing responsive card layout; extend for a narrow-screen form and feedback.
- `src/App.test.tsx` and `src/domain/availability.test.ts` — Existing test patterns; add integration and domain edge cases without changing earlier expectations.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/booking.ts` and `src/domain/booking.test.ts` — add pure validation with injected current time; test date, numeric, duration, opening-hour, conflict, and past-time boundaries.
- [x] `src/bookingStore.ts` and `src/bookingStore.test.ts` — add one versioned collection adapter that reads, validates, assigns an ID, writes, and restores bookings without overwriting malformed data.
- [x] `src/App.tsx` — add a booking form, load stored bookings, and update availability only on success.
- [x] `src/styles.css` — make the form and feedback usable on a phone.
- [x] `src/App.test.tsx` — test successful booking, conflict feedback, and unchanged availability after invalid input.

**Acceptance Criteria:**
- Given a free slot and valid name, when a member submits the form, then the new booking appears in every displayed view containing its date and remains after reload.
- Given an overlapping booking for the same room/date, when another member submits, then the request is rejected with a clear message and existing availability remains unchanged.
- Given a booking ending at the requested start or in another room, when the member submits, then the request succeeds.
- Given an invalid name, room, date, numeric time, duration, or opening-hour interval, when the member submits, then no booking is added and a clear error appears.
- Given a requested slot whose start is in the past, when the member submits, then no booking is added and a clear past-time error appears.
- Given a phone-width viewport, when a member uses the form, then all controls and feedback remain visible without horizontal page scrolling.

### Review Findings

- [x] [Review][Patch] Saved data errors leave availability looking free [src/App.tsx:28] — Unreadable storage now hides the slot grid and disables booking.
- [x] [Review][Patch] Injected bookings and creation use different authorities [src/App.tsx:28] — Removed the separate `bookings` prop; fixtures now enter through the booking store.
- [x] [Review][Patch] ID generation can throw or return an invalid ID [src/bookingStore.ts:66] — Both return a save error without changing storage.
- [x] [Review][Patch] Blocked storage access can crash the app during render [src/App.tsx:27] — Startup catches storage access failure and shows an unavailable state.
- [x] [Review][Patch] Invalid entries inside a version 1 collection lack a test [src/bookingStore.test.ts:49] — Added rejection and raw-data preservation coverage.
- [x] [Review][Patch] Storage write failure lacks a UI test [src/bookingStore.ts:75] — Added feedback and unchanged-availability coverage.
- [x] [Review][Patch] Years 0001–0999 compare incorrectly as past [src/domain/availability.ts:18] — Local date keys now pad the year to four digits.
- [x] [Review][Defer] Phone-width layout needs a viewport check [src/styles.css:15] — deferred: CSS is responsive, but the diff has no browser-width evidence; inspect at a narrow viewport to settle whether controls or feedback overflow.

#### Rejected

None.

## Implementation Notes

- Added pure booking validation with a supplied clock and tests for invalid dates, nonnumeric or off-grid times, duration, opening hours, past starts, conflicts, adjacency, and room separation.
- Added one versioned `localStorage` adapter. It assigns a stable ID on creation, reloads saved bookings, and preserves malformed/unsupported data without overwriting it.
- Connected the form to the adapter and availability view; added responsive form styles and UI tests for creation, conflict feedback, and reload.
- Audited all five I/O matrix rows against running tests. `npm.cmd run verify` passed: 28 tests, typecheck, and production build.
- Review fixes added collision-safe IDs, valid date parsing for years 0001–0099, a default form date that follows Today across midnight, tests for selected form values, and a test for production storage wiring. Final `npm.cmd run verify` passed: 33 tests, typecheck, and production build.
- A later code review fixed unreadable-storage availability, the split booking authority, ID-generation failures, blocked storage access, and early-year date keys; added malformed-entry and failed-write tests. `npm.cmd run verify` passed with 38 tests.

## Review Triage Log

- `medium` — Blind Hunter: generated IDs could collide and produce an unreadable saved collection. Fixed by choosing an unused ID; added a collision test.
- `low`, rejected as outside the approved one-active-tab intent — Blind Hunter: simultaneous tabs could overwrite one another. Cross-tab coordination is explicitly deferred in the architecture spine.
- `low`, rejected as outside the approved one-active-tab intent — Blind Hunter: availability does not listen for another tab's storage event. No second active tab is in scope.
- `low`, rejected as outside the approved one-active-tab intent — Blind Hunter: a conflict from another tab could leave displayed slots stale. No second active tab is in scope.
- `low` — Blind Hunter: the form's default date could remain yesterday after midnight. Fixed by following Today until the member edits the date.
- `low` — Blind Hunter: valid dates with years 0001–0099 were rejected by the Date constructor. Fixed with `setFullYear`; added boundary tests.
- `medium` — Verification Gap: changed room/date/start/end controls were untested through the form. Added a selected-values interaction test.
- `medium` — Verification Gap: the production default storage path was untested after remount. Added an App test using the default store.
- `low` — Edge Case Hunter: year 0001–0099 parsing issue independently confirmed and fixed with the same date patch.
- `medium` — Edge Case Hunter: ID collisions independently confirmed and fixed with the same unique-ID patch.
- `low`, rejected as outside the approved one-active-tab intent — Edge Case Hunter: another tab's rejected submission could leave availability stale. No second active tab is in scope.

## Verification

**Commands:**
- `npm.cmd run verify` — typecheck, unit and UI tests, and production build all pass.
