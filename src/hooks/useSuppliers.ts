
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { supplierService } from '@/services/supplierService';
import { Supplier, SupplierFormData, PaginatedResponse, FilterOptions } from '@/types';

export const useSuppliers = (page = 1, limit = 10, filters?: FilterOptions) => {
  const queryClient = useQueryClient();

  const {
    data: suppliersData,
    isLoading,
    error,
    refetch
  } = useQuery<PaginatedResponse<Supplier>>({
    queryKey: ['suppliers', page, limit, filters],
    queryFn: () => supplierService.getSuppliers(page, limit, filters)
  });

  const createSupplierMutation = useMutation<Supplier, Error, SupplierFormData>({
    mutationFn: (data) => supplierService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "تم إنشاء المورد",
        description: "تم إنشاء المورد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المورد",
        variant: "destructive",
      });
    }
  });

  const updateSupplierMutation = useMutation<Supplier, Error, { id: string; data: Partial<SupplierFormData & { messageSent?: boolean; lastMessageSent?: string }> }>({
    mutationFn: ({ id, data }) => supplierService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المورد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات المورد",
        variant: "destructive",
      });
    }
  });

  const deleteSupplierMutation = useMutation<void, Error, string>({
    mutationFn: (id) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المورد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المورد",
        variant: "destructive",
      });
    }
  });

  const blockSupplierMutation = useMutation<Supplier, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => supplierService.blockSupplier(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "تم حظر المورد",
        description: "تم حظر المورد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حظر المورد",
        variant: "destructive",
      });
    }
  });

  const unblockSupplierMutation = useMutation<Supplier, Error, string>({
    mutationFn: (id) => supplierService.unblockSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "تم إلغاء الحظر",
        description: "تم إلغاء حظر المورد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء حظر المورد",
        variant: "destructive",
      });
    }
  });

  return {
    suppliers: suppliersData?.data ?? [],
    pagination: suppliersData?.pagination,
    isLoading,
    error,
    refetch,
    createSupplier: createSupplierMutation.mutate,
    updateSupplier: updateSupplierMutation.mutate,
    deleteSupplier: deleteSupplierMutation.mutate,
    blockSupplier: blockSupplierMutation.mutate,
    unblockSupplier: unblockSupplierMutation.mutate,
    isCreating: createSupplierMutation.isPending,
    isUpdating: updateSupplierMutation.isPending,
    isDeleting: deleteSupplierMutation.isPending,
    isBlocking: blockSupplierMutation.isPending,
    isUnblocking: unblockSupplierMutation.isPending
  };
};
