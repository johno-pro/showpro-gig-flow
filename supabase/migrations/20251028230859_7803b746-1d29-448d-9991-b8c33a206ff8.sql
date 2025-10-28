-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage parks" ON locations;
DROP POLICY IF EXISTS "Managers can view parks" ON locations;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can read locations"
ON locations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert locations"
ON locations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
ON locations FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete locations"
ON locations FOR DELETE
TO authenticated
USING (true);