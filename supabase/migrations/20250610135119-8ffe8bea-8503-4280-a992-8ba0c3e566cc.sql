
-- Create enum types
CREATE TYPE public.entity_type AS ENUM ('customer', 'supplier');
CREATE TYPE public.voucher_type AS ENUM ('receipt', 'payment', 'all');
CREATE TYPE public.status_type AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'check');

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT,
  notes TEXT,
  last_purchase DATE,
  total_purchases INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  average_price DECIMAL(10,2) DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  message_sent BOOLEAN DEFAULT FALSE,
  last_message_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT,
  notes TEXT,
  last_purchase DATE,
  total_purchases INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  average_price DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  message_sent BOOLEAN DEFAULT FALSE,
  last_message_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create battery types table
CREATE TABLE public.battery_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  status status_type DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  battery_type_id UUID NOT NULL REFERENCES public.battery_types(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_kg DECIMAL(10,2) NOT NULL CHECK (price_per_kg > 0),
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  date DATE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  status status_type DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase items table
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  battery_type_id UUID NOT NULL REFERENCES public.battery_types(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_kg DECIMAL(10,2) NOT NULL CHECK (price_per_kg > 0),
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number VARCHAR(100) UNIQUE NOT NULL,
  date DATE NOT NULL,
  type voucher_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_type entity_type NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_vat DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  status status_type DEFAULT 'pending',
  notes TEXT,
  reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voucher items table
CREATE TABLE public.voucher_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vat DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE
);

-- Create task groups table
CREATE TABLE public.task_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for tasks and task groups
CREATE TABLE public.task_group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_group_id UUID NOT NULL REFERENCES public.task_groups(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_group_id, task_id)
);

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX idx_suppliers_phone ON public.suppliers(phone);
CREATE INDEX idx_suppliers_supplier_code ON public.suppliers(supplier_code);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_date ON public.purchases(date);
CREATE INDEX idx_vouchers_entity_id ON public.vouchers(entity_id);
CREATE INDEX idx_vouchers_date ON public.vouchers(date);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);

-- Insert some default battery types
INSERT INTO public.battery_types (name, description, unit_price) VALUES
('بطاريات عادية', 'بطاريات عادية للسيارات', 250.00),
('بطاريات جافة', 'بطاريات جافة عالية الجودة', 300.00),
('بطاريات الشاحنات', 'بطاريات للشاحنات والمعدات الثقيلة', 450.00),
('بطاريات المولدات', 'بطاريات للمولدات الكهربائية', 350.00);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battery_types_updated_at BEFORE UPDATE ON public.battery_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate voucher entity references using triggers instead of check constraints
CREATE OR REPLACE FUNCTION validate_voucher_entity_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entity_type = 'customer' THEN
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Referenced customer does not exist';
    END IF;
  ELSIF NEW.entity_type = 'supplier' THEN
    IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Referenced supplier does not exist';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to validate voucher entity references
CREATE TRIGGER validate_voucher_entity_reference_trigger
  BEFORE INSERT OR UPDATE ON public.vouchers
  FOR EACH ROW EXECUTE FUNCTION validate_voucher_entity_reference();
