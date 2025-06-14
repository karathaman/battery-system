
import { supabase } from '@/integrations/supabase/client';
import { PaginatedResponse, FilterOptions } from '@/types';

export interface VoucherData {
  id: string;
  voucher_number: string;
  date: string;
  type: 'receipt' | 'payment';
  entity_type: 'customer' | 'supplier';
  entity_id: string;
  entity_name: string;
  amount: number;
  description?: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check';
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface VoucherFormData {
  date: string;
  type: 'receipt' | 'payment';
  entity_type: 'customer' | 'supplier';
  entity_id: string;
  entity_name: string;
  amount: number;
  description?: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'transfer';
}

export const voucherService = {
  async getVouchers(page = 1, limit = 50, filters?: FilterOptions): Promise<PaginatedResponse<VoucherData>> {
    let query = supabase
      .from('vouchers')
      .select(`
        *,
        customers!vouchers_entity_id_fkey(name),
        suppliers!vouchers_entity_id_fkey(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.searchTerm) {
      query = query.or(`voucher_number.ilike.%${filters.searchTerm}%,entity_name.ilike.%${filters.searchTerm}%`);
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type as 'receipt' | 'payment');
    }

    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching vouchers:', error);
      throw error;
    }

    // Transform data to include entity_name and amount from joined tables
    const transformedData = (data || []).map((voucher: any) => ({
      id: voucher.id,
      voucher_number: voucher.voucher_number,
      date: voucher.date,
      type: voucher.type,
      entity_type: voucher.entity_type,
      entity_id: voucher.entity_id,
      entity_name: voucher.entity_name || 
        (voucher.entity_type === 'customer' 
          ? voucher.customers?.name 
          : voucher.suppliers?.name) || '',
      amount: voucher.amount || 0,
      description: voucher.notes,
      payment_method: voucher.payment_method,
      status: voucher.status,
      created_at: voucher.created_at,
      updated_at: voucher.updated_at,
    }));

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  },

  async createVoucher(data: VoucherFormData): Promise<VoucherData> {
    // Generate voucher number
    const { data: lastVoucher } = await supabase
      .from('vouchers')
      .select('voucher_number')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastVoucher && lastVoucher.length > 0) {
      const lastNumber = parseInt(lastVoucher[0].voucher_number.replace('V', ''));
      nextNumber = lastNumber + 1;
    }

    const voucher_number = `V${nextNumber.toString().padStart(3, '0')}`;

    // Map transfer to bank_transfer for database compatibility
    const payment_method = data.payment_method === 'transfer' ? 'bank_transfer' : data.payment_method;

    const { data: newVoucher, error } = await supabase
      .from('vouchers')
      .insert([{
        voucher_number,
        date: data.date,
        type: data.type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        entity_name: data.entity_name,
        amount: data.amount,
        notes: data.description,
        payment_method: payment_method as 'cash' | 'card' | 'bank_transfer' | 'check',
        status: 'completed'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating voucher:', error);
      throw error;
    }

    return {
      id: newVoucher.id,
      voucher_number: newVoucher.voucher_number,
      date: newVoucher.date,
      type: newVoucher.type as 'receipt' | 'payment',
      entity_type: newVoucher.entity_type,
      entity_id: newVoucher.entity_id,
      entity_name: newVoucher.entity_name || '',
      amount: newVoucher.amount || 0,
      description: newVoucher.notes,
      payment_method: newVoucher.payment_method,
      status: newVoucher.status,
      created_at: newVoucher.created_at,
      updated_at: newVoucher.updated_at,
    };
  },

  async updateVoucher(id: string, data: Partial<VoucherFormData>): Promise<VoucherData> {
    // Map transfer to bank_transfer for database compatibility
    const updateData: any = { ...data };
    if (data.payment_method === 'transfer') {
      updateData.payment_method = 'bank_transfer';
    }
    if (data.description !== undefined) {
      updateData.notes = data.description;
      delete updateData.description;
    }

    const { data: updatedVoucher, error } = await supabase
      .from('vouchers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating voucher:', error);
      throw error;
    }

    return {
      id: updatedVoucher.id,
      voucher_number: updatedVoucher.voucher_number,
      date: updatedVoucher.date,
      type: updatedVoucher.type as 'receipt' | 'payment',
      entity_type: updatedVoucher.entity_type,
      entity_id: updatedVoucher.entity_id,
      entity_name: updatedVoucher.entity_name || '',
      amount: updatedVoucher.amount || 0,
      description: updatedVoucher.notes,
      payment_method: updatedVoucher.payment_method,
      status: updatedVoucher.status,
      created_at: updatedVoucher.created_at,
      updated_at: updatedVoucher.updated_at,
    };
  },

  async deleteVoucher(id: string): Promise<void> {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting voucher:', error);
      throw error;
    }
  }
};
