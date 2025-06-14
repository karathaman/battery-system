
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

export interface ExtendedSale extends Sale {
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
  getSales: async (): Promise<ExtendedSale[]> => {
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

  createSale: async (data: SaleFormData): Promise<ExtendedSale> => {
    // For now, we'll create the sale manually until the RPC functions are created
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Create the sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: data.customer_id,
        date: data.date,
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        payment_method: data.payment_method,
        notes: data.notes,
        status: 'completed'
      })
      .select()
      .single();

    if (saleError) {
      console.error('Error creating sale:', saleError);
      throw new Error(saleError.message);
    }

    // Create sale items
    const saleItems = data.items.map(item => ({
      sale_id: saleData.id,
      battery_type_id: item.battery_type_id,
      quantity: item.quantity,
      price_per_kg: item.price_per_kg,
      total: item.quantity * item.price_per_kg
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('Error creating sale items:', itemsError);
      throw new Error(itemsError.message);
    }

    // Fetch the created sale with all details
    const { data: completeSale, error: fetchError } = await supabase
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
      .eq('id', saleData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching created sale:', fetchError);
      throw new Error(fetchError.message);
    }

    return {
      id: completeSale.id,
      invoiceNumber: completeSale.invoice_number,
      date: completeSale.date,
      customerId: completeSale.customer_id,
      customerName: completeSale.customers?.name || '',
      items: (completeSale.sale_items || []).map(item => ({
        id: item.id,
        batteryType: item.battery_types?.name || '',
        quantity: item.quantity,
        price: item.price_per_kg,
        total: item.total
      })),
      subtotal: completeSale.subtotal,
      discount: completeSale.discount || 0,
      tax: completeSale.tax || 0,
      total: completeSale.total,
      paymentMethod: completeSale.payment_method,
      status: completeSale.status || 'completed',
      customer: completeSale.customers,
      sale_items: completeSale.sale_items
    };
  },

  updateSale: async (id: string, data: Partial<SaleFormData>): Promise<ExtendedSale> => {
    // Update the sale
    const { error: saleError } = await supabase
      .from('sales')
      .update({
        customer_id: data.customer_id,
        date: data.date,
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        payment_method: data.payment_method,
        notes: data.notes
      })
      .eq('id', id);

    if (saleError) {
      console.error('Error updating sale:', saleError);
      throw new Error(saleError.message);
    }

    // Delete existing sale items
    const { error: deleteError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (deleteError) {
      console.error('Error deleting sale items:', deleteError);
      throw new Error(deleteError.message);
    }

    // Create new sale items
    if (data.items) {
      const saleItems = data.items.map(item => ({
        sale_id: id,
        battery_type_id: item.battery_type_id,
        quantity: item.quantity,
        price_per_kg: item.price_per_kg,
        total: item.quantity * item.price_per_kg
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Error creating sale items:', itemsError);
        throw new Error(itemsError.message);
      }
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
    // Delete sale items first
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (itemsError) {
      console.error('Error deleting sale items:', itemsError);
      throw new Error(itemsError.message);
    }

    // Delete the sale
    const { error: saleError } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (saleError) {
      console.error('Error deleting sale:', saleError);
      throw new Error(saleError.message);
    }
  }
};

export { salesService, type ExtendedSale, type SaleFormData };
