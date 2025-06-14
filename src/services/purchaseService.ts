
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
    console.log('Updating supplier stats for:', supplierId);
    
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
      const { error: resetError } = await supabase
        .from('suppliers')
        .update({
          total_purchases: 0,
          total_amount: 0,
          average_price: 0,
          last_purchase: null,
          balance: 0
        })
        .eq('id', supplierId);
      
      if (resetError) {
        console.error('Error resetting supplier stats:', resetError);
      } else {
        console.log('Supplier stats reset successfully');
      }
      return;
    }

    // Calculate totals
    let totalQuantity = 0;
    let totalAmount = 0;
    let balance = 0;
    let lastPurchaseDate = purchases[0].date;

    purchases.forEach(purchase => {
      // Sum quantities from purchase items
      if (purchase.purchase_items && Array.isArray(purchase.purchase_items)) {
        totalQuantity += purchase.purchase_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      
      // Sum total amounts
      totalAmount += purchase.total || 0;
      
      // Add to balance ONLY if payment method is credit/deferred
      if (purchase.payment_method === 'credit' || purchase.payment_method === 'check' || purchase.payment_method === 'bank_transfer') {
        balance += purchase.total || 0;
      }
      
      // Find latest purchase date
      if (purchase.date > lastPurchaseDate) {
        lastPurchaseDate = purchase.date;
      }
    });

    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    console.log('Calculated stats:', {
      totalQuantity,
      totalAmount,
      averagePrice,
      lastPurchaseDate,
      balance
    });

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
    } else {
      console.log('Supplier stats updated successfully');
    }
  } catch (error) {
    console.error('Error in updateSupplierStats:', error);
  }
};

const updateBatteryTypeQuantity = async (batteryTypeId: string, quantityChange: number) => {
  try {
    console.log('Updating battery type quantity:', { batteryTypeId, quantityChange });
    
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

    console.log('Battery type quantity update:', {
      currentQty,
      quantityChange,
      newQty: Math.max(0, newQty)
    });

    // Update quantity
    const { error: updateError } = await supabase
      .from('battery_types')
      .update({ currentQty: Math.max(0, newQty) })
      .eq('id', batteryTypeId);

    if (updateError) {
      console.error('Error updating battery type quantity:', updateError);
    } else {
      console.log('Battery type quantity updated successfully');
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

    // Transform data to match expected format
    const transformedData = (data || []).map(purchase => ({
      ...purchase,
      items: purchase.purchase_items || []
    }));

    return transformedData;
  },

  createPurchase: async (purchaseData: PurchaseFormData): Promise<Purchase> => {
    try {
      console.log('Creating purchase with data:', purchaseData);
      
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
          payment_method: purchaseData.payment_method as any,
          status: purchaseData.status as any,
          notes: purchaseData.notes
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Error creating purchase:', purchaseError);
        throw new Error(purchaseError.message);
      }

      console.log('Purchase created successfully:', newPurchase);

      // Create purchase items
      if (purchaseData.items && purchaseData.items.length > 0) {
        const itemsToInsert = purchaseData.items.map(item => ({
          purchase_id: newPurchase.id,
          battery_type_id: item.battery_type_id,
          quantity: item.quantity,
          price_per_kg: item.price_per_kg,
          total: item.total
        }));

        console.log('Creating purchase items:', itemsToInsert);

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error creating purchase items:', itemsError);
          // If items creation fails, delete the purchase
          await supabase.from('purchases').delete().eq('id', newPurchase.id);
          throw new Error(itemsError.message);
        }

        console.log('Purchase items created successfully');

        // Update battery type quantities
        for (const item of purchaseData.items) {
          await updateBatteryTypeQuantity(item.battery_type_id, item.quantity);
        }
      }

      // Update supplier stats (this will handle balance correctly based on payment method)
      await updateSupplierStats(purchaseData.supplier_id);

      console.log('Purchase creation completed successfully');

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
      console.log('Updating purchase:', id, purchaseData);
      
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
        console.error('Error fetching original purchase:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('Original purchase data:', originalPurchase);

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
          payment_method: purchaseData.payment_method as any,
          status: purchaseData.status as any,
          notes: purchaseData.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating purchase:', updateError);
        throw new Error(updateError.message);
      }

      console.log('Purchase updated successfully:', updatedPurchase);

      // Revert old battery type quantities
      if (originalPurchase.purchase_items && Array.isArray(originalPurchase.purchase_items)) {
        console.log('Reverting old battery type quantities');
        for (const item of originalPurchase.purchase_items) {
          await updateBatteryTypeQuantity(item.battery_type_id, -item.quantity);
        }
      }

      // Delete old purchase items
      const { error: deleteItemsError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);

      if (deleteItemsError) {
        console.error('Error deleting old purchase items:', deleteItemsError);
      } else {
        console.log('Old purchase items deleted successfully');
      }

      // Create new purchase items
      if (purchaseData.items && purchaseData.items.length > 0) {
        const itemsToInsert = purchaseData.items.map(item => ({
          purchase_id: id,
          battery_type_id: item.battery_type_id,
          quantity: item.quantity,
          price_per_kg: item.price_per_kg,
          total: item.total
        }));

        console.log('Creating new purchase items:', itemsToInsert);

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error creating new purchase items:', itemsError);
          throw new Error(itemsError.message);
        }

        console.log('New purchase items created successfully');

        // Update battery type quantities with new values
        for (const item of purchaseData.items) {
          await updateBatteryTypeQuantity(item.battery_type_id, item.quantity);
        }
      }

      // Update supplier stats for both old and new supplier (this will recalculate balance correctly)
      await updateSupplierStats(originalPurchase.supplier_id);
      if (purchaseData.supplier_id && purchaseData.supplier_id !== originalPurchase.supplier_id) {
        await updateSupplierStats(purchaseData.supplier_id);
      }

      console.log('Purchase update completed successfully');

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
      console.log('Deleting purchase:', id);
      
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
        console.error('Error fetching purchase for deletion:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('Purchase data for deletion:', purchase);

      // Revert battery type quantities BEFORE deleting the purchase
      if (purchase.purchase_items && Array.isArray(purchase.purchase_items)) {
        console.log('Reverting battery type quantities for deleted purchase');
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
        console.error('Error deleting purchase:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('Purchase deleted successfully');

      // Update supplier stats (this will recalculate balance and remove this purchase from calculations)
      await updateSupplierStats(purchase.supplier_id);

      console.log('Purchase deletion completed successfully');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  }
};

export { purchaseService, updateSupplierStats, updateBatteryTypeQuantity };
export type { Purchase, PurchaseFormData, PurchaseItem };
