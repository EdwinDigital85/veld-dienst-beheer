-- Create missing enum types
CREATE TYPE IF NOT EXISTS shift_status AS ENUM ('open', 'closed', 'full');
CREATE TYPE IF NOT EXISTS registration_status AS ENUM ('active', 'pending_removal');