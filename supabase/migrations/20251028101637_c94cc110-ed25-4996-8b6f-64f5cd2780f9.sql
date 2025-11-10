-- Create storage bucket for employee files
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-files', 'employee-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for employee files bucket
CREATE POLICY "Anyone can view employee files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'employee-files');

CREATE POLICY "Authenticated users can upload employee files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'employee-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update employee files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'employee-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete employee files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'employee-files' 
  AND auth.role() = 'authenticated'
);