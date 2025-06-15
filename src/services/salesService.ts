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

// Map UI payment methods to database enum values
const mapPaymentMethod = (paymentMethod: string): "cash" | "card" | "bank_transfer" | "check" => {
  switch (paymentMethod) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    case 'transfer':
      return 'bank_transfer';
    case 'credit':
    case 'check':
      return 'check';
    default:
      return 'cash';
  }
};

// Helper function to update customer balance for credit sales
const updateCustomerBalance = async (customerId: string, amount: number, isAdd: boolean = true) => {
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('balance')
    .eq('id', customerId)
    .single();

  if (fetchError) {
    console.error('Error fetching customer:', fetchError);
    throw new Error('فشل في جلب بيانات العميل');
  }

  const currentBalance = customer.balance || 0;
  const newBalance = isAdd ? currentBalance + amount : currentBalance - amount;

  const { error: updateError } = await supabase
    .from('customers')
    .update({ balance: newBalance })
    .eq('id', customerId);

  if (updateError) {
    console.error('Error updating customer balance:', updateError);
    throw new Error('فشل في تحديث رصيد العميل');
  }
};

// Helper function to update battery type quantities
const updateBatteryTypeQuantities = async (items: Array<{battery_type_id: string, quantity: number}>, isDecrease: boolean = true) => {
  for (const item of items) {
    const { data: batteryType, error: fetchError } = await supabase
      .from('battery_types')
      .select('currentQty')
      .eq('id', item.battery_type_id)
      .single();

    if (fetchError) {
      console.error('Error fetching battery type:', fetchError);
      continue; // Don't stop the whole process for one item
    }

    const currentQty = batteryType.currentQty || 0;
    const newQty = isDecrease ? currentQty - item.quantity : currentQty + item.quantity;

    const { error: updateError } = await supabase
      .from('battery_types')
      .update({ currentQty: Math.max(0, newQty) }) // Ensure quantity doesn't go negative
      .eq('id', item.battery_type_id);

    if (updateError) {
      console.error('Error updating battery type quantity:', updateError);
    }
  }
};

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
      invoiceNumber: sale.invoice_number || `INV-${sale.id?.substring(0, 8)}`,
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
        payment_method: mapPaymentMethod(data.payment_method),
        notes: data.notes,
        status: 'completed'
      })
      .select()
      .single();

    if (saleError) {
      console.error('Error creating sale:', saleError);
      throw new Error(saleError.message);
    }

    // --- تحديث تاريخ آخر بيع للعميل هنا ---
    const { error: lastPurchaseError } = await supabase
      .from('customers')
      .update({ last_purchase: data.date })
      .eq('id', data.customer_id);
    if (lastPurchaseError) {
      console.error('فشل في تحديث تاريخ آخر بيع للعميل:', lastPurchaseError);
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

    // Update customer balance if payment method is credit
    if (data.payment_method === 'credit') {
      await updateCustomerBalance(data.customer_id, data.total, true);
    }

    // Update battery type quantities (decrease for sales)
    await updateBatteryTypeQuantities(data.items, true);

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
      invoiceNumber: completeSale.invoice_number || `INV-${completeSale.id?.substring(0, 8)}`,
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
    // First, get the original sale data to revert changes
    const { data: originalSale, error: fetchOriginalError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(*)
      `)
      .eq('id', id)
      .single();

    if (fetchOriginalError) {
      console.error('Error fetching original sale:', fetchOriginalError);
      throw new Error('فشل في جلب بيانات الفاتورة الأصلية');
    }

    console.log('Original sale payment method:', originalSale.payment_method);

    // Revert the original sale effects
    if (originalSale.payment_method === 'check') { // credit sales are stored as 'check' in DB
      console.log('Reverting customer balance for credit sale:', originalSale.total);
      await updateCustomerBalance(originalSale.customer_id, originalSale.total, false);
    }

    // Revert battery quantities (add back the sold quantities)
    if (originalSale.sale_items) {
      const originalItems = originalSale.sale_items.map(item => ({
        battery_type_id: item.battery_type_id,
        quantity: item.quantity
      }));
      await updateBatteryTypeQuantities(originalItems, false);
    }

    // Update the sale
    const updateData: any = {};
    if (data.customer_id !== undefined) updateData.customer_id = data.customer_id;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.tax !== undefined) updateData.tax = data.tax;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.payment_method !== undefined) updateData.payment_method = mapPaymentMethod(data.payment_method);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error: saleError } = await supabase
      .from('sales')
      .update(updateData)
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

      // Apply new sale effects
      console.log('New payment method:', data.payment_method);
      if (data.payment_method === 'credit' && data.customer_id && data.total) {
        console.log('Adding customer balance for credit sale:', data.total);
        await updateCustomerBalance(data.customer_id, data.total, true);
      }

      // Update battery quantities for new items
      await updateBatteryTypeQuantities(data.items, true);
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
      invoiceNumber: saleData.invoice_number || `INV-${saleData.id?.substring(0, 8)}`,
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
    // First, get the sale data to revert its effects
    const { data: saleToDelete, error: fetchError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching sale to delete:', fetchError);
      throw new Error('فشل في جلب بيانات الفاتورة');
    }

    // Revert customer balance if it was a credit sale
    if (saleToDelete.payment_method === 'check') { // credit sales
      await updateCustomerBalance(saleToDelete.customer_id, saleToDelete.total, false);
    }

    // Revert battery quantities (add back the sold quantities)
    if (saleToDelete.sale_items) {
      const items = saleToDelete.sale_items.map(item => ({
        battery_type_id: item.battery_type_id,
        quantity: item.quantity
      }));
      await updateBatteryTypeQuantities(items, false);
    }

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

export { salesService };
