# Role-Permission Matrix

## Role Definitions

| Role | Description |
|------|-------------|
| **Administrator** | Full system access. Manages facilities, users, approvals, views reports and audit logs |
| **Facility Staff** | Operational access. Views reservations, confirms usage, records completion, creates service requests |
| **Requester** | Limited access. Views facilities, submits reservations, manages own requests |

## Permission Matrix

| Permission | Administrator | Facility Staff | Requester |
|------------|:------------:|:--------------:|:---------:|
| **Facilities** | | | |
| View Active Facilities | ✓ | ✓ | ✓ |
| View All Facilities | ✓ | ✓ | - |
| Create Facility | ✓ | - | - |
| Update Facility | ✓ | - | - |
| Delete Facility | ✓ | - | - |
| Change Facility Status | ✓ | - | - |
| **Reservations** | | | |
| View All Reservations | ✓ | ✓ | - |
| View Own Reservations | ✓ | ✓ | ✓ |
| Submit Reservation | - | - | ✓ |
| Approve Reservation | ✓ | - | - |
| Reject Reservation | ✓ | - | - |
| Cancel Own Pending Reservation | - | - | ✓ |
| Mark In Use | - | ✓ | - |
| Complete Reservation | - | ✓ | - |
| **Service Requests** | | | |
| View Service Requests | ✓ | ✓ | - |
| Create Service Request | - | ✓ | - |
| Update Service Request Status | - | ✓ | - |
| **Users** | | | |
| View All Users | ✓ | - | - |
| View Own Profile | ✓ | ✓ | ✓ |
| **Audit Logs** | | | |
| View Audit Logs | ✓ | - | - |
| View Own Activity | ✓ | ✓ | ✓ |
| **Reports** | | | |
| View Dashboard | ✓ | ✓ | ✓ |
| View System Reports | ✓ | - | - |

## Functional Access by Role

### Administrator Functions
```
┌─────────────────────────────────────────────────────────────┐
│ Administrator Dashboard                                      │
├─────────────────────────────────────────────────────────────┤
│ • Total Facilities Count                                     │
│ • Total Reservations Count                                   │
│ • Pending Approvals Count                                    │
│ • Recent Activity (Audit Logs)                               │
├─────────────────────────────────────────────────────────────┤
│ Navigation Items:                                            │
│ • Dashboard                                                  │
│ • Facilities Management (CRUD)                               │
│ • All Reservations (View/Approve/Reject)                     │
│ • Approval Queue                                             │
│ • Service Requests (View)                                    │
│ • User Management                                            │
│ • Audit Logs                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Facility Staff Functions
```
┌─────────────────────────────────────────────────────────────┐
│ Facility Staff Dashboard                                     │
├─────────────────────────────────────────────────────────────┤
│ • Scheduled Today Count                                      │
│ • Currently In Use Count                                     │
│ • Open Service Requests Count                                │
├─────────────────────────────────────────────────────────────┤
│ Navigation Items:                                            │
│ • Dashboard                                                  │
│ • Facilities (View Active)                                   │
│ • All Reservations (View/Update Status)                      │
│ • Service Requests (Create/Manage)                           │
└─────────────────────────────────────────────────────────────┘
```

### Requester Functions
```
┌─────────────────────────────────────────────────────────────┐
│ Requester Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│ • Pending Reservations Count                                 │
│ • Approved Reservations Count                                │
│ • My Reservations Total                                      │
├─────────────────────────────────────────────────────────────┤
│ Navigation Items:                                            │
│ • Dashboard                                                  │
│ • Facilities (View Active Only)                              │
│ • New Reservation                                            │
│ • My Reservations (View/Cancel Pending)                      │
└─────────────────────────────────────────────────────────────┘
```

## Database Access (Row Level Security)

| Table | Administrator | Facility Staff | Requester |
|-------|:------------:|:--------------:|:---------:|
| users | Full Access | Read (all) | Read (own) |
| facilities | Full Access | Read (active + inactive) | Read (active only) |
| reservations | Full Access | Read (all) + Update status | Create (own) + Read (own) + Update (own pending) |
| service_requests | Read (all) | Full Access | Read (own) |
| audit_logs | Read (all) | - | - |

## Action Logging (Audit Trail)

| Action | Who Can Perform | Logged In Audit |
|--------|----------------|:---------------:|
| reservation_submitted | Requester | ✓ |
| reservation_approved | Administrator | ✓ |
| reservation_rejected | Administrator | ✓ |
| reservation_cancelled | Requester | ✓ |
| status_change | Facility Staff | ✓ |
| facility_created | Administrator | ✓ |
| facility_updated | Administrator | ✓ |
| facility_deleted | Administrator | ✓ |
| user_login | Any User | ✓ |
