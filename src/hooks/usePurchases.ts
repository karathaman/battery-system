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
    mutationFn: (data: PurchaseFormData) => {
      // إضافة تسجيل للأخطاء ومحتويات البيانات
      console.log("Attempting to create purchase with data:", data);
      // تحقق من العناصر وحقولها المطلوبة
      if (!data.supplier_id) throw new Error("لم يتم اختيار المورد!");
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) throw new Error("يجب إضافة صنف واحد على الأقل");
      for (const item of data.items) {
        if (!item.battery_type_id) throw new Error("جميع الأصناف يجب أن تحتوي نوع البطارية (battery_type_id)");
        if (typeof item.quantity !== "number" || item.quantity <= 0) throw new Error("كمية صنف غير صحيحة");
        if (typeof item.price_per_kg !== "number" || item.price_per_kg < 0) throw new Error("سعر صنف غير صحيح");
        if (typeof item.total !== "number" || item.total < 0) throw new Error("إجمالي صنف غير صحيح");
      }
      return purchaseService.createPurchase(data)
    },
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
    onError: (error: any) => {
      console.error('Purchase creation failed:', error);
      toast({
        title: "خطأ",
        description: error?.message || "فشل في إنشاء فاتورة المشتريات",
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
