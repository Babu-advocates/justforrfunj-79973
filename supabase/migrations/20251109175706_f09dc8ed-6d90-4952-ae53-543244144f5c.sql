-- Change bank_name column to support multiple bank names
ALTER TABLE bank_manager_accounts 
ALTER COLUMN bank_name TYPE text[] USING ARRAY[bank_name];

-- Update the column to allow null temporarily for data migration
ALTER TABLE bank_manager_accounts 
ALTER COLUMN bank_name DROP NOT NULL;

-- Set default empty array for new records
ALTER TABLE bank_manager_accounts 
ALTER COLUMN bank_name SET DEFAULT ARRAY[]::text[];