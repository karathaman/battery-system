
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Customer, CustomerFormData, PaginatedResponse, FilterOptions } from '@/types';

// Mock service for demonstration - replace with actual API calls
const customerService = {
  getCustomers: async (page = 1, limit = 10, filters?: FilterOptions): Promise<PaginatedResponse<Customer>> => {
    // Mock implementation
    const mockCustomers: Customer[] = [
      {
        id: "1",
        customerCode: "C001",
        name: "أحمد محمد",
        phone: "0501234567",
        description: "عميل مميز",
        notes: "عميل منتظم",
        lastPurchase: "2024-01-20",
        totalPurchases: 150,
        totalAmount: 45000,
        averagePrice: 300,
        purchases: [],
        last2Quantities: [25, 20],
        last2Prices: [280, 290],
        last2BatteryTypes: ["بطاريات عادية", "بطاريات جافة"],
        isBlocked: false,
        messageSent: false
      }
    ];

    return {
      data: mockCustomers,
      pagination: {
        page,
        limit,
        total: mockCustomers.length,
        totalPages: Math.ceil(mockCustomers.length / limit)
      }
    };
  },

  createCustomer: async (data: CustomerFormData): Promise<Customer> => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      customerCode: `C${String(Date.now()).slice(-3)}`,
      name: data.name,
      phone: data.phone,
      description: data.description,
      notes: data.notes,
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
    return newCustomer;
  },

  updateCustomer: async (id: string, data: Partial<CustomerFormData>): Promise<Customer> => {
    // Mock implementation
    return {
      id,
      customerCode: "C001",
      name: data.name || "",
      phone: data.phone || "",
      description: data.description,
      notes: data.notes,
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
  },

  deleteCustomer: async (id: string): Promise<void> => {
    // Mock implementation
    console.log(`Deleting customer ${id}`);
  },

  blockCustomer: async (id: string, reason: string): Promise<Customer> => {
    // Mock implementation
    return {
      id,
      customerCode: "C001",
      name: "Customer",
      phone: "0501234567",
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: true,
      blockReason: reason,
      messageSent: false
    };
  },

  unblockCustomer: async (id: string): Promise<Customer> => {
    // Mock implementation
    return {
      id,
      customerCode: "C001",
      name: "Customer",
      phone: "0501234567",
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
  },

  updateCustomerNotes: async (id: string, notes: string): Promise<Customer> => {
    // Mock implementation
    return {
      id,
      customerCode: "C001",
      name: "Customer",
      phone: "0501234567",
      notes,
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
  },

  searchCustomers: async (query: string): Promise<Customer[]> => {
    // Mock implementation
    return [];
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

  const updateCustomerMutation = useMutation<Customer, Error, { id: string; data: Partial<CustomerFormData> }>({
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
