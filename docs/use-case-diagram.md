# Use Case Diagram

## System Actors

| Actor | Description |
|-------|-------------|
| Administrator | Full system access, manages facilities/users, approves reservations |
| Facility Staff | Views reservations, confirms usage, records completion, creates service requests |
| Requester | Views facilities, submits reservations, manages own requests |
| System | Automatic processes (audit logging, conflict detection) |

## Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USE CASE DIAGRAM                                      │
│                    Facility Reservation System - Lab 4                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────────┐
                              │   Facility Reservation  │
                              │        System           │
                              └─────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│    Administrator  │      │  Facility Staff   │      │    Requester      │
│                   │      │                   │      │                   │
└───────┬───────────┘      └───────┬───────────┘      └───────┬───────────┘
        │                          │                          │
        │ UC-01: Manage Facilities │ UC-05: View Reservations │ UC-09: View Facilities
        │ UC-02: Manage Users      │ UC-06: Confirm Usage     │ UC-10: Submit Reservation
        │ UC-03: Approve/Reject    │ UC-07: Record Completion │ UC-11: View Status
        │ UC-04: View Audit Logs   │ UC-08: Create Service    │ UC-12: Cancel Request
        │                          │      Request             │ UC-13: View History
        ▼                          ▼                          ▼

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USE CASE DETAILS                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-01: Manage Facilities (Administrator)                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Administrator can create, update, and delete facilities            │
│ Actor: Administrator                                                            │
│ Preconditions: User must be logged in as Administrator                          │
│ Flow:                                                                           │
│   1. Navigate to Facilities Management                                          │
│   2. Click "Add Facility" or select existing facility                           │
│   3. Enter facility details (name, description, location, capacity)             │
│   4. Set status (active/inactive/maintenance)                                   │
│   5. Save changes                                                               │
│ Postconditions: Facility is created/updated/deleted, audit log recorded          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-02: Manage Users (Administrator)                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Administrator can view and manage user accounts                    │
│ Actor: Administrator                                                            │
│ Preconditions: User must be logged in as Administrator                          │
│ Flow:                                                                           │
│   1. Navigate to User Management                                                │
│   2. View list of all users with roles                                          │
│   3. View user details and status                                               │
│ Postconditions: User list displayed with current information                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-03: Approve/Reject Reservations (Administrator)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Administrator reviews pending reservations and approves/rejects   │
│ Actor: Administrator                                                            │
│ Preconditions: Pending reservations exist                                       │
│ Flow:                                                                           │
│   1. Navigate to Approval Queue                                                 │
│   2. Review reservation details                                                 │
│   3. Check for scheduling conflicts (BR-B4-03)                                  │
│   4. Approve or Reject with reason                                              │
│   5. System updates status and logs action                                       │
│ Postconditions: Reservation status updated, audit log recorded                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-04: View Audit Logs (Administrator)                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Administrator views all system audit logs                          │
│ Actor: Administrator                                                            │
│ Preconditions: User must be logged in as Administrator                          │
│ Flow:                                                                           │
│   1. Navigate to Audit Logs                                                     │
│   2. Apply filters (table, action, user)                                        │
│   3. View detailed log entries                                                  │
│ Postconditions: Audit logs displayed with filtering options                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-05: View Reservations (Facility Staff)                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Facility Staff views all reservations                              │
│ Actor: Facility Staff                                                           │
│ Preconditions: User must be logged in as Facility Staff                         │
│ Flow:                                                                           │
│   1. Navigate to Reservations                                                   │
│   2. View list of all reservations                                              │
│   3. View reservation details                                                   │
│ Postconditions: Reservation list displayed                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-06: Confirm Facility Usage (Facility Staff)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Staff marks reservation as "In Use"                                │
│ Actor: Facility Staff                                                           │
│ Preconditions: Reservation must be in "Scheduled" status                        │
│ Flow:                                                                           │
│   1. Select scheduled reservation                                               │
│   2. Click "Mark In Use"                                                        │
│   3. System updates status                                                      │
│ Postconditions: Status changes to "in_use", audit log recorded                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-07: Record Completion (Facility Staff)                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Staff marks reservation as "Completed"                             │
│ Actor: Facility Staff                                                           │
│ Preconditions: Reservation must be in "In Use" status                           │
│ Flow:                                                                           │
│   1. Select in-use reservation                                                  │
│   2. Click "Complete"                                                           │
│   3. System updates status                                                      │
│ Postconditions: Status changes to "completed", audit log recorded               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-08: Create Service Request (Facility Staff)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Staff creates service requests for facility issues                 │
│ Actor: Facility Staff                                                           │
│ Preconditions: User must be logged in as Facility Staff                         │
│ Flow:                                                                           │
│   1. Navigate to Service Requests                                               │
│   2. Click "New Service Request"                                                │
│   3. Select facility and enter details                                          │
│   4. Set priority level                                                         │
│   5. Submit request                                                             │
│ Postconditions: Service request created                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-09: View Facilities (Requester)                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Requester browses available facilities                             │
│ Actor: Requester                                                                │
│ Preconditions: User must be logged in as Requester                              │
│ Flow:                                                                           │
│   1. Navigate to Facilities                                                     │
│   2. View list of active facilities                                             │
│   3. View facility details                                                      │
│ Postconditions: Active facilities displayed                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-10: Submit Reservation (Requester)                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Requester submits a new reservation request                        │
│ Actor: Requester                                                                │
│ Preconditions: User must be logged in as Requester                              │
│ Flow:                                                                           │
│   1. Navigate to New Reservation                                                │
│   2. Select facility                                                            │
│   3. Enter title, description, start/end times                                  │
│   4. System validates (BR-B4-01, BR-B4-02, BR-B4-03, BR-B4-08)                 │
│   5. Submit reservation                                                         │
│ Postconditions: Reservation created with "pending" status, audit log recorded   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-11: View Status (Requester)                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Requester views status of own reservations                         │
│ Actor: Requester                                                                │
│ Preconditions: User must have submitted reservations                            │
│ Flow:                                                                           │
│   1. Navigate to My Reservations                                                │
│   2. View list of own reservations                                              │
│   3. View status and details                                                    │
│ Postconditions: Reservation list displayed                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-12: Cancel Request (Requester)                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Requester cancels own pending reservation                          │
│ Actor: Requester                                                                │
│ Preconditions: Reservation must be in "pending" status, owned by requester      │
│ Flow:                                                                           │
│   1. Navigate to My Reservations                                                │
│   2. Select pending reservation                                                 │
│   3. Click "Cancel"                                                             │
│   4. Confirm cancellation                                                       │
│ Postconditions: Status changes to "cancelled", audit log recorded               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UC-13: View History (Requester)                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Description: Requester views history of past reservations                       │
│ Actor: Requester                                                                │
│ Preconditions: User must have past reservations                                 │
│ Flow:                                                                           │
│   1. Navigate to My Reservations                                                │
│   2. View completed/cancelled reservations                                      │
│ Postconditions: Reservation history displayed                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Use Case Matrix

| Use Case | Administrator | Facility Staff | Requester |
|----------|:------------:|:--------------:|:---------:|
| UC-01: Manage Facilities | ✓ | - | - |
| UC-02: Manage Users | ✓ | - | - |
| UC-03: Approve/Reject Reservations | ✓ | - | - |
| UC-04: View Audit Logs | ✓ | - | - |
| UC-05: View Reservations | ✓ | ✓ | - |
| UC-06: Confirm Facility Usage | - | ✓ | - |
| UC-07: Record Completion | - | ✓ | - |
| UC-08: Create Service Request | - | ✓ | - |
| UC-09: View Facilities | ✓ | ✓ | ✓ |
| UC-10: Submit Reservation | - | - | ✓ |
| UC-11: View Status | - | - | ✓ |
| UC-12: Cancel Request | - | - | ✓ |
| UC-13: View History | - | - | ✓ |
