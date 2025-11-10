-- Create bank_manager_accounts table
CREATE TABLE public.bank_manager_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bank_manager_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for bank_manager_accounts
CREATE POLICY "Allow public to read bank manager accounts for login"
ON public.bank_manager_accounts
FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow public to insert bank manager accounts"
ON public.bank_manager_accounts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public to update bank manager accounts"
ON public.bank_manager_accounts
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bank_manager_accounts_updated_at
BEFORE UPDATE ON public.bank_manager_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();