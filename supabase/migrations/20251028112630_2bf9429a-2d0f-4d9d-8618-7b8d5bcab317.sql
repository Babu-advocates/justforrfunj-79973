-- Add DELETE policy for bank employees to delete their own applications
CREATE POLICY "Banks can delete their own applications"
ON public.applications
FOR DELETE
USING (submitted_by IS NOT NULL);