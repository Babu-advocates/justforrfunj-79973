-- Fix RLS policies for bank_manager_accounts to allow updates
DROP POLICY IF EXISTS "Allow public to update bank manager accounts" ON public.bank_manager_accounts;

CREATE POLICY "Allow public to update bank manager accounts"
ON public.bank_manager_accounts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Fix RLS policies for bank_accounts to allow updates
DROP POLICY IF EXISTS "Authenticated users can update bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Allow public to update bank accounts" ON public.bank_accounts;

CREATE POLICY "Allow public to update bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (true)
WITH CHECK (true);