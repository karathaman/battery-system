
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { batteryTypeService, BatteryType, BatteryTypeFormData } from '@/services/batteryTypeService';

export const useBatteryTypes = () => {
  const queryClient = useQueryClient();

  const {
    data: batteryTypes = [],
    isLoading,
    error,
    refetch
  } = useQuery<BatteryType[]>({
    queryKey: ['batteryTypes'],
    queryFn: () => batteryTypeService.getBatteryTypes()
  });

  const createBatteryTypeMutation = useMutation<BatteryType, Error, BatteryTypeFormData>({
    mutationFn: (data) => batteryTypeService.createBatteryType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      toast({
        title: "تم إضافة النوع",
        description: "تم إضافة نوع البطارية بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة نوع البطارية",
        variant: "destructive",
      });
    }
  });

  const updateBatteryTypeMutation = useMutation<BatteryType, Error, { id: string; data: Partial<BatteryTypeFormData> }>({
    mutationFn: ({ id, data }) => batteryTypeService.updateBatteryType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث نوع البطارية بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث نوع البطارية",
        variant: "destructive",
      });
    }
  });

  const deleteBatteryTypeMutation = useMutation<void, Error, string>({
    mutationFn: (id) => batteryTypeService.deleteBatteryType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف نوع البطارية بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف نوع البطارية",
        variant: "destructive",
      });
    }
  });

  const toggleStatusMutation = useMutation<BatteryType, Error, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => batteryTypeService.toggleBatteryTypeStatus(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batteryTypes'] });
      toast({
        title: data.is_active ? "تم تفعيل النوع" : "تم إيقاف النوع",
        description: data.is_active ? "تم تفعيل نوع البطارية" : "تم إيقاف نوع البطارية",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تغيير حالة نوع البطارية",
        variant: "destructive",
      });
    }
  });

  return {
    batteryTypes,
    isLoading,
    error,
    refetch,
    createBatteryType: createBatteryTypeMutation.mutate,
    updateBatteryType: updateBatteryTypeMutation.mutate,
    deleteBatteryType: deleteBatteryTypeMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    isCreating: createBatteryTypeMutation.isPending,
    isUpdating: updateBatteryTypeMutation.isPending,
    isDeleting: deleteBatteryTypeMutation.isPending,
    isToggling: toggleStatusMutation.isPending
  };
};
