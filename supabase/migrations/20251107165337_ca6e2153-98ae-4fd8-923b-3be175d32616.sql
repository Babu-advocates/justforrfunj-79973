-- Add phone_number column to employee_accounts table
ALTER TABLE public.employee_accounts 
ADD COLUMN phone_number text;

-- Add a comment to describe the column
COMMENT ON COLUMN public.employee_accounts.phone_number IS 'Phone number of the employee for contact purposes';