# Reservation Workflow

## Overview

The reservation workflow manages the lifecycle of a facility reservation from submission to completion. The system enforces status transitions and validates business rules at each step.

## Status Definitions

| Status | Description | Next Possible States |
|--------|-------------|---------------------|
| **pending** | Reservation submitted, awaiting approval | approved, rejected, cancelled |
| **approved** | Administrator approved the reservation | scheduled |
| **rejected** | Administrator rejected the reservation | (terminal) |
| **scheduled** | Reservation confirmed and scheduled | in_use |
| **in_use** | Facility currently in use | completed |
| **completed** | Reservation fulfilled | (terminal) |
| **cancelled** | Requester cancelled | (terminal) |

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RESERVATION WORKFLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   Requester  │
    │   Submits    │
    │  Reservation │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   PENDING    │ ◄─────────────────────────────────────────┐
    │   Status     │                                           │
    └──────┬──────┘                                           │
           │                                                  │
    ┌──────┴──────┐                                           │
    │  Administrator│                                          │
    │   Reviews    │                                           │
    └──────┬──────┘                                           │
           │                                                  │
     ┌─────┴─────┐                                            │
     │           │                                            │
     ▼           ▼                                            │
┌─────────┐ ┌──────────┐                                      │
│APPROVED │ │ REJECTED │                                      │
│ Status  │ │  Status  │                                      │
└────┬────┘ └──────────┘                                      │
     │         (Terminal)                                     │
     │                                                        │
     ▼                                                        │
┌─────────────┐                                               │
│  SCHEDULED   │ ────────────────────────────────────────────┘
│   Status     │              (If conflict detected,
└──────┬──────┘               goes back to pending)
       │
       ▼
┌─────────────┐
│   IN_USE     │
│   Status     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  COMPLETED   │
│   Status     │
└─────────────┘
   (Terminal)


         CANCELLATION PATH
         ─────────────────
    ┌─────────────┐
    │   PENDING    │
    │   Status     │
    └──────┬──────┘
           │
           │ Requester cancels
           ▼
    ┌─────────────┐
    │  CANCELLED   │
    │   Status     │
    └─────────────┘
       (Terminal)
```

## Detailed Workflow Steps

### Step 1: Reservation Submission (TC-B4-01)
```
Actor: Requester
Action: Submit new reservation
System Validates:
  - BR-B4-01: Facility must be active
  - BR-B4-02: Start time < End time
  - BR-B4-08: Facility not under maintenance
  - BR-B4-03: No overlapping approved schedules
Result: Status = "pending"
Audit: reservation_submitted logged
```

### Step 2: Conflict Detection (TC-B4-02)
```
Actor: System (automatic)
Action: Check for scheduling conflicts
Logic:
  - Query reservations for same facility
  - Check for time overlap with approved/scheduled/in_use
  - If conflict found, block submission
Result: If conflict → Error, else → Proceed
Business Rule: BR-B4-03 (Overlapping approved schedules prohibited)
```

### Step 3: Administrator Approval (TC-B4-03)
```
Actor: Administrator
Action: Review and approve reservation
System Validates:
  - BR-B4-04: Only Administrator may approve
  - BR-B4-03: Check for conflicts at approval time
Result: Status = "approved" → "scheduled"
Audit: reservation_approved logged
Time Slot: Reserved (BR-B4-06)
```

### Step 4: Administrator Rejection (TC-B4-04)
```
Actor: Administrator
Action: Review and reject reservation
System Validates:
  - BR-B4-04: Only Administrator may reject
Result: Status = "rejected"
Audit: reservation_rejected logged
Note: BR-B4-05 - Rejected cannot become Scheduled
```

### Step 5: Staff Confirms Usage (TC-B4-05)
```
Actor: Facility Staff
Action: Mark facility as in use
Prerequisite: Status must be "scheduled"
Result: Status = "in_use"
Audit: status_change logged
```

### Step 6: Staff Records Completion (TC-B4-06)
```
Actor: Facility Staff
Action: Mark reservation as completed
Prerequisite: Status must be "in_use"
Result: Status = "completed"
Audit: status_change logged
Note: BR-B4-07 - Completed cannot be edited
```

### Step 7: Requester Cancellation (TC-B4-09)
```
Actor: Requester
Action: Cancel own pending reservation
System Validates:
  - BR-B4-09: Only own pending requests
  - Must be in "pending" status
  - Must be the original requester
Result: Status = "cancelled"
Audit: reservation_cancelled logged
```

## Status Transition Rules

| From Status | Allowed Transitions | Actor Required |
|-------------|---------------------|----------------|
| pending | approved, rejected, cancelled | Administrator (approve/reject), Requester (cancel) |
| approved | scheduled | System (automatic) |
| rejected | (none - terminal) | - |
| scheduled | in_use | Facility Staff |
| in_use | completed | Facility Staff |
| completed | (none - terminal) | - |
| cancelled | (none - terminal) | - |

## Time Slot Protection (BR-B4-06)

Once a reservation is approved/scheduled, the time slot is protected:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIME SLOT PROTECTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Facility: Conference Room A                                     │
│  Date: 2026-09-15                                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 9:00 AM  │ 10:00 AM │ 11:00 AM │ 12:00 PM │ 1:00 PM    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ [APPROVED] │ [APPROVED] │   FREE   │ [SCHEDULED] │ FREE  │   │
│  │ Reserved   │ Reserved   │          │ In Use      │       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Any new reservation request for 9:00-11:00 AM will be          │
│  BLOCKED due to conflict (BR-B4-03)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Business Rules in Workflow

| Rule | Description | Enforced At |
|------|-------------|-------------|
| BR-B4-01 | Only active facilities may be reserved | Submission |
| BR-B4-02 | Reservation start must precede end time | Submission |
| BR-B4-03 | Overlapping approved schedules are prohibited | Submission & Approval |
| BR-B4-04 | Only Administrator may approve reservations | Approval |
| BR-B4-05 | Rejected reservations cannot become Scheduled | Status Transition |
| BR-B4-06 | Approved reservations reserve the time slot | Approval |
| BR-B4-07 | Completed reservations cannot be edited | Update |
| BR-B4-08 | Facilities under Maintenance cannot be reserved | Submission |
| BR-B4-09 | Requesters may modify only their own Pending requests | Cancellation |
| BR-B4-10 | Approval and status changes must be logged | All Actions |
