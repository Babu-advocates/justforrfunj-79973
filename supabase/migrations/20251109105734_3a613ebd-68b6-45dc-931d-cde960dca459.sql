-- Add verification password column to admin_accounts table
ALTER TABLE public.admin_accounts 
ADD COLUMN verification_password text;

-- Set a default verification password for existing accounts (should be changed by admin)
UPDATE public.admin_accounts 
SET verification_password = 'admin123' 
WHERE verification_password IS NULL;