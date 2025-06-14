
import { supabase } from '@/integrations/supabase/client';
import { Sale } from '@/types/sales';

export interface SaleFormData {
  customer_id: string;
  date: string;
  items: Array<{
    battery_type_id: string;
    quantity: number;
    price_per_kg: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  notes?: string;
}

export interface SaleData extends Sale {
  customer?: {
    id: string;
    name: string;
    customer_code: string;
    balance: number;
  };
  sale_items?: Array<{
    id: string;
    battery_type_id: string;
    quantity: number;
    price_per_kg: number;
    total: number;
    battery_types?: {
      name: string;
    };
  }>;
}

const salesService = {
  getSales: async (): Promise<SaleData[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers!inner(id, name, customer_code, balance),
        sale_items(
          id,
          battery_type_id,
          quantity,
          price_per_kg,
          total,
          battery_types(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      throw new Error(error.message);
    }

    return (data || []).map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoice_number,
      date: sale.date,
      customerId: sale.customer_id,
      customerName: sale.customers?.name || '',
      items: (sale.sale_items || []).map(item => ({
        id: item.id,
        batteryType: item.battery_types?.name || '',
        quantity: item.quantity,
        price: item.price_per_kg,
        total: item.total
      })),
      subtotal: sale.subtotal,
      discount: sale.discount || 0,
      tax: sale.tax || 0,
      total: sale.total,
      paymentMethod: sale.payment_method,
      status: sale.status || 'completed',
      customer: sale.customers,
      sale_items: sale.sale_items
    }));
  },

  createSale: async (data: SaleFormData): Promise<SaleData> => {
    const { data: result, error } = await supabase.rpc('create_sale_with_items', {
      p_customer_id: data.customer_id,
      p_date: data.date,
      p_items: data.items,
      p_subtotal: data.subtotal,
      p_discount: data.discount,
      p_tax: data.tax,
      p_total: data.total,
      p_payment_method: data.payment_method,
      p_notes: data.notes
    });

    if (error) {
      console.error('Error creating sale:', error);
      throw new Error(error.message);
    }

    // Fetch the created sale with all details
    const { data: saleData, error: fetchError } = await supabase
      .from('sales')
      .select(`
        *,
        customers!inner(id, name, customer_code, balance),
        sale_items(
          id,
          battery_type_id,
          quantity,
          price_per_kg,
          total,
          battery_types(name)
        )
      `)
      .eq('id', result)
      .single();

    if (fetchError) {
      console.error('Error fetching created sale:', fetchError);
      throw new Error(fetchError.message);
    }

    return {
      id: saleData.id,
      invoiceNumber: saleData.invoice_number,
      date: saleData.date,
      customerId: saleData.customer_id,
      customerName: saleData.customers?.name || '',
      items: (saleData.sale_items || []).map(item => ({
        id: item.id,
        batteryType: item.battery_types?.name || '',
        quantity: item.quantity,
        price: item.price_per_kg,
        total: item.total
      })),
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      total: saleData.total,
      paymentMethod: saleData.payment_method,
      status: saleData.status || 'completed',
      customer: saleData.customers,
      sale_items: saleData.sale_items
    };
  },

  updateSale: async (id: string, data: Partial<SaleFormData>): Promise<SaleData> => {
    const { data: result, error } = await supabase.rpc('update_sale_with_items', {
      p_sale_id: id,
      p_customer_id: data.customer_id,
      p_date: data.date,
      p_items: data.items,
      p_subtotal: data.subtotal,
      p_discount: data.discount,
      p_tax: data.tax,
      p_total: data.total,
      p_payment_method: data.payment_method,
      p_notes: data.notes
    });

    if (error) {
      console.error('Error updating sale:', error);
      throw new Error(error.message);
    }

    // Fetch the updated sale with all details
    const { data: saleData, error: fetchError } = await supabase
      .from('sales')
      .select(`
        *,
        customers!inner(id, name, customer_code, balance),
        sale_items(
          id,
          battery_type_id,
          quantity,
          price_per_kg,
          total,
          battery_types(name)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated sale:', fetchError);
      throw new Error(fetchError.message);
    }

    return {
      id: saleData.id,
      invoiceNumber: saleData.invoice_number,
      date: saleData.date,
      customerId: saleData.customer_id,
      customerName: saleData.customers?.name || '',
      items: (saleData.sale_items || []).map(item => ({
        id: item.id,
        batteryType: item.battery_types?.name || '',
        quantity: item.quantity,
        price: item.price_per_kg,
        total: item.total
      })),
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      total: saleData.total,
      paymentMethod: saleData.payment_method,
      status: saleData.status || 'completed',
      customer: saleData.customers,
      sale_items: saleData.sale_items
    };
  },

  deleteSale: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_sale_with_revert', {
      p_sale_id: id
    });

    if (error) {
      console.error('Error deleting sale:', error);
      throw new Error(error.message);
    }
  }
};

export { salesService, type SaleData, type SaleFormData };
