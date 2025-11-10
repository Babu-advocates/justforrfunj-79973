-- Enable real-time updates for bank_manager_accounts table
ALTER TABLE public.bank_manager_accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_manager_accounts;

-- Enable real-time updates for bank_accounts table
ALTER TABLE public.bank_accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;