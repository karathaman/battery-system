
-- Add balance column to customers table
ALTER TABLE public.customers 
ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;

-- Update the trigger to handle the new column
-- The existing update_updated_at_column trigger will continue to work for the updated_at column
