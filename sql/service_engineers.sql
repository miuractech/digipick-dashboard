-- Service Engineers table
CREATE TABLE IF NOT EXISTS service_engineers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_number VARCHAR(50) NOT NULL,
    comments TEXT,
    expertise TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_engineers_name ON service_engineers(name);
CREATE INDEX IF NOT EXISTS idx_service_engineers_email ON service_engineers(email);
CREATE INDEX IF NOT EXISTS idx_service_engineers_expertise ON service_engineers USING GIN(expertise);

-- Add constraint to ensure expertise values are valid
ALTER TABLE service_engineers 
ADD CONSTRAINT check_expertise_values 
CHECK (
    expertise <@ ARRAY['demo_installation', 'repair', 'service', 'calibration']::TEXT[]
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_engineers_updated_at 
    BEFORE UPDATE ON service_engineers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies if needed
-- ALTER TABLE service_engineers ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment if you need RLS)
-- CREATE POLICY "Users can view service engineers" ON service_engineers
--     FOR SELECT USING (true);

-- CREATE POLICY "Admins can manage service engineers" ON service_engineers
--     FOR ALL USING (auth.role() = 'admin');
