# Divergence check

Verdict: Pass for current scope.

- Two UI features could otherwise implement different overlap rules; AD-1 and AD-3 bind both to domain rules and half-open intervals.
- Two booking actions could otherwise write different data shapes; AD-2 assigns one storage adapter and canonical collection.
- The storage key, full booking schema, and maximum duration remain implementation or product decisions. They must be settled in a story before those flows are built.

