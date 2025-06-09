import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import { Customer, CustomerFormData, PaginatedResponse } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useCustomers = (page = 1, limit = 10) => {
  const queryClient = useQueryClient();

  const {
    data: customersData,
    isLoading,
    error,
    refetch
  } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', page, limit],
    queryFn: () => customerService.getCustomers(page, limit)
  });

  const createCustomerMutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: (data) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const updateCustomerMutation = useMutation<Customer, Error, { id: string; data: Partial<CustomerFormData> }>({
    mutationFn: ({ id, data }) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const deleteCustomerMutation = useMutation<void, Error, string>({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const blockCustomerMutation = useMutation<Customer, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => customerService.blockCustomer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const unblockCustomerMutation = useMutation<Customer, Error, string>({
    mutationFn: (id) => customerService.unblockCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const updateNotesMutation = useMutation<Customer, Error, { id: string; notes: string }>({
    mutationFn: ({ id, notes }) => customerService.updateCustomerNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const searchCustomersMutation = useMutation<Customer[], Error, string>({
    mutationFn: (query) => customerService.searchCustomers(query)
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