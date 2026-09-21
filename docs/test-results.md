# Functional Test Results

## Test Summary

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|:------:|
| TC-B4-01 | Requester submits reservation | Saved as Pending | PASS |
| TC-B4-02 | Submit overlapping schedule | Conflict detected and blocked | PASS |
| TC-B4-03 | Administrator approves request | Status becomes Approved/Scheduled | PASS |
| TC-B4-04 | Administrator rejects request | Status becomes Rejected | PASS |
| TC-B4-05 | Staff marks facility In Use | Status updated | PASS |
| TC-B4-06 | Staff completes reservation | Status becomes Completed | PASS |
| TC-B4-07 | Requester edits another user request | Blocked | PASS |
| TC-B4-08 | Reserve facility under maintenance | Blocked | PASS |
| TC-B4-09 | Check audit log | Approval/status log visible | PASS |
| TC-B4-10 | Open protected page without login | Access denied | PASS |

---

## Detailed Test Cases

### TC-B4-01: Requester Submits Reservation

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-01 |
| **Precondition** | User logged in as Requester, Active facility exists |
| **Steps** | 1. Login as Requester<br>2. Navigate to New Reservation<br>3. Select facility<br>4. Enter title: "Team Meeting"<br>5. Enter start time: Tomorrow 9:00 AM<br>6. Enter end time: Tomorrow 11:00 AM<br>7. Click Submit |
| **Expected Result** | Reservation saved with status "pending" |
| **Actual Result** | Reservation created successfully with status "pending" |
| **Status** | ✅ PASS |
| **Audit Log** | Entry created: action="reservation_submitted" |

---

### TC-B4-02: Submit Overlapping Schedule

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-02 |
| **Precondition** | Existing approved reservation for Conference Room A, 10:00 AM - 12:00 PM |
| **Steps** | 1. Login as Requester<br>2. Navigate to New Reservation<br>3. Select Conference Room A<br>4. Enter start time: Today 11:00 AM<br>5. Enter end time: Today 1:00 PM<br>6. Click Submit |
| **Expected Result** | Error: "Overlapping approved schedule detected" |
| **Actual Result** | Submission blocked with conflict error message |
| **Status** | ✅ PASS |
| **Business Rule** | BR-B4-03 |

---

### TC-B4-03: Administrator Approves Request

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-03 |
| **Precondition** | Pending reservation exists |
| **Steps** | 1. Login as Administrator<br>2. Navigate to Approval Queue<br>3. View pending reservation<br>4. Click Approve |
| **Expected Result** | Status changes to "approved" then "scheduled" |
| **Actual Result** | Status updated to "scheduled" successfully |
| **Status** | ✅ PASS |
| **Audit Log** | Entry created: action="reservation_approved" |

---

### TC-B4-04: Administrator Rejects Request

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-04 |
| **Precondition** | Pending reservation exists |
| **Steps** | 1. Login as Administrator<br>2. Navigate to Approval Queue<br>3. View pending reservation<br>4. Click Reject<br>5. Enter reason: "Facility needed for maintenance" |
| **Expected Result** | Status changes to "rejected" |
| **Actual Result** | Status updated to "rejected" with reason recorded |
| **Status** | ✅ PASS |
| **Audit Log** | Entry created: action="reservation_rejected" |

---

### TC-B4-05: Staff Marks Facility In Use

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-05 |
| **Precondition** | Reservation in "scheduled" status |
| **Steps** | 1. Login as Facility Staff<br>2. Navigate to Reservations<br>3. Find scheduled reservation<br>4. Click "Mark In Use" |
| **Expected Result** | Status changes to "in_use" |
| **Actual Result** | Status updated to "in_use" successfully |
| **Status** | ✅ PASS |
| **Audit Log** | Entry created: action="status_change" |

---

### TC-B4-06: Staff Completes Reservation

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-06 |
| **Precondition** | Reservation in "in_use" status |
| **Steps** | 1. Login as Facility Staff<br>2. Navigate to Reservations<br>3. Find in-use reservation<br>4. Click "Complete" |
| **Expected Result** | Status changes to "completed" |
| **Actual Result** | Status updated to "completed" successfully |
| **Status** | ✅ PASS |
| **Audit Log** | Entry created: action="status_change" |

---

### TC-B4-07: Requester Edits Another User Request

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-07 |
| **Precondition** | Another user's reservation exists |
| **Steps** | 1. Login as Requester A<br>2. Navigate to Reservations<br>3. Attempt to view/edit Requester B's reservation |
| **Expected Result** | Action blocked, reservation not visible |
| **Actual Result** | Other user's reservations not shown in My Reservations |
| **Status** | ✅ PASS |
| **Business Rule** | BR-B4-09 |

---

### TC-B4-08: Reserve Facility Under Maintenance

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-08 |
| **Precondition** | Facility with status "maintenance" |
| **Steps** | 1. Login as Requester<br>2. Navigate to Facilities<br>3. Observe maintenance facility not available for reservation |
| **Expected Result** | Maintenance facility not shown or blocked |
| **Actual Result** | Maintenance facilities filtered from reservation form |
| **Status** | ✅ PASS |
| **Business Rule** | BR-B4-08 |

---

### TC-B4-09: Check Audit Log

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-09 |
| **Precondition** | Previous reservation actions have been performed |
| **Steps** | 1. Login as Administrator<br>2. Navigate to Audit Logs<br>3. Verify entries for:<br>   - Reservation submitted<br>   - Reservation approved<br>   - Status changes |
| **Expected Result** | All actions logged with timestamps and user info |
| **Actual Result** | Audit log shows all reservation activities |
| **Status** | ✅ PASS |
| **Business Rule** | BR-B4-10 |

---

### TC-B4-10: Open Protected Page Without Login

| Field | Value |
|-------|-------|
| **Test ID** | TC-B4-10 |
| **Precondition** | User not logged in |
| **Steps** | 1. Open application URL<br>2. Observe login page displayed<br>3. Attempt to access app sections directly |
| **Expected Result** | Access denied, login page shown |
| **Actual Result** | Unauthenticated users see only login page |
| **Status** | ✅ PASS |

---

## Test Environment

| Component | Details |
|-----------|---------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Supabase (PostgreSQL) |
| Browser | Chrome, Firefox, Edge |
| OS | Windows 11 |
| Hosting | GitHub Pages |

## Test Execution Notes

1. All tests were executed manually through the web interface
2. Database triggers were verified through Supabase SQL Editor
3. RLS policies were tested by attempting unauthorized access
4. Audit logs were verified in the Audit Logs section
5. Edge cases tested include:
   - Same start and end time (rejected by BR-B4-02)
   - Reserving a facility that becomes maintenance after submission
   - Attempting to approve own reservation as administrator
   - Attempting to cancel a non-pending reservation
