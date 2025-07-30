-- Create missing enum types (PostgreSQL compatible)
DO $$ 
BEGIN
    -- Create shift_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status') THEN
        CREATE TYPE shift_status AS ENUM ('open', 'closed', 'full');
    END IF;
    
    -- Create registration_status enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
        CREATE TYPE registration_status AS ENUM ('active', 'pending_removal');
    END IF;
END $$;