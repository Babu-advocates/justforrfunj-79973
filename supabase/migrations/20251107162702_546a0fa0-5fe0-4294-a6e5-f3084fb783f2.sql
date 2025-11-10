-- Add separate columns for office branch, branch name, and owner name to applications table
ALTER TABLE public.applications
ADD COLUMN office_branch text,
ADD COLUMN branch_name text,
ADD COLUMN owner_name text;