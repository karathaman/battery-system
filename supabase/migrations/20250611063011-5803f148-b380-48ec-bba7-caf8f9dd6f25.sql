
-- Create daily purchases table for temporary purchase entries
CREATE TABLE public.daily_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_code VARCHAR(50),
  supplier_phone VARCHAR(50),
  battery_type VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_kg DECIMAL(10,2) NOT NULL CHECK (price_per_kg > 0),
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  discount DECIMAL(10,2) DEFAULT 0,
  final_total DECIMAL(10,2) NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance on date queries
CREATE INDEX idx_daily_purchases_date ON public.daily_purchases(date);
CREATE INDEX idx_daily_purchases_supplier_phone ON public.daily_purchases(supplier_phone);

-- Create trigger for updating timestamps
CREATE TRIGGER update_daily_purchases_updated_at BEFORE UPDATE ON public.daily_purchases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
