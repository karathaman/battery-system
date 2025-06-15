import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Customer, CustomerFormData, PaginatedResponse, FilterOptions } from '@/types';

// Real Supabase service implementation
const customerService = {
  getCustomers: async (page = 1, limit = 10, filters?: FilterOptions): Promise<PaginatedResponse<Customer>> => {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters if provided
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
      lastPurchase: customer.last_purchase,
      totalPurchases: customer.total_purchases || 0,
      totalAmount: customer.total_amount || 0,
      averagePrice: customer.average_price || 0,
      purchases: [], // This would need a separate query to fetch related purchases
      last2Quantities: [], // These would be calculated from purchases
      last2Prices: [],
      last2BatteryTypes: [],
      isBlocked: customer.is_blocked || false,
      blockReason: customer.block_reason,
      balance: customer.balance || 0
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
    // Generate customer code
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
      balance: newCustomer.balance || 0
    };
  },

  updateCustomer: async (id: string, data: Partial<CustomerFormData & { balance?: number }>): Promise<Customer> => {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.balance !== undefined) updateData.balance = data.balance;

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
      balance: updatedCustomer.balance || 0
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
      balance: blockedCustomer.balance || 0
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
      balance: unblockedCustomer.balance || 0
    };
  },

  updateCustomerNotes: async (id: string, notes: string): Promise<Customer> => {
    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update({ notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer notes:', error);
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
      balance: updatedCustomer.balance || 0
    };
  },

  searchCustomers: async (query: string): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,customer_code.ilike.%${query}%`)
      .limit(50);

    if (error) {
      console.error('Error searching customers:', error);
      throw new Error(error.message);
    }

    return (data || []).map(customer => ({
      id: customer.id,
      customerCode: customer.customer_code,
      name: customer.name,
      phone: customer.phone || '',
      description: customer.description,
      notes: customer.notes,
      totalPurchases: customer.total_purchases || 0,
      totalAmount: customer.total_amount || 0,
      averagePrice: customer.average_price || 0,
      purchases: [],
      isBlocked: customer.is_blocked || false,
      blockReason: customer.block_reason,
      balance: customer.balance || 0
    }));
  }
};

export const useCustomers = (page = 1, limit = 10, filters?: FilterOptions) => {
  const queryClient = useQueryClient();

  const {
    data: customersData,
    isLoading,
    error,
    refetch
  } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', page, limit, filters],
    queryFn: () => customerService.getCustomers(page, limit, filters)
  });

  const createCustomerMutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: (data) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "تم إنشاء العميل",
        description: "تم إنشاء العميل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء العميل",
        variant: "destructive",
      });
    }
  });

  const updateCustomerMutation = useMutation<Customer, Error, { id: string; data: Partial<CustomerFormData & { balance?: number }> }>({
    mutationFn: ({ id, data }) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات العميل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات العميل",
        variant: "destructive",
      });
    }
  });

  const deleteCustomerMutation = useMutation<void, Error, string>({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف العميل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف العميل",
        variant: "destructive",
      });
    }
  });

  const blockCustomerMutation = useMutation<Customer, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => customerService.blockCustomer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "تم حظر العميل",
        description: "تم حظر العميل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حظر العميل",
        variant: "destructive",
      });
    }
  });

  const unblockCustomerMutation = useMutation<Customer, Error, string>({
    mutationFn: (id) => customerService.unblockCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "تم إلغاء الحظر",
        description: "تم إلغاء حظر العميل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء حظر العميل",
        variant: "destructive",
      });
    }
  });

  const updateNotesMutation = useMutation<Customer, Error, { id: string; notes: string }>({
    mutationFn: ({ id, notes }) => customerService.updateCustomerNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "تم تحديث الملاحظات",
        description: "تم تحديث ملاحظات العميل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الملاحظات",
        variant: "destructive",
      });
    }
  });

  const searchCustomersMutation = useMutation<Customer[], Error, string>({
    mutationFn: (query) => customerService.searchCustomers(query),
    onError: (error) => {
      toast({
        title: "خطأ في البحث",
        description: "فشل في البحث عن العملاء",
        variant: "destructive",
      });
    }
  });

  return {
    customers: customersData?.data ?? [],
    pagination: customersData?.pagination,
    isLoading,
    error,
    refetch,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
    blockCustomer: blockCustomerMutation.mutate,
    unblockCustomer: unblockCustomerMutation.mutate,
    updateNotes: updateNotesMutation.mutate,
    searchCustomers: searchCustomersMutation.mutate,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending,
    isBlocking: blockCustomerMutation.isPending,
    isUnblocking: unblockCustomerMutation.isPending,
    isUpdatingNotes: updateNotesMutation.isPending,
    isSearching: searchCustomersMutation.isPending
  };
};
