CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    contact_email VARCHAR(150),
    contact_phone VARCHAR(30),
    address VARCHAR(255),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30),
    department VARCHAR(100),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_users_org_status ON users(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_orgs_code ON organizations(code);

CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(40) NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    destination VARCHAR(255) NOT NULL,
    destination_latitude DOUBLE PRECISION,
    destination_longitude DOUBLE PRECISION,
    booking_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    booking_notes VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    cancellation_reason VARCHAR(500),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rides_org_id ON rides(organization_id);
CREATE INDEX IF NOT EXISTS idx_rides_emp_id ON rides(employee_id);
CREATE INDEX IF NOT EXISTS idx_rides_booking_ref ON rides(booking_reference);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(booking_date);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_vehicle_id ON rides(vehicle_id);



DROP TABLE IF EXISTS drivers CASCADE;

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    license_expiry_date DATE NOT NULL,
    driver_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    availability_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_drivers_org_license UNIQUE (organization_id, license_number)
);

CREATE INDEX IF NOT EXISTS idx_drivers_org_id ON drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(driver_status);
CREATE INDEX IF NOT EXISTS idx_drivers_availability ON drivers(availability_status);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    manufacturing_year INT,
    seating_capacity INT NOT NULL CHECK (seating_capacity > 0),
    vehicle_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    availability_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    maintenance_status VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    insurance_expiry_date DATE,
    permit_expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_vehicles_org_registration UNIQUE (organization_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(vehicle_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_availability ON vehicles(availability_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_maintenance ON vehicles(maintenance_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);

-- Supabase PostgreSQL Row-Level Security (RLS) Policies for Tenant Isolation
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicles_org_select_policy ON vehicles;
CREATE POLICY vehicles_org_select_policy ON vehicles
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

DROP POLICY IF EXISTS vehicles_org_insert_policy ON vehicles;
CREATE POLICY vehicles_org_insert_policy ON vehicles
    FOR INSERT
    WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

DROP POLICY IF EXISTS vehicles_org_update_policy ON vehicles;
CREATE POLICY vehicles_org_update_policy ON vehicles
    FOR UPDATE
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

DROP POLICY IF EXISTS vehicles_org_delete_policy ON vehicles;
CREATE POLICY vehicles_org_delete_policy ON vehicles
    FOR DELETE
    USING (false);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rides_org_select_policy ON rides;
CREATE POLICY rides_org_select_policy ON rides
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

DROP POLICY IF EXISTS rides_org_insert_policy ON rides;
CREATE POLICY rides_org_insert_policy ON rides
    FOR INSERT
    WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

DROP POLICY IF EXISTS rides_org_update_policy ON rides;
CREATE POLICY rides_org_update_policy ON rides
    FOR UPDATE
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

CREATE TABLE IF NOT EXISTS ride_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    accuracy DOUBLE PRECISION CHECK (accuracy >= 0),
    speed DOUBLE PRECISION CHECK (speed >= 0),
    heading DOUBLE PRECISION CHECK (heading >= 0 AND heading <= 360),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_id ON ride_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_recorded_at ON ride_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_ride_locations_org_id ON ride_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_recorded ON ride_locations(ride_id, recorded_at DESC);

ALTER TABLE ride_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ride_locations_org_select_policy ON ride_locations;
CREATE POLICY ride_locations_org_select_policy ON ride_locations
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP',
    channel_status VARCHAR(30) NOT NULL DEFAULT 'DELIVERED',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_user_select_policy ON notifications;
CREATE POLICY notifications_user_select_policy ON notifications
    FOR SELECT
    USING (recipient_user_id = (SELECT id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

DROP POLICY IF EXISTS notifications_user_update_policy ON notifications;
CREATE POLICY notifications_user_update_policy ON notifications
    FOR UPDATE
    USING (recipient_user_id = (SELECT id FROM users WHERE id = auth.uid() OR email = current_setting('request.jwt.claims.email', true)));

CREATE TABLE IF NOT EXISTS ride_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments VARCHAR(1000),
    review_status VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_ride_feedback_ride_employee UNIQUE (ride_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_org_id ON ride_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ride_id ON ride_feedback(ride_id);
CREATE INDEX IF NOT EXISTS idx_feedback_employee_id ON ride_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_feedback_driver_id ON ride_feedback(driver_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON ride_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_review_status ON ride_feedback(review_status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON ride_feedback(created_at);

ALTER TABLE ride_feedback ENABLE ROW LEVEL SECURITY;






