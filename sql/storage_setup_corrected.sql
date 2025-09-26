-- Storage Setup for Service Request Files (Supabase Compatible)
-- This file contains SQL helper functions and views for service request file management
--
-- IMPORTANT: Storage bucket and RLS policies must be created through Supabase Dashboard
-- You cannot create storage buckets or policies directly via SQL in Supabase
--
-- =============================================================================
-- MANUAL SETUP REQUIRED IN SUPABASE DASHBOARD:
-- =============================================================================
-- 1. Go to Storage → Buckets in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Set the following:
--    - Name: service-files
--    - Public: Yes (checked)
--    - File size limit: 52428800 (50MB)
--    - Allowed MIME types: image/*, video/*, application/pdf, text/plain
-- 4. Click "Save"
-- 5. Go to Storage → Policies
-- 6. Add the policies listed at the bottom of this file
-- =============================================================================

-- 1. Helper function to validate file types (can be used in application logic)
CREATE OR REPLACE FUNCTION is_valid_service_file_type(mime_type text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN mime_type IN (
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
END;
$$;

-- 2. Helper function to validate file size
CREATE OR REPLACE FUNCTION is_valid_service_file_size(file_size bigint)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN file_size <= 52428800; -- 50MB limit
END;
$$;

-- 3. Function to clean up old files (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_service_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_record RECORD;
    delete_count INTEGER := 0;
BEGIN
    -- Find service requests with files older than 2 years and status completed/cancelled
    FOR file_record IN
        SELECT uploaded_file_url
        FROM service_requests 
        WHERE uploaded_file_url IS NOT NULL
          AND created_at < NOW() - INTERVAL '2 years'
          AND status IN ('completed', 'cancelled')
    LOOP
        -- Log the cleanup (you might want to store this in a log table)
        RAISE NOTICE 'Would delete old file: %', file_record.uploaded_file_url;
        delete_count := delete_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Found % old files for potential cleanup', delete_count;
    -- Note: Actual file deletion from storage would need to be done via the Supabase client
END;
$$;

-- 4. Function to get file statistics from service requests
CREATE OR REPLACE FUNCTION get_service_files_stats()
RETURNS TABLE (
    total_files_referenced bigint,
    files_by_type json,
    recent_uploads json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE uploaded_file_url IS NOT NULL) as total_files_referenced,
        json_object_agg(
            uploaded_reference, 
            COUNT(*)
        ) FILTER (WHERE uploaded_reference IS NOT NULL) as files_by_type,
        json_agg(
            json_build_object(
                'ticket_no', ticket_no,
                'uploaded_reference', uploaded_reference,
                'created_at', created_at
            )
            ORDER BY created_at DESC
        ) FILTER (WHERE uploaded_file_url IS NOT NULL) as recent_uploads
    FROM (
        SELECT ticket_no, uploaded_reference, uploaded_file_url, created_at
        FROM service_requests 
        WHERE uploaded_file_url IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
    ) recent;
END;
$$;

-- 5. View for easier file management
CREATE OR REPLACE VIEW service_request_files AS
SELECT 
    sr.id as service_request_id,
    sr.ticket_no,
    sr.uploaded_file_url,
    sr.uploaded_reference,
    sr.product,
    sr.service_type,
    sr.status,
    sr.created_at as request_created_at,
    cd.name as organization_name
FROM service_requests sr
LEFT JOIN company_details cd ON sr.organization_id = cd.id
WHERE sr.uploaded_file_url IS NOT NULL;

-- 6. Function to get storage usage by organization
CREATE OR REPLACE FUNCTION get_organization_file_usage(org_id uuid)
RETURNS TABLE (
    organization_name text,
    total_files bigint,
    files_by_status json,
    recent_files json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.name as organization_name,
        COUNT(*) FILTER (WHERE sr.uploaded_file_url IS NOT NULL) as total_files,
        json_object_agg(
            sr.status, 
            COUNT(*) FILTER (WHERE sr.uploaded_file_url IS NOT NULL)
        ) as files_by_status,
        json_agg(
            json_build_object(
                'ticket_no', sr.ticket_no,
                'file_type', sr.uploaded_reference,
                'created_at', sr.created_at
            )
            ORDER BY sr.created_at DESC
        ) FILTER (WHERE sr.uploaded_file_url IS NOT NULL) as recent_files
    FROM service_requests sr
    JOIN company_details cd ON sr.organization_id = cd.id
    WHERE sr.organization_id = org_id
    GROUP BY cd.name;
END;
$$;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_valid_service_file_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_service_file_size(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION get_service_files_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_file_usage(uuid) TO authenticated;
GRANT SELECT ON service_request_files TO authenticated;

-- Grant admin functions to service_role only
GRANT EXECUTE ON FUNCTION cleanup_old_service_files() TO service_role;

-- =============================================================================
-- STORAGE POLICIES TO ADD MANUALLY IN SUPABASE DASHBOARD:
-- =============================================================================
-- 
-- Go to Storage → service-files bucket → Policies and add these:
--
-- Policy 1: "Users can upload service files"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: true
-- WITH CHECK expression: bucket_id = 'service-files'
--
-- Policy 2: "Users can view service files"  
-- Operation: SELECT
-- Target roles: authenticated
-- USING expression: bucket_id = 'service-files'
--
-- Policy 3: "Users can delete their own service files"
-- Operation: DELETE  
-- Target roles: authenticated
-- USING expression: bucket_id = 'service-files' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 4: "Service role has full access"
-- Operation: ALL
-- Target roles: service_role
-- USING expression: bucket_id = 'service-files'
-- =============================================================================

-- Sample usage queries:
-- SELECT * FROM get_service_files_stats();
-- SELECT * FROM service_request_files WHERE organization_name = 'Your Company';
-- SELECT * FROM get_organization_file_usage('your-org-uuid-here');
-- SELECT is_valid_service_file_type('image/jpeg'); -- Returns true
-- SELECT is_valid_service_file_size(1000000); -- Returns true for 1MB file
