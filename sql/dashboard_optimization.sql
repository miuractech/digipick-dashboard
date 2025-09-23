-- Dashboard Performance Optimization Indexes
-- Run these commands to ensure optimal dashboard performance with large datasets

-- Indexes for devices table (already exist but listed for reference)
-- CREATE INDEX IF NOT EXISTS idx_devices_amc_end_date ON public.devices USING btree (amc_end_date);
-- CREATE INDEX IF NOT EXISTS idx_devices_company_id ON public.devices USING btree (company_id);
-- CREATE INDEX IF NOT EXISTS idx_devices_created_at ON public.devices USING btree (created_at);

-- Additional composite indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_devices_amc_status 
ON public.devices USING btree (amc_end_date, company_id) 
WHERE amc_end_date IS NOT NULL;

-- Index for organization searches
CREATE INDEX IF NOT EXISTS idx_company_details_search 
ON public.company_details USING gin (to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(city, '')));

-- Index for device searches
CREATE INDEX IF NOT EXISTS idx_devices_search 
ON public.devices USING gin (to_tsvector('english', device_name || ' ' || COALESCE(amc_id, '') || ' ' || COALESCE(mac_address, '')));

-- Statistics view for even faster dashboard loading (optional)
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM company_details WHERE archived = false) as total_organizations,
  (SELECT COUNT(*) FROM devices) as total_devices,
  (SELECT COUNT(*) FROM devices WHERE amc_end_date IS NOT NULL AND amc_end_date > CURRENT_DATE) as devices_in_amc,
  (SELECT COUNT(*) FROM devices WHERE amc_end_date IS NULL OR amc_end_date <= CURRENT_DATE) as devices_out_of_amc,
  (SELECT COUNT(*) FROM devices WHERE amc_end_date IS NOT NULL AND amc_end_date > CURRENT_DATE AND amc_end_date <= CURRENT_DATE + INTERVAL '7 days') as devices_expiring_soon,
  (SELECT COUNT(*) FROM devices WHERE amc_end_date IS NOT NULL AND amc_end_date < CURRENT_DATE) as devices_expired;

-- Performance monitoring query
-- Use this to check query performance
-- EXPLAIN ANALYZE SELECT * FROM devices WHERE amc_end_date < CURRENT_DATE LIMIT 20;
