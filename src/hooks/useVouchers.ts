
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { voucherService, VoucherData, VoucherFormData } from '@/services/voucherService';
import { PaginatedResponse, FilterOptions } from '@/types';

export const useVouchers = (page = 1, limit = 50, filters?: FilterOptions) => {
  const queryClient = useQueryClient();

  const {
    data: vouchersData,
    isLoading,
    error,
    refetch
  } = useQuery<PaginatedResponse<VoucherData>>({
    queryKey: ['vouchers', page, limit, filters],
    queryFn: () => voucherService.getVouchers(page, limit, filters),
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch to get latest data
  });

  const createVoucherMutation = useMutation<VoucherData, Error, VoucherFormData>({
    mutationFn: (data) => voucherService.createVoucher(data),
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Force refetch to ensure immediate update
      refetch();
      
      toast({
        title: "تم إنشاء السند",
        description: "تم إنشاء السند وتحديث الرصيد بنجاح",
      });
    },
    onError: (error) => {
      console.error('Create voucher error:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء السند",
        variant: "destructive",
      });
    }
  });

  const updateVoucherMutation = useMutation<VoucherData, Error, { id: string; data: Partial<VoucherFormData> }>({
    mutationFn: ({ id, data }) => voucherService.updateVoucher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Force refetch
      refetch();
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث السند والرصيد بنجاح",
      });
    },
    onError: (error) => {
      console.error('Update voucher error:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث السند",
        variant: "destructive",
      });
    }
  });

  const deleteVoucherMutation = useMutation<void, Error, string>({
    mutationFn: (id) => voucherService.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Force refetch
      refetch();
      
      toast({
        title: "تم الحذف",
        description: "تم حذف السند وتحديث الرصيد بنجاح",
      });
    },
    onError: (error) => {
      console.error('Delete voucher error:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف السند",
        variant: "destructive",
      });
    }
  });

  return {
    vouchers: vouchersData?.data ?? [],
    pagination: vouchersData?.pagination,
    isLoading,
    error,
    refetch,
    createVoucher: createVoucherMutation.mutate,
    updateVoucher: updateVoucherMutation.mutate,
    deleteVoucher: deleteVoucherMutation.mutate,
    isCreating: createVoucherMutation.isPending,
    isUpdating: updateVoucherMutation.isPending,
    isDeleting: deleteVoucherMutation.isPending
  };
};
