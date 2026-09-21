-- =====================================================
-- FACILITY RESERVATION AND SERVICE REQUEST MANAGEMENT SYSTEM
-- Database Schema for Supabase  (SINGLE SOURCE OF TRUTH)
-- Lab 4 - Section B: Role-Based Access Control
--
-- SAFE TO RE-RUN (idempotent: DROP IF EXISTS + CREATE OR REPLACE).
-- Run the ENTIRE script in Supabase Dashboard > SQL Editor.
--
-- NOTE: Do NOT manually DELETE/UPDATE from the internal `auth` schema.
-- Deleting auth.users rows corrupts the GoTrue auth service and causes
-- HTTP 500 "Database error querying schema" on login. Create/remove users
-- from Authentication > Users instead.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('administrator', 'facility_staff', 'requester')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FACILITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    capacity INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. RESERVATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'scheduled', 'in_use', 'completed', 'cancelled'
    )),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- =====================================================
-- 4. SERVICE_REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reservations_facility ON reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_requester ON reservations(requester_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- HELPER FUNCTIONS
-- SECURITY DEFINER so role checks bypass RLS on `users`
-- and avoid infinite recursion in the policies below.
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator');
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ANY(required_roles));
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- USERS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allows new signups to create their own requester profile only.
-- They can never grant themselves a staff/admin role this way.
DROP POLICY IF EXISTS "Users can create own profile" ON users;
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (
        id = auth.uid() AND role = 'requester'
    );

-- -----------------------------------------------------
-- FACILITIES
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view active facilities" ON facilities;
CREATE POLICY "Anyone can view active facilities" ON facilities
    FOR SELECT USING (
        status = 'active' OR public.has_role(ARRAY['administrator', 'facility_staff'])
    );

DROP POLICY IF EXISTS "Admins can manage facilities" ON facilities;
CREATE POLICY "Admins can manage facilities" ON facilities
    FOR ALL USING (public.is_admin());

-- -----------------------------------------------------
-- RESERVATIONS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Requesters view own reservations" ON reservations;
CREATE POLICY "Requesters view own reservations" ON reservations
    FOR SELECT USING (
        requester_id = auth.uid() OR public.has_role(ARRAY['administrator', 'facility_staff'])
    );

DROP POLICY IF EXISTS "Requesters can create reservations" ON reservations;
CREATE POLICY "Requesters can create reservations" ON reservations
    FOR INSERT WITH CHECK (
        requester_id = auth.uid() AND public.has_role(ARRAY['requester'])
    );

DROP POLICY IF EXISTS "Requesters can update own pending" ON reservations;
CREATE POLICY "Requesters can update own pending" ON reservations
    FOR UPDATE USING (requester_id = auth.uid() AND status = 'pending')
    WITH CHECK (requester_id = auth.uid() AND status IN ('pending', 'cancelled'));

DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;
CREATE POLICY "Admins can manage all reservations" ON reservations
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Staff can update reservation status" ON reservations;
CREATE POLICY "Staff can update reservation status" ON reservations
    FOR UPDATE USING (public.has_role(ARRAY['facility_staff']));

-- -----------------------------------------------------
-- SERVICE REQUESTS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage service requests" ON service_requests;
CREATE POLICY "Staff can manage service requests" ON service_requests
    FOR ALL USING (public.has_role(ARRAY['facility_staff']));

DROP POLICY IF EXISTS "Requesters view own service requests" ON service_requests;
CREATE POLICY "Requesters view own service requests" ON service_requests
    FOR SELECT USING (
        created_by = auth.uid() OR public.has_role(ARRAY['administrator', 'facility_staff'])
    );

-- -----------------------------------------------------
-- AUDIT LOGS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (public.is_admin());

-- Any logged-in user may write audit entries; anonymous requests cannot.
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGER FUNCTIONS  (always SET search_path = public)
-- =====================================================

-- Overlap check (BR-B4-03): no two approved/scheduled/in_use may overlap
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IN ('approved', 'scheduled') THEN
        IF EXISTS (
            SELECT 1 FROM reservations
            WHERE facility_id = NEW.facility_id
            AND id != NEW.id
            AND status IN ('approved', 'scheduled', 'in_use')
            AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
        ) THEN
            RAISE EXCEPTION 'Overlapping approved schedule detected (BR-B4-03)';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_overlap ON reservations;
CREATE TRIGGER trg_check_reservation_overlap
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_reservation_overlap();

