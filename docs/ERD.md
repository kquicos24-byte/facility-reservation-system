# Entity Relationship Diagram (ERD)

## Database Schema Overview

The system uses 5 main entities with the following relationships:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                        │
│                        Facility Reservation System - Lab 4                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│       USERS          │         │     FACILITIES        │
├──────────────────────┤         ├──────────────────────┤
│ id (PK, UUID)        │         │ id (PK, UUID)        │
│ email (UNIQUE)       │◄───────│ name                 │
│ full_name            │   1:N  │ description          │
│ role (ENUM)          │        │ location             │
│ is_active (BOOL)     │        │ capacity             │
│ created_at           │        │ status (ENUM)        │
│ updated_at           │        │ created_by (FK) ─────┤──┐
└──────────┬───────────┘        │ created_at           │  │
           │                    │ updated_at           │  │
           │                    └──────────────────────┘  │
           │                                              │
           │ 1:N                                          │
           ▼                                              │
┌──────────────────────┐        ┌──────────────────────┐  │
│    RESERVATIONS      │        │   SERVICE_REQUESTS   │  │
├──────────────────────┤        ├──────────────────────┤  │
│ id (PK, UUID)        │        │ id (PK, UUID)        │  │
│ facility_id (FK) ────┤──┐     │ facility_id (FK) ────┤──┘
│ requester_id (FK) ───┤──┤     │ created_by (FK) ─────┤
│ title                │  │     │ title                │
│ description          │  │     │ description          │
│ start_time           │  │     │ priority (ENUM)      │
│ end_time             │  │     │ status (ENUM)        │
│ status (ENUM)        │  │     │ resolved_by (FK)     │
│ approved_by (FK) ────┤──┤     │ resolved_at          │
│ approved_at          │  │     │ created_at           │
│ rejection_reason     │  │     │ updated_at           │
│ created_at           │  │     └──────────────────────┘
│ updated_at           │  │
└──────────────────────┘  │
                          │
                          │    ┌──────────────────────┐
                          │    │     AUDIT_LOGS        │
                          │    ├──────────────────────┤
                          └───►│ id (PK, UUID)        │
                               │ user_id (FK) ────────┤──► USERS
                               │ action               │
                               │ table_name           │
                               │ record_id (UUID)     │
                               │ old_values (JSONB)   │
                               │ new_values (JSONB)   │
                               │ ip_address           │
                               │ user_agent           │
                               │ created_at           │
                               └──────────────────────┘
```

## Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| USERS → FACILITIES | 1:N | A user (admin) can create multiple facilities |
| USERS → RESERVATIONS | 1:N | A user (requester) can submit multiple reservations |
| USERS → SERVICE_REQUESTS | 1:N | A user (staff) can create multiple service requests |
| FACILITIES → RESERVATIONS | 1:N | A facility can have multiple reservations |
| FACILITIES → SERVICE_REQUESTS | 1:N | A facility can have multiple service requests |
| USERS → AUDIT_LOGS | 1:N | A user can have multiple audit log entries |

## Enums

### Users.role
- `administrator`
- `facility_staff`
- `requester`

### Facilities.status
- `active`
- `inactive`
- `maintenance`

### Reservations.status
- `pending`
- `approved`
- `rejected`
- `scheduled`
- `in_use`
- `completed`
- `cancelled`

### Service_Requests.priority
- `low`
- `medium`
- `high`
- `urgent`

### Service_Requests.status
- `open`
- `in_progress`
- `resolved`
- `closed`
