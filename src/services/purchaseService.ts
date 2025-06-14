
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PurchaseItem {
  battery_type_id: string;
  quantity: number;
  price_per_kg: number;
  total: number;
}

interface PurchaseFormData {
  invoice_number: string;
  date: string;
  supplier_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  notes?: string;
  items: PurchaseItem[];
}

interface Purchase {
  id: string;
  invoice_number: string;
  date: string;
  supplier_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  notes?: string;
  items: PurchaseItem[];
}

const updateSupplierStats = async (supplierId: string) => {
  try {
    // Get all purchases for this supplier
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        id,
        date,
        total,
        payment_method,
        purchase_items (
          quantity,
          total
        )
      `)
      .eq('supplier_id', supplierId);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return;
    }

    if (!purchases || purchases.length === 0) {
      // Reset supplier stats if no purchases
      await supabase
        .from('suppliers')
        .update({
          total_purchases: 0,
          total_amount: 0,
          average_price: 0,
          last_purchase: null,
          balance: 0
        })
        .eq('id', supplierId);
      return;
    }

    // Calculate totals
    let totalQuantity = 0;
    let totalAmount = 0;
    let balance = 0;
    let lastPurchaseDate = purchases[0].date;

    purchases.forEach(purchase => {
      // Sum quantities from purchase items
      if (purchase.purchase_items) {
        totalQuantity += purchase.purchase_items.reduce((sum, item) => sum + item.quantity, 0);
      }
      
      // Sum total amounts
      totalAmount += purchase.total;
      
      // Add to balance if payment method is credit/اجل
      if (purchase.payment_method === 'credit' || purchase.payment_method === 'اجل') {
        balance += purchase.total;
      }
      
      // Find latest purchase date
      if (purchase.date > lastPurchaseDate) {
        lastPurchaseDate = purchase.date;
      }
    });

    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    // Update supplier stats
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        total_purchases: totalQuantity,
        total_amount: totalAmount,
        average_price: averagePrice,
        last_purchase: lastPurchaseDate,
        balance: balance
      })
      .eq('id', supplierId);

    if (updateError) {
      console.error('Error updating supplier stats:', updateError);
    }
  } catch (error) {
    console.error('Error in updateSupplierStats:', error);
  }
};

const updateBatteryTypeQuantity = async (batteryTypeId: string, quantityChange: number) => {
  try {
    // Get current quantity
    const { data: batteryType, error: fetchError } = await supabase
      .from('battery_types')
      .select('currentQty')
      .eq('id', batteryTypeId)
      .single();

    if (fetchError) {
      console.error('Error fetching battery type:', fetchError);
      return;
    }

    const currentQty = batteryType?.currentQty || 0;
    const newQty = currentQty + quantityChange;

    // Update quantity
    const { error: updateError } = await supabase
      .from('battery_types')
      .update({ currentQty: Math.max(0, newQty) })
      .eq('id', batteryTypeId);

    if (updateError) {
      console.error('Error updating battery type quantity:', updateError);
    }
  } catch (error) {
    console.error('Error in updateBatteryTypeQuantity:', error);
  }
};

const purchaseService = {
  getPurchases: async (): Promise<Purchase[]> => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        purchase_items (
          id,
          battery_type_id,
          quantity,
          price_per_kg,
          total
        ),
        suppliers (
          name,
          supplier_code
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  createPurchase: async (purchaseData: PurchaseFormData): Promise<Purchase> => {
    try {
      // Create purchase
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          invoice_number: purchaseData.invoice_number,
          date: purchaseData.date,
          supplier_id: purchaseData.supplier_id,
          subtotal: purchaseData.subtotal,
          discount: purchaseData.discount,
          tax: purchaseData.tax,
          total: purchaseData.total,
          payment_method: purchaseData.payment_method,
          status: purchaseData.status,
          notes: purchaseData.notes
        })
        .select()
        .single();

      if (purchaseError) {
        throw new Error(purchaseError.message);
      }

      // Create purchase items
      if (purchaseData.items && purchaseData.items.length > 0) {
        const itemsToInsert = purchaseData.items.map(item => ({
          purchase_id: newPurchase.id,
          battery_type_id: item.battery_type_id,
          quantity: item.quantity,
          price_per_kg: item.price_per_kg,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert);

        if (itemsError) {
          // If items creation fails, delete the purchase
          await supabase.from('purchases').delete().eq('id', newPurchase.id);
          throw new Error(itemsError.message);
        }

        // Update battery type quantities
        for (const item of purchaseData.items) {
          await updateBatteryTypeQuantity(item.battery_type_id, item.quantity);
        }
      }

      // Update supplier stats
      await updateSupplierStats(purchaseData.supplier_id);

      return {
        ...newPurchase,
        items: purchaseData.items
      };
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  },

  updatePurchase: async (id: string, purchaseData: Partial<PurchaseFormData>): Promise<Purchase> => {
    try {
      // Get original purchase data for comparison
      const { data: originalPurchase, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items (
            id,
            battery_type_id,
            quantity,
            price_per_kg,
            total
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Update purchase
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({
          invoice_number: purchaseData.invoice_number,
          date: purchaseData.date,
          supplier_id: purchaseData.supplier_id,
          subtotal: purchaseData.subtotal,
          discount: purchaseData.discount,
          tax: purchaseData.tax,
          total: purchaseData.total,
          payment_method: purchaseData.payment_method,
          status: purchaseData.status,
          notes: purchaseData.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Revert old battery type quantities
      if (originalPurchase.purchase_items) {
        for (const item of originalPurchase.purchase_items) {
          await updateBatteryTypeQuantity(item.battery_type_id, -item.quantity);
        }
      }

      // Delete old purchase items
      await supabase.from('purchase_items').delete().eq('purchase_id', id);

      // Create new purchase items
      if (purchaseData.items && purchaseData.items.length > 0) {
        const itemsToInsert = purchaseData.items.map(item => ({
          purchase_id: id,
          battery_type_id: item.battery_type_id,
          quantity: item.quantity,
          price_per_kg: item.price_per_kg,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert);

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        // Update battery type quantities with new values
        for (const item of purchaseData.items) {
          await updateBatteryTypeQuantity(item.battery_type_id, item.quantity);
        }
      }

      // Update supplier stats for both old and new supplier
      await updateSupplierStats(originalPurchase.supplier_id);
      if (purchaseData.supplier_id && purchaseData.supplier_id !== originalPurchase.supplier_id) {
        await updateSupplierStats(purchaseData.supplier_id);
      }

      return {
        ...updatedPurchase,
        items: purchaseData.items || []
      };
    } catch (error) {
      console.error('Error updating purchase:', error);
      throw error;
    }
  },

  deletePurchase: async (id: string): Promise<void> => {
    try {
      // Get purchase data before deletion
      const { data: purchase, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          supplier_id,
          purchase_items (
            battery_type_id,
            quantity
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Revert battery type quantities
      if (purchase.purchase_items) {
        for (const item of purchase.purchase_items) {
          await updateBatteryTypeQuantity(item.battery_type_id, -item.quantity);
        }
      }

      // Delete purchase (items will be deleted due to cascade)
      const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update supplier stats
      await updateSupplierStats(purchase.supplier_id);
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  }
};

export { purchaseService, updateSupplierStats, updateBatteryTypeQuantity };
export type { Purchase, PurchaseFormData, PurchaseItem };
