# Quick Setup Guide

> Only ONE file to run: `supabase/schema.sql`. It creates everything
> (tables, privileges, RLS policies, triggers, seed facilities, demo user
> links) and is safe to re-run. Do **not** hand-edit or delete rows in the
> internal `auth` schema — that corrupts Supabase's Auth service and breaks
> login with HTTP 500 "Database error querying schema".

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/log in
2. Click "New Project"
3. Enter project name: `facility-reservation`
4. Set a database password
5. Choose a region close to you
6. Click "Create new project"
7. Wait for project to be ready

## Step 2: Create Test Users (do this BEFORE running the schema)

1. Go to **Authentication** > **Users**
2. Click **Add user** (tick "Auto Confirm User")
3. Create these users:

| Email | Password | Display Name |
|-------|----------|--------------|
| admin@test.com | password123 | System Administrator |
| staff@test.com | password123 | Facility Staff Member |
| user@test.com | password123 | Regular Requester |

## Step 3: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

`schema.sql` also auto-links the three demo users to their roles
(administrator / facility_staff / requester). No manual role editing needed.
Re-run it any time profiles go missing — it is idempotent.

## Step 4: Get API Credentials

1. Go to **Settings** (gear icon) > **API**
2. Copy the **Project URL** (looks like: https://xxxx.supabase.co)
3. Copy the **anon/public** key

## Step 5: Configure the App

1. Open `js/config.js` in your code editor
2. Replace the Project URL and anon key with your own
3. Save the file

## Step 6: Test Locally

1. Open `index.html` in your browser
2. Login with one of the test accounts
3. Test the features

## Step 7: Deploy to GitHub

### Option A: Using GitHub Desktop
1. Open GitHub Desktop
2. File > Add Local Repository
3. Select the `facility-reservation-system` folder
4. Publish repository
5. Go to repository Settings > Pages
6. Select "main" branch
7. Save

### Option B: Using Git Command Line
```bash
cd facility-reservation-system
git init
git add .
git commit -m "Initial commit: Facility Reservation System"
git remote add origin https://github.com/YOUR_USERNAME/facility-reservation-system.git
git push -u origin main
```

Then go to Settings > Pages > Select "main" branch.

## Step 8: Get Your URLs

After deployment:
- **GitHub Repository URL**: https://github.com/YOUR_USERNAME/facility-reservation-system
- **Live GitHub Pages URL**: https://YOUR_USERNAME.github.io/facility-reservation-system/

## Troubleshooting

### "Supabase not configured" error
- Make sure you updated `js/config.js` with your credentials
- Make sure there are no typos in the URL or key

### Login fails with HTTP 500 "Database error querying schema"
- This is a server-side Auth (GoTrue) failure, usually caused by manually
  deleting rows from `auth.users` or otherwise editing the `auth` schema.
- Fix: **Project Settings → Database → Reset** (or restore a backup from
  before the corruption), then re-create the demo users via
  **Authentication > Users**, then re-run `supabase/schema.sql`.
- Never run `DELETE FROM auth.users` directly again.

### Login fails (user exists but no profile)
- The demo user has no row in the `users` table. Re-run `supabase/schema.sql`
  to auto-link profiles, or create the user in Authentication and re-run it.

### Features not working
- Open browser console (F12) to see error messages
- Check that the database schema was applied successfully
- The "Tracking Prevention blocked access to storage" message in Edge is a
  browser privacy warning, not an app bug — test in an incognito/Edge-InPrivate
  window or another browser if sessions don't persist.
