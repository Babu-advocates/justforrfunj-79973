-- Create table for litigation case edit access requests
CREATE TABLE public.litigation_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  litigation_case_id UUID NOT NULL REFERENCES public.litigation_cases(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  case_no TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'declined'))
);

-- Enable RLS
ALTER TABLE public.litigation_edit_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view edit requests
CREATE POLICY "Anyone can view edit requests"
ON public.litigation_edit_requests
FOR SELECT
USING (true);

-- Allow litigation users to create edit requests
CREATE POLICY "Litigation users can create edit requests"
ON public.litigation_edit_requests
FOR INSERT
WITH CHECK (true);

-- Allow admin to update edit requests
CREATE POLICY "Admin can update edit requests"
ON public.litigation_edit_requests
FOR UPDATE
USING (true);

-- Create index for better performance
CREATE INDEX idx_litigation_edit_requests_status ON public.litigation_edit_requests(status);
CREATE INDEX idx_litigation_edit_requests_case_id ON public.litigation_edit_requests(litigation_case_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_litigation_edit_requests_updated_at
BEFORE UPDATE ON public.litigation_edit_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();