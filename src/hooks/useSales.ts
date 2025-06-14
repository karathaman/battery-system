
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { salesService, SaleData, SaleFormData } from '@/services/salesService';

export const useSales = () => {
  const queryClient = useQueryClient();

  const {
    data: sales = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.getSales()
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: SaleFormData) => salesService.createSale(data),
    onSuccess: () => {
      console.log('Sale created, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      queryClient.invalidateQueries({ queryKey: ['battery-types'] });
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء فاتورة المبيعات بنجاح وتحديث بيانات العميل",
      });
    },
    onError: (error) => {
      console.error('Sale creation failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء فاتورة المبيعات",
        variant: "destructive",
      });
    }
  });

  const updateSaleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SaleFormData> }) => 
      salesService.updateSale(id, data),
    onSuccess: () => {
      console.log('Sale updated, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      queryClient.invalidateQueries({ queryKey: ['battery-types'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث فاتورة المبيعات بنجاح وتحديث بيانات العميل",
      });
    },
    onError: (error) => {
      console.error('Sale update failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث فاتورة المبيعات",
        variant: "destructive",
      });
    }
  });

  const deleteSaleMutation = useMutation({
    mutationFn: (id: string) => salesService.deleteSale(id),
    onSuccess: () => {
      console.log('Sale deleted, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      queryClient.invalidateQueries({ queryKey: ['battery-types'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف فاتورة المبيعات بنجاح وتحديث بيانات العميل",
      });
    },
    onError: (error) => {
      console.error('Sale deletion failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف فاتورة المبيعات",
        variant: "destructive",
      });
    }
  });

  return {
    sales,
    isLoading,
    error,
    refetch,
    createSale: createSaleMutation.mutate,
    updateSale: updateSaleMutation.mutate,
    deleteSale: deleteSaleMutation.mutate,
    isCreating: createSaleMutation.isPending,
    isUpdating: updateSaleMutation.isPending,
    isDeleting: deleteSaleMutation.isPending
  };
};
