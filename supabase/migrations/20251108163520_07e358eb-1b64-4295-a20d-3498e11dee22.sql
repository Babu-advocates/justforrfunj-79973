-- Allow public read access to gallery bucket
CREATE POLICY "Public read access for gallery bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery');