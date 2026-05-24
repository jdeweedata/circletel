-- ============================================================================
-- Technician Tracking System
-- Enables field operations management with GPS tracking
-- ============================================================================

-- Drop existing objects if they exist (for clean re-run)
-- Drop views first
DROP VIEW IF EXISTS v_todays_jobs CASCADE;
DROP VIEW IF EXISTS v_technician_status CASCADE;

-- Drop policies explicitly (wrapped in DO block to handle missing tables)
DO $$ 
BEGIN
    -- Technicians policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'technicians') THEN
        DROP POLICY IF EXISTS "Admin full access to technicians" ON technicians;
        DROP POLICY IF EXISTS "Technicians view own profile" ON technicians;
        DROP POLICY IF EXISTS "Technicians update own location" ON technicians;
    END IF;
    
    -- Field jobs policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'field_jobs') THEN
        DROP POLICY IF EXISTS "Admin full access to field_jobs" ON field_jobs;
        DROP POLICY IF EXISTS "Technicians view assigned jobs" ON field_jobs;
        DROP POLICY IF EXISTS "Technicians update assigned jobs" ON field_jobs;
    END IF;
    
    -- Location logs policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'technician_location_logs') THEN
        DROP POLICY IF EXISTS "Admin full access to location_logs" ON technician_location_logs;
        DROP POLICY IF EXISTS "Technicians insert own location" ON technician_location_logs;
        DROP POLICY IF EXISTS "Technicians view own location history" ON technician_location_logs;
    END IF;
    
    -- Job status history policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'field_job_status_history') THEN
        DROP POLICY IF EXISTS "Admin full access to job_status_history" ON field_job_status_history;
        DROP POLICY IF EXISTS "Technicians view own job history" ON field_job_status_history;
    END IF;
END $$;

-- Drop tables (CASCADE will drop dependent triggers)
DROP TABLE IF EXISTS field_job_status_history CASCADE;
DROP TABLE IF EXISTS technician_location_logs CASCADE;
DROP TABLE IF EXISTS field_jobs CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_job_number() CASCADE;
DROP FUNCTION IF EXISTS set_job_number() CASCADE;
DROP FUNCTION IF EXISTS update_technician_location() CASCADE;
DROP FUNCTION IF EXISTS log_job_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_field_jobs_timestamp() CASCADE;
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;

-- ============================================================================
-- 1. TECHNICIANS TABLE
-- Stores technician profiles linked to admin users
-- ============================================================================

CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to admin user (optional - can be standalone)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Basic info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL,
    
    -- Employment details
    employee_id TEXT UNIQUE, -- e.g., "TECH-001"
    team TEXT, -- e.g., "Fibre Installation", "Wireless", "Maintenance"
    skills TEXT[], -- e.g., ["fibre_splicing", "router_config", "aerial_install"]
    
    -- Status
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_job', 'on_break', 'offline', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    
    -- Current location (updated periodically)
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    current_location_accuracy DECIMAL(10, 2), -- meters
    location_updated_at TIMESTAMPTZ,
    
    -- Device info
    device_id TEXT, -- For push notifications later
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. FIELD JOBS TABLE
-- Jobs assigned to technicians (linked to orders or standalone)
-- ============================================================================
CREATE TABLE field_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference number
    job_number TEXT UNIQUE NOT NULL, -- e.g., "JOB-20251217-001"
    
    -- Link to order (optional)
    order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Job details
    job_type TEXT NOT NULL CHECK (job_type IN (
        'fibre_installation',
        'wireless_installation', 
        'router_setup',
        'fault_repair',
        'maintenance',
        'site_survey',
        'equipment_collection',
        'other'
    )),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Location
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address_notes TEXT, -- e.g., "Gate code: 1234, ask for John"
    
    -- Customer contact
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    
    -- Scheduling
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    estimated_duration_minutes INTEGER DEFAULT 60,
    
    -- Assignment
    assigned_technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    assigned_by UUID REFERENCES auth.users(id),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Created, not assigned
        'assigned',     -- Assigned to technician
        'en_route',     -- Technician traveling to site
        'arrived',      -- Technician at site
        'in_progress',  -- Work started
        'completed',    -- Work finished
        'cancelled',    -- Job cancelled
        'on_hold'       -- Paused/waiting
    )),
    
    -- Completion details
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    completion_photos TEXT[], -- URLs to uploaded photos
    customer_signature_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 3. TECHNICIAN LOCATION LOGS
