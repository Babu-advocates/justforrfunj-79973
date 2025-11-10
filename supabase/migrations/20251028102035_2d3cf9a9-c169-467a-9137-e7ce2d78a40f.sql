-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload employee files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update employee files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete employee files" ON storage.objects;

-- Create permissive policies that work with custom auth
CREATE POLICY "Anyone can upload employee files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'employee-files');

CREATE POLICY "Anyone can update employee files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'employee-files');

CREATE POLICY "Anyone can delete employee files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'employee-files');