-- Active-facility check (BR-B4-01 / BR-B4-08).
-- Runs on INSERT and UPDATE, and only cares about live reservations,
-- so a facility put into maintenance also blocks later approvals.
CREATE OR REPLACE FUNCTION check_facility_available()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IN ('pending', 'approved', 'scheduled', 'in_use')
       AND EXISTS (
            SELECT 1 FROM facilities
            WHERE id = NEW.facility_id
            AND status != 'active'
       ) THEN
        RAISE EXCEPTION 'Facility is not active and cannot be reserved (BR-B4-01, BR-B4-08)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_facility_available ON reservations;
CREATE TRIGGER trg_check_facility_available
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_facility_available();

-- Complete is terminal (BR-B4-07)
CREATE OR REPLACE FUNCTION check_completed_reservation()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    IF OLD.status = 'completed' THEN
        RAISE EXCEPTION 'Completed reservations cannot be edited (BR-B4-07)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_completed_reservation ON reservations;
CREATE TRIGGER trg_check_completed_reservation
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_completed_reservation();

-- Rejected is terminal toward scheduled (BR-B4-05)
CREATE OR REPLACE FUNCTION check_rejected_status()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    IF OLD.status = 'rejected' AND NEW.status = 'scheduled' THEN
        RAISE EXCEPTION 'Rejected reservations cannot become Scheduled (BR-B4-05)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_rejected_status ON reservations;
CREATE TRIGGER trg_check_rejected_status
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_rejected_status();

-- BR-B4-04: only administrators may approve/reject/schedule.
-- Staff may still drive scheduled -> in_use -> completed.
CREATE OR REPLACE FUNCTION enforce_approval_only_admin()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IN ('approved', 'rejected', 'scheduled')
       AND NOT public.is_admin()
       AND NOT public.has_role(ARRAY['administrator']) THEN
        RAISE EXCEPTION 'Only Administrator may approve/reject reservations (BR-B4-04)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_approval_only_admin ON reservations;
CREATE TRIGGER trg_enforce_approval_only_admin
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_approval_only_admin();

-- =====================================================
-- AUDIT LOGGING (BR-B4-10) -- DB triggers are the ONLY writer,
-- the frontend no longer inserts duplicate audit rows.
-- =====================================================

CREATE OR REPLACE FUNCTION log_reservation_status_change()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (
            auth.uid(),
            'status_change',
            'reservations',
            NEW.id,
            jsonb_build_object(
                'status', OLD.status
            ),
            jsonb_build_object(
                'status', NEW.status,
                'approved_by', NEW.approved_by,
                'approved_at', NEW.approved_at,
                'rejection_reason', NEW.rejection_reason
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_reservation_status ON reservations;
CREATE TRIGGER trg_log_reservation_status
    AFTER UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_status_change();

CREATE OR REPLACE FUNCTION log_reservation_submission()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
        auth.uid(),
        'reservation_submitted',
        'reservations',
        NEW.id,
        jsonb_build_object(
            'facility_id', NEW.facility_id,
            'start_time', NEW.start_time,
            'end_time', NEW.end_time,
            'status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_reservation_submission ON reservations;
CREATE TRIGGER trg_log_reservation_submission
    AFTER INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_submission();

-- =====================================================
-- PRIVILEGES (scoped, never blanket GRANT ALL to the anon role)
-- Placed AFTER the tables/functions exist so re-runs never hit 42P01.
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE facilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE facilities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE service_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO anon, authenticated;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Sample facilities (skip if any already exist)
INSERT INTO facilities (name, description, location, capacity, status)
SELECT * FROM (VALUES
    ('Conference Room A', 'Large conference room with projector', 'Building 1, Floor 2', 20, 'active'),
    ('Meeting Room B', 'Small meeting room', 'Building 1, Floor 1', 8, 'active'),
    ('Training Hall', 'Training and seminar hall', 'Building 2, Floor 1', 50, 'active'),
    ('Executive Boardroom', 'Boardroom for executive meetings', 'Building 1, Floor 3', 15, 'active'),
    ('Audio Visual Room', 'Room with AV equipment', 'Building 2, Floor 2', 25, 'active')
) AS seed(name, description, location, capacity, status)
WHERE NOT EXISTS (SELECT 1 FROM facilities);

-- =====================================================
-- AUTO-LINK USER PROFILES
-- Links EVERY confirmed user from auth.users to the users table.
-- Roles: admin@test.com -> administrator, staff@test.com ->
-- facility_staff, everything else -> requester.
-- Run AFTER creating users in Authentication > Users.
-- (do NOT delete rows from auth.users manually -- see header note).
-- Safe to re-run.
-- =====================================================
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT u.id, u.email,
       COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
       CASE u.email
            WHEN 'admin@test.com' THEN 'administrator'
            WHEN 'staff@test.com' THEN 'facility_staff'
            ELSE 'requester'
       END,
       true
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT email, role, is_active FROM public.users ORDER BY role;
SELECT name, status FROM public.facilities ORDER BY name;