
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { customerService } from '@/services/customerService';
import { Customer, CustomerFormData, PaginatedResponse, FilterOptions } from '@/types';

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

  const updateCustomerMutation = useMutation<Customer, Error, { id: string; data: Partial<CustomerFormData & { messageSent?: boolean; lastMessageSent?: string }> }>({
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
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending,
    isBlocking: blockCustomerMutation.isPending,
    isUnblocking: unblockCustomerMutation.isPending
  };
};
