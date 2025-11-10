-- Allow 'revoked' as a valid status for litigation_edit_requests
-- Drop the existing constraint and recreate it including 'revoked'
ALTER TABLE public.litigation_edit_requests
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.litigation_edit_requests
ADD CONSTRAINT valid_status CHECK (
  status = ANY (ARRAY['pending','approved','declined','revoked']::text[])
);
