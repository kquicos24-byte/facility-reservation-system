# Facility Reservation System

A Role-Based Facility Reservation and Approval System built with HTML/CSS/JavaScript and Supabase.

## Features

- **Role-Based Access Control**: Administrator, Facility Staff, and Requester roles
- **Reservation Workflow**: Submit → Approve/Reject → Schedule → In Use → Complete
- **Conflict Detection**: Prevents overlapping approved reservations
- **Audit Logging**: Tracks all critical system actions
- **Business Rules Enforcement**: 10 business rules implemented

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Hosting**: GitHub Pages

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your Project URL and Anon Key

### 2. Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy and run the contents of `supabase/schema.sql`
   (idempotent — safe to re-run; auto-links demo user roles & seeds facilities)

### 3. Configure Application

1. Open `js/config.js`
2. Replace `YOUR_SUPABASE_URL` with your Supabase project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

### 4. Create Test Users

Create users FIRST, then re-run `supabase/schema.sql` to auto-link their roles:

In Supabase Dashboard > Authentication > Users, create:

| Email | Password |
|-------|----------|
| admin@test.com | password123 |
| staff@test.com | password123 |
| user@test.com | password123 |

Roles are assigned automatically by `schema.sql` (administrator / facility_staff / requester).
Do NOT edit or delete rows in the internal `auth` schema — it breaks login with
HTTP 500 "Database error querying schema".

### 5. Deploy to GitHub Pages

1. Push code to GitHub repository
2. Go to Settings > Pages
3. Select source branch (main)
4. Your site will be available at `https://username.github.io/repo-name/`

## Project Structure

```
facility-reservation-system/
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Styling
├── js/
│   ├── config.js           # Supabase configuration
│   ├── auth.js             # Authentication module
│   ├── audit.js            # Audit logging module
│   └── app.js              # Main application logic
├── supabase/
│   └── schema.sql          # Database schema
├── docs/
│   ├── ERD.md              # Entity Relationship Diagram
│   ├── use-case-diagram.md # Use Case Diagram
│   ├── role-permission-matrix.md
│   ├── reservation-workflow.md
│   ├── business-rules.md
│   └── test-results.md
└── README.md
```

## Business Rules

| ID | Rule |
|----|------|
| BR-B4-01 | Only active facilities may be reserved |
| BR-B4-02 | Reservation start must precede end time |
| BR-B4-03 | Overlapping approved schedules are prohibited |
| BR-B4-04 | Only Administrator may approve reservations |
| BR-B4-05 | Rejected reservations cannot become Scheduled |
| BR-B4-06 | Approved reservations reserve the time slot |
| BR-B4-07 | Completed reservations cannot be edited |
| BR-B4-08 | Facilities under Maintenance cannot be reserved |
| BR-B4-09 | Requesters may modify only their own Pending requests |
| BR-B4-10 | Approval and status changes must be logged |

## Testing

See `docs/test-results.md` for detailed functional test results (TC-B4-01 to TC-B4-10).

## License

This project is for educational purposes (SAD Lab 4 - Section B).
