
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
      .select('*', { count: 'exact' })
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

    // Transform data
    const transformedData = (data || []).map((voucher: any) => ({
      id: voucher.id,
      voucher_number: voucher.voucher_number,
      date: voucher.date,
      type: voucher.type as 'receipt' | 'payment',
      entity_type: voucher.entity_type,
      entity_id: voucher.entity_id,
      entity_name: voucher.entity_name || '',
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

    // Update entity balance based on voucher type (only for suppliers)
    if (data.entity_type === 'supplier') {
      await this.updateSupplierBalance(data.entity_id, data.amount, data.type);
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
    // Get the original voucher first
    const { data: originalVoucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', id)
      .single();

    if (!originalVoucher) {
      throw new Error('Voucher not found');
    }

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

    // If amount changed and entity is supplier, update the balance difference
    if (data.amount !== undefined && data.amount !== originalVoucher.amount && originalVoucher.entity_type === 'supplier') {
      const balanceDifference = data.amount - originalVoucher.amount;
      await this.updateSupplierBalance(
        originalVoucher.entity_id,
        balanceDifference,
        originalVoucher.type
      );
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
    // Get the voucher first to reverse the balance (only for suppliers)
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', id)
      .single();

    if (voucher && voucher.entity_type === 'supplier') {
      // Reverse the balance change
      const reverseType = voucher.type === 'receipt' ? 'payment' : 'receipt';
      await this.updateSupplierBalance(
        voucher.entity_id,
        voucher.amount,
        reverseType
      );
    }

    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting voucher:', error);
      throw error;
    }
  },

  async updateSupplierBalance(supplierId: string, amount: number, voucherType: 'receipt' | 'payment'): Promise<void> {
    // For suppliers: payment reduces balance (payment made), receipt increases balance (credit received)
    let balanceChange = 0;
    balanceChange = voucherType === 'payment' ? -amount : amount;

    // Get current balance
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('balance')
      .eq('id', supplierId)
      .single();

    if (supplier) {
      const currentBalance = supplier.balance || 0;
      const newBalance = currentBalance + balanceChange;

      await supabase
        .from('suppliers')
        .update({ balance: newBalance })
        .eq('id', supplierId);
    }
  }
};
