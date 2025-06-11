
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface DailyPurchase {
  id: string;
  date: string;
  supplierName: string;
  supplierCode: string;
  supplierPhone: string;
  batteryType: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
  isSaved: boolean;
}

export interface DailyPurchaseFormData {
  date: string;
  supplierName: string;
  supplierCode?: string;
  supplierPhone?: string;
  batteryType: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
}

const dailyPurchaseService = {
  getDailyPurchases: async (date: string): Promise<DailyPurchase[]> => {
    const { data, error } = await supabase
      .from('daily_purchases')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching daily purchases:', error);
      throw new Error(error.message);
    }

    return (data || []).map(purchase => ({
      id: purchase.id,
      date: purchase.date,
      supplierName: purchase.supplier_name,
      supplierCode: purchase.supplier_code || '',
      supplierPhone: purchase.supplier_phone || '',
      batteryType: purchase.battery_type,
      quantity: purchase.quantity,
      pricePerKg: purchase.price_per_kg,
      total: purchase.total,
      discount: purchase.discount || 0,
      finalTotal: purchase.final_total,
      isSaved: purchase.is_saved || false
    }));
  },

  saveDailyPurchase: async (data: DailyPurchaseFormData): Promise<DailyPurchase> => {
    const { data: newPurchase, error } = await supabase
      .from('daily_purchases')
      .insert({
        date: data.date,
        supplier_name: data.supplierName,
        supplier_code: data.supplierCode,
        supplier_phone: data.supplierPhone,
        battery_type: data.batteryType,
        quantity: data.quantity,
        price_per_kg: data.pricePerKg,
        total: data.total,
        discount: data.discount,
        final_total: data.finalTotal,
        is_saved: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving daily purchase:', error);
      throw new Error(error.message);
    }

    return {
      id: newPurchase.id,
      date: newPurchase.date,
      supplierName: newPurchase.supplier_name,
      supplierCode: newPurchase.supplier_code || '',
      supplierPhone: newPurchase.supplier_phone || '',
      batteryType: newPurchase.battery_type,
      quantity: newPurchase.quantity,
      pricePerKg: newPurchase.price_per_kg,
      total: newPurchase.total,
      discount: newPurchase.discount || 0,
      finalTotal: newPurchase.final_total,
      isSaved: true
    };
  },

  updateDailyPurchase: async (id: string, data: Partial<DailyPurchaseFormData>): Promise<DailyPurchase> => {
    const updateData: any = {};
    if (data.supplierName) updateData.supplier_name = data.supplierName;
    if (data.supplierCode) updateData.supplier_code = data.supplierCode;
    if (data.supplierPhone) updateData.supplier_phone = data.supplierPhone;
    if (data.batteryType) updateData.battery_type = data.batteryType;
    if (data.quantity) updateData.quantity = data.quantity;
    if (data.pricePerKg) updateData.price_per_kg = data.pricePerKg;
    if (data.total) updateData.total = data.total;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.finalTotal) updateData.final_total = data.finalTotal;

    const { data: updatedPurchase, error } = await supabase
      .from('daily_purchases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating daily purchase:', error);
      throw new Error(error.message);
    }

    return {
      id: updatedPurchase.id,
      date: updatedPurchase.date,
      supplierName: updatedPurchase.supplier_name,
      supplierCode: updatedPurchase.supplier_code || '',
      supplierPhone: updatedPurchase.supplier_phone || '',
      batteryType: updatedPurchase.battery_type,
      quantity: updatedPurchase.quantity,
      pricePerKg: updatedPurchase.price_per_kg,
      total: updatedPurchase.total,
      discount: updatedPurchase.discount || 0,
      finalTotal: updatedPurchase.final_total,
      isSaved: updatedPurchase.is_saved || false
    };
  },

  deleteDailyPurchase: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_purchases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting daily purchase:', error);
      throw new Error(error.message);
    }
  },

  clearDayPurchases: async (date: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_purchases')
      .delete()
      .eq('date', date);

    if (error) {
      console.error('Error clearing daily purchases:', error);
      throw new Error(error.message);
    }
  }
};

export const useDailyPurchases = (date: string) => {
  const queryClient = useQueryClient();

  const {
    data: purchases = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['daily-purchases', date],
    queryFn: () => dailyPurchaseService.getDailyPurchases(date)
  });

  const savePurchaseMutation = useMutation({
    mutationFn: (data: DailyPurchaseFormData) => dailyPurchaseService.saveDailyPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-purchases', date] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البيانات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DailyPurchaseFormData> }) => 
      dailyPurchaseService.updateDailyPurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-purchases', date] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث البيانات",
        variant: "destructive",
      });
    }
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id: string) => dailyPurchaseService.deleteDailyPurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-purchases', date] });
      toast({
        title: "تم الحذف",
        description: "تم حذف السطر بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف السطر",
        variant: "destructive",
      });
    }
  });

  const clearDayMutation = useMutation({
    mutationFn: () => dailyPurchaseService.clearDayPurchases(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-purchases', date] });
      toast({
        title: "تم المسح",
        description: "تم مسح جميع بيانات اليوم",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في مسح البيانات",
        variant: "destructive",
      });
    }
  });

  return {
    purchases,
    isLoading,
    error,
    refetch,
    savePurchase: savePurchaseMutation.mutate,
    updatePurchase: updatePurchaseMutation.mutate,
    deletePurchase: deletePurchaseMutation.mutate,
    clearDay: clearDayMutation.mutate,
    isSaving: savePurchaseMutation.isPending,
    isUpdating: updatePurchaseMutation.isPending,
    isDeleting: deletePurchaseMutation.isPending,
    isClearing: clearDayMutation.isPending
  };
};
