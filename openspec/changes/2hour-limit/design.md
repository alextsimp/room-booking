# Design

## Context

See `proposal.md` for the motivation. `validateBooking` in `src/domain/booking.ts` currently checks one request's duration and same-room overlap against existing booking intervals. The store in `src/bookingStore.ts` loads saved bookings before each create and passes them to validation. Saved bookings already contain a name, room ID, local date, and start/end minutes. There is no login or verified member ID.

## Goals / Non-Goals

**Goals:**
- Enforce the allowance in the domain validator for every booking created through the store.
- Preserve the existing version-1 local storage collection and saved names.

**Non-Goals:**
- Introduce accounts, verified identity, or cross-device booking synchronization.
- Reinterpret older saved bookings or rewrite the storage collection on load.

## Decisions

1. Calculate cumulative minutes from existing bookings with the same room ID, local date, and normalized name, then add the requested duration. Normalize with `trim()` and case folding at comparison time. This uses the current saved data and applies the rule to bookings saved before the change. Alternative: add a member ID or stored normalized name; neither can establish identity from existing name-only bookings and both would require a storage migration.
2. Extend the validation input to include the saved booking name while retaining the existing overlap check. The store already reloads the current collection for each create, so the validator sees the relevant bookings at submission time. Alternative: enforce the limit in the UI; this would miss direct store calls and stale UI state.
3. Keep the per-booking 120-minute validation and report a separate room/day allowance error when the cumulative total exceeds 120 minutes. Existing availability slots remain based on room occupancy; the member's allowance is checked when they submit a named booking. Alternative: mark slots unavailable based on a typed name, which would couple shared room availability to unfinished form input.

## Risks / Trade-offs

- Name-only identity permits a member to use a different name and bypass the allowance, while two people with matching names share an allowance. This is inherent in the product's current name-only booking model; the rule will match names consistently and avoid suggesting verified identity.
- Existing local storage can contain multiple valid, nonoverlapping bookings that already exceed the new allowance. Loading them will remain possible; the validator will reject further bookings in that room and date for the matching name.

## Migration Plan

No storage migration is needed. Deploy the new validation and tests with the static app. Rolling back restores the former validation while preserving the same version-1 booking data.
