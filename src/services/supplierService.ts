
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Supplier, SupplierFormData, PaginatedResponse, FilterOptions } from '@/types';

const supplierService = {
  getSuppliers: async (page = 1, limit = 10, filters?: FilterOptions): Promise<PaginatedResponse<Supplier>> => {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (filters?.searchTerm || filters?.search) {
      const searchValue = filters.searchTerm || filters.search;
      query = query.or(`name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,supplier_code.ilike.%${searchValue}%`);
    }
    
    if (filters?.isBlocked !== undefined) {
      query = query.eq('is_blocked', filters.isBlocked);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error(error.message);
    }

    const suppliers: Supplier[] = (data || []).map(supplier => ({
      id: supplier.id,
      supplierCode: supplier.supplier_code,
      name: supplier.name,
      phone: supplier.phone || '',
      description: supplier.description,
      notes: supplier.notes,
      totalPurchases: supplier.total_purchases || 0,
      totalAmount: supplier.total_amount || 0,
      averagePrice: supplier.average_price || 0,
      balance: supplier.balance || 0,
      lastPurchase: supplier.last_purchase,
      purchases: [],
      isBlocked: supplier.is_blocked || false,
      blockReason: supplier.block_reason,
      messageSent: supplier.message_sent || false,
      lastMessageSent: supplier.last_message_sent,
      last2Quantities: [],
      last2Prices: [],
      last2BatteryTypes: []
    }));

    return {
      data: suppliers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  },

  createSupplier: async (data: SupplierFormData): Promise<Supplier> => {
    const { data: lastSupplier } = await supabase
      .from('suppliers')
      .select('supplier_code')
      .order('created_at', { ascending: false })
      .limit(1);
    
    const lastCode = lastSupplier?.[0]?.supplier_code;
    const nextNumber = lastCode ? parseInt(lastCode.substring(1)) + 1 : 1;
    const supplierCode = `S${String(nextNumber).padStart(3, '0')}`;

    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({
        supplier_code: supplierCode,
        name: data.name,
        phone: data.phone,
        description: data.description,
        notes: data.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw new Error(error.message);
    }

    return {
      id: newSupplier.id,
      supplierCode: newSupplier.supplier_code,
      name: newSupplier.name,
      phone: newSupplier.phone || '',
      description: newSupplier.description,
      notes: newSupplier.notes,
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      balance: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
  },

  updateSupplier: async (id: string, data: Partial<SupplierFormData & { messageSent?: boolean; lastMessageSent?: string }>): Promise<Supplier> => {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.messageSent !== undefined) updateData.message_sent = data.messageSent;
    if (data.lastMessageSent !== undefined) updateData.last_message_sent = data.lastMessageSent;

    const { data: updatedSupplier, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw new Error(error.message);
    }

    return {
      id: updatedSupplier.id,
      supplierCode: updatedSupplier.supplier_code,
      name: updatedSupplier.name,
      phone: updatedSupplier.phone || '',
      description: updatedSupplier.description,
      notes: updatedSupplier.notes,
      totalPurchases: updatedSupplier.total_purchases || 0,
      totalAmount: updatedSupplier.total_amount || 0,
      averagePrice: updatedSupplier.average_price || 0,
      balance: updatedSupplier.balance || 0,
      purchases: [],
      isBlocked: updatedSupplier.is_blocked || false,
      blockReason: updatedSupplier.block_reason,
      messageSent: updatedSupplier.message_sent || false,
      lastMessageSent: updatedSupplier.last_message_sent
    };
  },

  deleteSupplier: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw new Error(error.message);
    }
  },

  blockSupplier: async (id: string, reason: string): Promise<Supplier> => {
    const { data: blockedSupplier, error } = await supabase
      .from('suppliers')
      .update({
        is_blocked: true,
        block_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error blocking supplier:', error);
      throw new Error(error.message);
    }

    return {
      id: blockedSupplier.id,
      supplierCode: blockedSupplier.supplier_code,
      name: blockedSupplier.name,
      phone: blockedSupplier.phone || '',
      description: blockedSupplier.description,
      notes: blockedSupplier.notes,
      totalPurchases: blockedSupplier.total_purchases || 0,
      totalAmount: blockedSupplier.total_amount || 0,
      averagePrice: blockedSupplier.average_price || 0,
      balance: blockedSupplier.balance || 0,
      purchases: [],
      isBlocked: true,
      blockReason: reason,
      messageSent: blockedSupplier.message_sent || false,
      lastMessageSent: blockedSupplier.last_message_sent
    };
  },

  unblockSupplier: async (id: string): Promise<Supplier> => {
    const { data: unblockedSupplier, error } = await supabase
      .from('suppliers')
      .update({
        is_blocked: false,
        block_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error unblocking supplier:', error);
      throw new Error(error.message);
    }

    return {
      id: unblockedSupplier.id,
      supplierCode: unblockedSupplier.supplier_code,
      name: unblockedSupplier.name,
      phone: unblockedSupplier.phone || '',
      description: unblockedSupplier.description,
      notes: unblockedSupplier.notes,
      totalPurchases: unblockedSupplier.total_purchases || 0,
      totalAmount: unblockedSupplier.total_amount || 0,
      averagePrice: unblockedSupplier.average_price || 0,
      balance: unblockedSupplier.balance || 0,
      purchases: [],
      isBlocked: false,
      messageSent: unblockedSupplier.message_sent || false,
      lastMessageSent: unblockedSupplier.last_message_sent
    };
  }
};

export { supplierService };
