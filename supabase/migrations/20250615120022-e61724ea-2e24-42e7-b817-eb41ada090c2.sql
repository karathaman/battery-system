
-- حذف الحقول من جدول العملاء
ALTER TABLE public.customers
  DROP COLUMN IF EXISTS message_sent,
  DROP COLUMN IF EXISTS last_message_sent;

-- إعادة تسمية الحقول
ALTER TABLE public.customers
  RENAME COLUMN last_purchase TO last_sale;

ALTER TABLE public.customers
  RENAME COLUMN total_purchases TO total_sold_quantity;
