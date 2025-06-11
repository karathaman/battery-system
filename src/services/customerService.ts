
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Customer, CustomerFormData, PaginatedResponse, FilterOptions } from '@/types';

const customerService = {
  getCustomers: async (page = 1, limit = 10, filters?: FilterOptions): Promise<PaginatedResponse<Customer>> => {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (filters?.searchTerm || filters?.search) {
      const searchValue = filters.searchTerm || filters.search;
      query = query.or(`name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,customer_code.ilike.%${searchValue}%`);
    }
    
    if (filters?.isBlocked !== undefined) {
      query = query.eq('is_blocked', filters.isBlocked);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error(error.message);
    }

    const customers: Customer[] = (data || []).map(customer => ({
      id: customer.id,
      customerCode: customer.customer_code,
      name: customer.name,
      phone: customer.phone || '',
      description: customer.description,
      notes: customer.notes,
      totalPurchases: customer.total_purchases || 0,
      totalAmount: customer.total_amount || 0,
      averagePrice: customer.average_price || 0,
      lastPurchase: customer.last_purchase,
      purchases: [],
      isBlocked: customer.is_blocked || false,
      blockReason: customer.block_reason,
      messageSent: customer.message_sent || false,
      lastMessageSent: customer.last_message_sent,
      last2Quantities: [],
      last2Prices: [],
      last2BatteryTypes: []
    }));

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  },

  createCustomer: async (data: CustomerFormData): Promise<Customer> => {
    const { data: lastCustomer } = await supabase
      .from('customers')
      .select('customer_code')
      .order('created_at', { ascending: false })
      .limit(1);
    
    const lastCode = lastCustomer?.[0]?.customer_code;
    const nextNumber = lastCode ? parseInt(lastCode.substring(1)) + 1 : 1;
    const customerCode = `C${String(nextNumber).padStart(3, '0')}`;

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        customer_code: customerCode,
        name: data.name,
        phone: data.phone,
        description: data.description,
        notes: data.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw new Error(error.message);
    }

    return {
      id: newCustomer.id,
      customerCode: newCustomer.customer_code,
      name: newCustomer.name,
      phone: newCustomer.phone || '',
      description: newCustomer.description,
      notes: newCustomer.notes,
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
  },

  updateCustomer: async (id: string, data: Partial<CustomerFormData & { messageSent?: boolean; lastMessageSent?: string }>): Promise<Customer> => {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.messageSent !== undefined) updateData.message_sent = data.messageSent;
    if (data.lastMessageSent !== undefined) updateData.last_message_sent = data.lastMessageSent;

    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw new Error(error.message);
    }

    return {
      id: updatedCustomer.id,
      customerCode: updatedCustomer.customer_code,
      name: updatedCustomer.name,
      phone: updatedCustomer.phone || '',
      description: updatedCustomer.description,
      notes: updatedCustomer.notes,
      totalPurchases: updatedCustomer.total_purchases || 0,
      totalAmount: updatedCustomer.total_amount || 0,
      averagePrice: updatedCustomer.average_price || 0,
      purchases: [],
      isBlocked: updatedCustomer.is_blocked || false,
      blockReason: updatedCustomer.block_reason,
      messageSent: updatedCustomer.message_sent || false,
      lastMessageSent: updatedCustomer.last_message_sent
    };
  },

  deleteCustomer: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      throw new Error(error.message);
    }
  },

  blockCustomer: async (id: string, reason: string): Promise<Customer> => {
    const { data: blockedCustomer, error } = await supabase
      .from('customers')
      .update({
        is_blocked: true,
        block_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error blocking customer:', error);
      throw new Error(error.message);
    }

    return {
      id: blockedCustomer.id,
      customerCode: blockedCustomer.customer_code,
      name: blockedCustomer.name,
      phone: blockedCustomer.phone || '',
      description: blockedCustomer.description,
      notes: blockedCustomer.notes,
      totalPurchases: blockedCustomer.total_purchases || 0,
      totalAmount: blockedCustomer.total_amount || 0,
      averagePrice: blockedCustomer.average_price || 0,
      purchases: [],
      isBlocked: true,
      blockReason: reason,
      messageSent: blockedCustomer.message_sent || false,
      lastMessageSent: blockedCustomer.last_message_sent
    };
  },

  unblockCustomer: async (id: string): Promise<Customer> => {
    const { data: unblockedCustomer, error } = await supabase
      .from('customers')
      .update({
        is_blocked: false,
        block_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error unblocking customer:', error);
      throw new Error(error.message);
    }

    return {
      id: unblockedCustomer.id,
      customerCode: unblockedCustomer.customer_code,
      name: unblockedCustomer.name,
      phone: unblockedCustomer.phone || '',
      description: unblockedCustomer.description,
      notes: unblockedCustomer.notes,
      totalPurchases: unblockedCustomer.total_purchases || 0,
      totalAmount: unblockedCustomer.total_amount || 0,
      averagePrice: unblockedCustomer.average_price || 0,
      purchases: [],
      isBlocked: false,
      messageSent: unblockedCustomer.message_sent || false,
      lastMessageSent: unblockedCustomer.last_message_sent
    };
  }
};

export { customerService };
