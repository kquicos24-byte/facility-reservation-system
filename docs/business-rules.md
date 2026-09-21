# Business Rules

## Business Rules Summary

| ID | Rule | Description | Enforcement |
|----|------|-------------|-------------|
| BR-B4-01 | Active Facilities Only | Only active facilities may be reserved | Database trigger + App validation |
| BR-B4-02 | Valid Time Range | Reservation start must precede end time | Database constraint + App validation |
| BR-B4-03 | No Overlapping Approvals | Overlapping approved schedules are prohibited | Database trigger + App validation |
| BR-B4-04 | Admin Approval Required | Only Administrator may approve reservations | Application access control |
| BR-B4-05 | Rejected = Terminal | Rejected reservations cannot become Scheduled | Database trigger |
| BR-B4-06 | Time Slot Reservation | Approved reservations reserve the time slot | Database trigger |
| BR-B4-07 | Completed = Immutable | Completed reservations cannot be edited | Database trigger |
| BR-B4-08 | No Maintenance Reservations | Facilities under Maintenance cannot be reserved | Database trigger + App validation |
| BR-B4-09 | Own Pending Only | Requesters may modify only their own Pending requests | Application access control |
| BR-B4-10 | Audit Logging Required | Approval and status changes must be logged | Database triggers + App logging |

---

## Detailed Business Rules

### BR-B4-01: Only Active Facilities May Be Reserved

**Description:** A facility must be in "active" status to be available for reservation.

**Validation Points:**
- Frontend: Facility dropdown only shows active facilities
- Backend: Database trigger checks facility status on INSERT

**Implementation:**
```sql
-- Database Trigger
CREATE TRIGGER trg_check_facility_available
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_facility_available();
```

**Error Message:** "Facility is not active and cannot be reserved"

---

### BR-B4-02: Reservation Start Must Precede End Time

**Description:** The start_time of a reservation must be before the end_time.

**Validation Points:**
- Frontend: Form validation before submission
- Backend: Database constraint

**Implementation:**
```sql
-- Database Constraint
CONSTRAINT valid_time_range CHECK (start_time < end_time)
```

**Error Message:** "Start time must be before end time"

---

### BR-B4-03: Overlapping Approved Schedules Are Prohibited

**Description:** Two or more approved/scheduled/in_use reservations for the same facility cannot overlap in time.

**Validation Points:**
- Frontend: Conflict check before submission
- Backend: Database trigger checks for overlaps

**Implementation:**
```sql
-- Database Trigger
CREATE TRIGGER trg_check_reservation_overlap
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_reservation_overlap();
```

**Time Overlap Logic:**
```
Two intervals (A.start, A.end) and (B.start, B.end) overlap if:
A.start < B.end AND A.end > B.start
```

**Error Message:** "Overlapping approved schedule detected"

---

### BR-B4-04: Only Administrator May Approve Reservations

**Description:** The approve/reject action is restricted to users with the "administrator" role.

**Validation Points:**
- Frontend: Only admins see approve/reject buttons
- Backend: Row Level Security policies

**Implementation:**
```sql
-- RLS Policy
CREATE POLICY "Admins can manage all reservations" ON reservations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator')
    );
```

---

### BR-B4-05: Rejected Reservations Cannot Become Scheduled

**Description:** Once a reservation is rejected, its status cannot be changed to "scheduled".

**Validation Points:**
- Backend: Database trigger prevents status change

**Implementation:**
```sql
-- Database Trigger
CREATE TRIGGER trg_check_rejected_status
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_rejected_status();
```

**Error Message:** "Rejected reservations cannot become Scheduled"

---

### BR-B4-06: Approved Reservations Reserve the Time Slot

**Description:** When a reservation is approved, the time slot is reserved and protected from other approvals.

**Validation Points:**
- Backend: Overlap check considers approved status

**Implementation:**
```sql
-- Overlap check includes approved status
IF EXISTS (
    SELECT 1 FROM reservations
    WHERE facility_id = NEW.facility_id
    AND id != NEW.id
    AND status IN ('approved', 'scheduled', 'in_use')
    AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
) THEN
    RAISE EXCEPTION 'Overlapping approved schedule detected';
END IF;
```

---

### BR-B4-07: Completed Reservations Cannot Be Edited

**Description:** Once a reservation reaches "completed" status, no further modifications are allowed.

**Validation Points:**
- Backend: Database trigger blocks updates

**Implementation:**
```sql
-- Database Trigger
CREATE TRIGGER trg_check_completed_reservation
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_completed_reservation();
```

**Error Message:** "Completed reservations cannot be edited"

---

### BR-B4-08: Facilities Under Maintenance Cannot Be Reserved

**Description:** A facility with "maintenance" status cannot accept new reservations.

**Validation Points:**
- Frontend: Maintenance facilities not shown in dropdown
- Backend: Same trigger as BR-B4-01

**Implementation:** (Combined with BR-B4-01 trigger)

**Error Message:** "Facility is not active and cannot be reserved"

---

### BR-B4-09: Requesters May Modify Only Their Own Pending Requests

**Description:** A requester can only cancel reservations they submitted, and only while in "pending" status.

**Validation Points:**
- Frontend: Cancel button only shown for own pending reservations
- Backend: RLS policies enforce ownership

**Implementation:**
```sql
-- RLS Policy
CREATE POLICY "Requesters can update own pending" ON reservations
    FOR UPDATE USING (
        requester_id = auth.uid() AND status = 'pending'
    );
```

---

### BR-B4-10: Approval and Status Changes Must Be Logged

**Description:** All reservation status changes and approval/rejection actions must be recorded in the audit_logs table.

**Validation Points:**
- Backend: Database triggers automatically log changes
- Frontend: Application also logs actions

**Implementation:**
```sql
-- Database Trigger for status changes
CREATE TRIGGER trg_log_reservation_status
    AFTER UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_status_change();

-- Database Trigger for submissions
CREATE TRIGGER trg_log_reservation_submission
    AFTER INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_submission();
```

**Logged Actions:**
- reservation_submitted
- reservation_approved
- reservation_rejected
- reservation_cancelled
- status_change (generic)
- facility_created
- facility_updated
- facility_deleted

---

## Rule Enforcement Summary

| Rule | Frontend | Backend Trigger | RLS Policy | Database Constraint |
|------|:--------:|:---------------:|:----------:|:-------------------:|
| BR-B4-01 | ✓ | ✓ | - | - |
| BR-B4-02 | ✓ | - | - | ✓ |
| BR-B4-03 | ✓ | ✓ | - | - |
| BR-B4-04 | ✓ | - | ✓ | - |
| BR-B4-05 | - | ✓ | - | - |
| BR-B4-06 | - | ✓ | - | - |
| BR-B4-07 | - | ✓ | - | - |
| BR-B4-08 | ✓ | ✓ | - | - |
| BR-B4-09 | ✓ | - | ✓ | - |
| BR-B4-10 | ✓ | ✓ | - | - |
