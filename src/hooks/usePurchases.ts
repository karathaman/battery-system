
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { purchaseService, Purchase, PurchaseFormData } from '@/services/purchaseService';

export const usePurchases = () => {
  const queryClient = useQueryClient();

  const {
    data: purchases = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => purchaseService.getPurchases()
  });

  const createPurchaseMutation = useMutation({
    mutationFn: (data: PurchaseFormData) => purchaseService.createPurchase(data),
    onSuccess: () => {
      console.log('Purchase created, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      queryClient.invalidateQueries({ queryKey: ['battery-types'] });
      queryClient.invalidateQueries({ queryKey: ['daily-purchases'] });
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء فاتورة المشتريات بنجاح وتحديث بيانات المورد",
      });
    },
    onError: (error) => {
      console.error('Purchase creation failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء فاتورة المشتريات",
        variant: "destructive",
      });
    }
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PurchaseFormData> }) => 
      purchaseService.updatePurchase(id, data),
    onSuccess: () => {
      console.log('Purchase updated, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      queryClient.invalidateQueries({ queryKey: ['battery-types'] });
      queryClient.invalidateQueries({ queryKey: ['daily-purchases'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث فاتورة المشتريات بنجاح وتحديث بيانات المورد",
      });
    },
    onError: (error) => {
      console.error('Purchase update failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث فاتورة المشتريات",
        variant: "destructive",
      });
    }
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id: string) => purchaseService.deletePurchase(id),
    onSuccess: () => {
      console.log('Purchase deleted, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      queryClient.invalidateQueries({ queryKey: ['battery-types'] });
      queryClient.invalidateQueries({ queryKey: ['daily-purchases'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف فاتورة المشتريات بنجاح وتحديث بيانات المورد",
      });
    },
    onError: (error) => {
      console.error('Purchase deletion failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف فاتورة المشتريات",
        variant: "destructive",
      });
    }
  });

  return {
    purchases,
    isLoading,
    error,
    refetch,
    createPurchase: createPurchaseMutation.mutate,
    updatePurchase: updatePurchaseMutation.mutate,
    deletePurchase: deletePurchaseMutation.mutate,
    isCreating: createPurchaseMutation.isPending,
    isUpdating: updatePurchaseMutation.isPending,
    isDeleting: deletePurchaseMutation.isPending
  };
};
