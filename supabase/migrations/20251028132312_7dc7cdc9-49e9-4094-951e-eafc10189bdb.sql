-- Create litigation case history table
CREATE TABLE public.litigation_case_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  litigation_case_id UUID NOT NULL REFERENCES public.litigation_cases(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  judge_name TEXT NOT NULL,
  business_on_date DATE NOT NULL,
  hearing_date DATE NOT NULL,
  purpose_of_hearing TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.litigation_case_history ENABLE ROW LEVEL SECURITY;

-- Create policies for case history
CREATE POLICY "Anyone can view case history"
  ON public.litigation_case_history
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create case history"
  ON public.litigation_case_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update case history"
  ON public.litigation_case_history
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete case history"
  ON public.litigation_case_history
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_litigation_case_history_updated_at
  BEFORE UPDATE ON public.litigation_case_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups by case
CREATE INDEX idx_litigation_case_history_case_id ON public.litigation_case_history(litigation_case_id);