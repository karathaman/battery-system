
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
  payment_method: 'cash' | 'card' | 'transfer';
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
  payment_method: 'cash' | 'card' | 'transfer';
}

export const voucherService = {
  async getVouchers(page = 1, limit = 50, filters?: FilterOptions): Promise<PaginatedResponse<VoucherData>> {
    let query = supabase
      .from('vouchers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.searchTerm) {
      query = query.or(`voucher_number.ilike.%${filters.searchTerm}%,entity_name.ilike.%${filters.searchTerm}%`);
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
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

    return {
      data: data || [],
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

    const { data: newVoucher, error } = await supabase
      .from('vouchers')
      .insert([{
        ...data,
        voucher_number
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating voucher:', error);
      throw error;
    }

    return newVoucher;
  },

  async updateVoucher(id: string, data: Partial<VoucherFormData>): Promise<VoucherData> {
    const { data: updatedVoucher, error } = await supabase
      .from('vouchers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating voucher:', error);
      throw error;
    }

    return updatedVoucher;
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
