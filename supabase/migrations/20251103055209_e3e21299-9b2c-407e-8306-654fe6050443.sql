-- Drop all UPDATE policies and recreate for bank_manager_accounts
DROP POLICY IF EXISTS "Allow public to update bank manager accounts" ON public.bank_manager_accounts;
DROP POLICY IF EXISTS "Authenticated users can update bank manager accounts" ON public.bank_manager_accounts;

CREATE POLICY "Enable update for all users"
ON public.bank_manager_accounts
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);