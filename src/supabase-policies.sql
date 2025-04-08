-- First, check if any policies already exist and drop them
DROP POLICY IF EXISTS "anon_select" ON builds;
DROP POLICY IF EXISTS "anon_insert" ON builds;
DROP POLICY IF EXISTS "anon_update" ON builds;

-- Enable Row Level Security if it's not already enabled
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

-- Create explicit policies with clear names and permissions
-- Allow anyone to view all builds
CREATE POLICY "Allow anonymous read access to all builds"
ON builds FOR SELECT
USING (true);

-- Allow anyone to insert new builds
CREATE POLICY "Allow anonymous insert access" 
ON builds FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update builds (for likes)
CREATE POLICY "Allow anonymous update access"
ON builds FOR UPDATE
USING (true)
WITH CHECK (true);

-- Double check that RLS is not preventing access
-- For testing purposes, you might want to disable RLS temporarily to see if that's the issue
-- ALTER TABLE builds DISABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'builds';

-- Check if there are any builds in the table
SELECT COUNT(*) FROM builds; 