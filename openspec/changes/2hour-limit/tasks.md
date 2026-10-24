# Tasks

## 1. Domain validation

- [x] 1.1 Update `src/domain/booking.ts` to count existing booking minutes by trimmed, case-insensitive name, room ID, and local date; keep the single-booking duration and overlap rules, and verify with `src/domain/booking.test.ts` cases for the exact 120-minute boundary, an excess request, another room, another date, another member, and equivalent names.

## 2. Saved booking flow

- [x] 2.1 Confirm `src/bookingStore.ts` passes saved names into the revised validator and rejects over-limit creates without changing local storage; verify with `src/bookingStore.test.ts` using consecutive creates, including bookings loaded from the existing version-1 collection.

## 3. Integration verification

- [x] 3.1 Run `npm run verify` and confirm type checking, tests, and build pass with the new rule.
