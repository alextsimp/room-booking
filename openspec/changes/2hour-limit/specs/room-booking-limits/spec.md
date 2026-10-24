# Spec Delta

## Purpose

Limits how long a member can reserve each meeting room on a local date while allowing independent use of other rooms.

## ADDED Requirements

### Requirement: Two-hour daily allowance per member and room
The system SHALL accept a booking only when the sum of its duration and the durations of existing bookings for the same member, room, and local date is at most 120 minutes.

#### Scenario: Multiple bookings reach the allowance
- **WHEN** a member has booked 60 minutes in a room on a local date and requests another nonoverlapping 60 minutes in that room on that date
- **THEN** the system accepts the request if all other booking rules pass

#### Scenario: Request exceeds the allowance
- **WHEN** a member has booked 90 minutes in a room on a local date and requests another nonoverlapping 60 minutes in that room on that date
- **THEN** the system rejects the request with a message explaining the two-hour daily limit for that room, and does not save it

#### Scenario: Separate allowances for different rooms
- **WHEN** a member has reached 120 minutes in the small room on a local date and requests an available booking in the large room on that date
- **THEN** the small-room bookings do not reduce the member's large-room allowance

#### Scenario: Allowance resets on another date
- **WHEN** a member has reached 120 minutes in a room on one local date and requests an available booking in that room on another local date
- **THEN** the first date's bookings do not reduce the allowance for the second date

#### Scenario: Other members have independent allowances
- **WHEN** one member has reached 120 minutes in a room on a local date and another member requests an available booking in that room on that date
- **THEN** the first member's bookings do not reduce the second member's allowance

### Requirement: Name matching for the allowance
The system SHALL match member names for the daily allowance after trimming surrounding whitespace and ignoring letter case.

#### Scenario: Equivalent names share an allowance
- **WHEN** an existing booking is under `Ada` and a request on the same room and local date is under ` ada `
- **THEN** the system counts the existing booking toward the requester's allowance

### Requirement: Single-booking duration remains limited
The system SHALL reject an individual booking longer than 120 minutes, regardless of the member's remaining daily allowance.

#### Scenario: Single request exceeds two hours
- **WHEN** a member requests a 150-minute booking with no other bookings that day
- **THEN** the system rejects the request
