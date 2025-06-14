
-- Add missing columns to vouchers table to match the service interface
ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS entity_name character varying,
ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;

-- Update the voucher_type enum to remove 'all' if it exists and keep only receipt/payment
-- First check what values exist in the type column
DO $$
BEGIN
    -- Drop the existing type constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vouchers_type_check') THEN
        ALTER TABLE public.vouchers DROP CONSTRAINT vouchers_type_check;
    END IF;
    
    -- Add the correct constraint
    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_type_check CHECK (type IN ('receipt', 'payment'));
END
$$;