-- Historical location tracking for audit trail
-- ============================================================================
CREATE TABLE technician_location_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    job_id UUID REFERENCES field_jobs(id) ON DELETE SET NULL,
    
    -- Location data
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2), -- meters
    altitude DECIMAL(10, 2),
    heading DECIMAL(5, 2), -- degrees
    speed DECIMAL(10, 2), -- m/s
    
    -- Context
    event_type TEXT NOT NULL CHECK (event_type IN (
        'periodic',     -- Regular interval update
        'job_start',    -- Started a job
        'job_arrive',   -- Arrived at job site
        'job_complete', -- Completed a job
        'check_in',     -- Manual check-in
        'check_out'     -- End of shift
    )),
    
    -- Device info
    battery_level INTEGER, -- percentage
    is_charging BOOLEAN,
    network_type TEXT, -- wifi, 4g, 5g, etc.
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. JOB STATUS HISTORY
-- Audit trail for job status changes
-- ============================================================================
CREATE TABLE field_job_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    job_id UUID NOT NULL REFERENCES field_jobs(id) ON DELETE CASCADE,
    
    previous_status TEXT,
    new_status TEXT NOT NULL,
    
    -- Location at time of status change
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_by_technician_id UUID REFERENCES technicians(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- Technicians
CREATE INDEX idx_technicians_status ON technicians(status) WHERE is_active = true;
CREATE INDEX idx_technicians_user_id ON technicians(user_id);
CREATE INDEX idx_technicians_location ON technicians(current_latitude, current_longitude) 
    WHERE current_latitude IS NOT NULL;

-- Field Jobs
CREATE INDEX idx_field_jobs_status ON field_jobs(status);
CREATE INDEX idx_field_jobs_technician ON field_jobs(assigned_technician_id);
CREATE INDEX idx_field_jobs_scheduled ON field_jobs(scheduled_date, scheduled_time_start);
CREATE INDEX idx_field_jobs_order ON field_jobs(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_field_jobs_customer ON field_jobs(customer_id) WHERE customer_id IS NOT NULL;

-- Location Logs (time-series optimized)
CREATE INDEX idx_location_logs_technician_time ON technician_location_logs(technician_id, recorded_at DESC);
CREATE INDEX idx_location_logs_job ON technician_location_logs(job_id) WHERE job_id IS NOT NULL;

-- Job Status History
CREATE INDEX idx_job_status_history_job ON field_job_status_history(job_id, created_at DESC);

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Generate job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    seq_num INTEGER;
    new_job_number TEXT;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(job_number FROM 'JOB-' || today_date || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM field_jobs
    WHERE job_number LIKE 'JOB-' || today_date || '-%';
    
    new_job_number := 'JOB-' || today_date || '-' || LPAD(seq_num::TEXT, 3, '0');
    
    RETURN new_job_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate job number on insert
CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_number IS NULL THEN
        NEW.job_number := generate_job_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_job_number
    BEFORE INSERT ON field_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_job_number();

-- Update technician current location from logs
CREATE OR REPLACE FUNCTION update_technician_location()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE technicians
    SET 
        current_latitude = NEW.latitude,
        current_longitude = NEW.longitude,
        current_location_accuracy = NEW.accuracy,
        location_updated_at = NEW.recorded_at
    WHERE id = NEW.technician_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_technician_location
    AFTER INSERT ON technician_location_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_technician_location();

-- Log job status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO field_job_status_history (
            job_id,
            previous_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_job_status_change
    AFTER UPDATE ON field_jobs
    FOR EACH ROW
    EXECUTE FUNCTION log_job_status_change();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_field_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-set started_at when status changes to in_progress
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.started_at IS NULL THEN
        NEW.started_at = NOW();
    END IF;
    
    -- Auto-set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_field_jobs_timestamp
    BEFORE UPDATE ON field_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_field_jobs_timestamp();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users au
        JOIN auth.users u ON u.email = au.email
        WHERE u.id = auth.uid()
        AND au.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_location_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_job_status_history ENABLE ROW LEVEL SECURITY;

-- Technicians: Admin full access, technicians see own profile
CREATE POLICY "Admin full access to technicians"
    ON technicians FOR ALL
    USING (is_admin_user());

CREATE POLICY "Technicians view own profile"
    ON technicians FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Technicians update own location"
    ON technicians FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Field Jobs: Admin full access, technicians see assigned jobs
CREATE POLICY "Admin full access to field_jobs"
    ON field_jobs FOR ALL
    USING (is_admin_user());

CREATE POLICY "Technicians view assigned jobs"
    ON field_jobs FOR SELECT
    USING (
        assigned_technician_id IN (
            SELECT id FROM technicians WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Technicians update assigned jobs"
    ON field_jobs FOR UPDATE
    USING (
        assigned_technician_id IN (
            SELECT id FROM technicians WHERE user_id = auth.uid()
        )
    );

-- Location Logs: Admin full access, technicians insert own
CREATE POLICY "Admin full access to location_logs"
    ON technician_location_logs FOR ALL
    USING (is_admin_user());

CREATE POLICY "Technicians insert own location"
    ON technician_location_logs FOR INSERT
    WITH CHECK (
        technician_id IN (
            SELECT id FROM technicians WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Technicians view own location history"
    ON technician_location_logs FOR SELECT
    USING (
        technician_id IN (
            SELECT id FROM technicians WHERE user_id = auth.uid()
        )
    );

-- Job Status History: Admin full access, technicians view own jobs
CREATE POLICY "Admin full access to job_status_history"
    ON field_job_status_history FOR ALL
    USING (is_admin_user());

CREATE POLICY "Technicians view own job history"
    ON field_job_status_history FOR SELECT
    USING (
        job_id IN (
            SELECT id FROM field_jobs 
            WHERE assigned_technician_id IN (
                SELECT id FROM technicians WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- 8. VIEWS
-- ============================================================================

-- Active technicians with current job
CREATE OR REPLACE VIEW v_technician_status AS
SELECT 
    t.id,
    t.first_name,
    t.last_name,
    t.first_name || ' ' || t.last_name AS full_name,
    t.phone,
    t.employee_id,
    t.team,
    t.status,
    t.current_latitude,
    t.current_longitude,
    t.location_updated_at,
    t.is_active,
    -- Current job info
    cj.id AS current_job_id,
    cj.job_number AS current_job_number,
    cj.title AS current_job_title,
    cj.address AS current_job_address,
    cj.status AS current_job_status,
    -- Stats
    (SELECT COUNT(*) FROM field_jobs WHERE assigned_technician_id = t.id AND status = 'completed' AND completed_at >= CURRENT_DATE) AS jobs_completed_today,
    (SELECT COUNT(*) FROM field_jobs WHERE assigned_technician_id = t.id AND status IN ('assigned', 'en_route', 'arrived', 'in_progress')) AS pending_jobs
FROM technicians t
LEFT JOIN field_jobs cj ON cj.assigned_technician_id = t.id 
    AND cj.status IN ('en_route', 'arrived', 'in_progress')
WHERE t.is_active = true;

-- Today's job schedule
CREATE OR REPLACE VIEW v_todays_jobs AS
SELECT 
    j.*,
    t.first_name || ' ' || t.last_name AS technician_name,
    t.phone AS technician_phone,
    t.current_latitude AS technician_latitude,
    t.current_longitude AS technician_longitude
FROM field_jobs j
LEFT JOIN technicians t ON t.id = j.assigned_technician_id
WHERE j.scheduled_date = CURRENT_DATE
    OR j.status IN ('en_route', 'arrived', 'in_progress')
ORDER BY j.scheduled_time_start, j.priority DESC;

-- ============================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample technicians
/*
INSERT INTO technicians (first_name, last_name, phone, employee_id, team, skills, status) VALUES
('John', 'Mokoena', '+27821234567', 'TECH-001', 'Fibre Installation', ARRAY['fibre_splicing', 'router_config'], 'available'),
('Sarah', 'van der Berg', '+27829876543', 'TECH-002', 'Fibre Installation', ARRAY['fibre_splicing', 'aerial_install'], 'available'),
('Thabo', 'Ndlovu', '+27834567890', 'TECH-003', 'Wireless', ARRAY['wireless_install', 'router_config'], 'available'),
('Lisa', 'Pillay', '+27845678901', 'TECH-004', 'Maintenance', ARRAY['fault_diagnosis', 'router_config'], 'available');
*/
