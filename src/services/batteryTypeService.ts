
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BatteryType {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  currentQty: number ;
  created_at: string;
}

interface BatteryTypeFormData {
  name: string;
  description?: string;
  unit_price: number;
  currentQty?: number;
}

 // دالة لجلب أنواع البطاريات من قاعدة البيانات
export const fetchBatteryTypes = async () => {
  const { data, error } = await supabase
    .from("battery_types") // اسم جدول أنواع البطاريات
    .select("*"); // الأعمدة التي تريد جلبها

  if (error) {
    console.error("Error fetching battery types:", error);
    throw new Error("Failed to fetch battery types");
  }

  return data;
};

const batteryTypeService = {
  getBatteryTypes: async (): Promise<BatteryType[]> => {
    const { data, error } = await supabase
      .from('battery_types')
      .select('id, name, description, unit_price, currentQty, created_at') // استخدام unit_price بدلاً من defaultPrice
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching battery types:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  createBatteryType: async (data: BatteryTypeFormData): Promise<BatteryType> => {
    const { data: newBatteryType, error } = await supabase
      .from('battery_types')
      .insert({
        name: data.name,
        description: data.description,
        currentQty: data.currentQty,
        unit_price: data.unit_price // استخدام unit_price بدلاً من defaultPrice
      })
      .select('id, name, description, unit_price, currentQty, created_at') // استخدام unit_price بدلاً من defaultPrice
      .single();

    if (error) {
      console.error('Error creating battery type:', error);
      throw new Error(error.message);
    }

    return newBatteryType;
  },

  updateBatteryType: async (id: string, data: Partial<BatteryTypeFormData>): Promise<BatteryType> => {
    const updateData: any = { ...data };
    if (updateData.currentQty === undefined) {
      delete updateData.currentQty;
    }
    const { data: updatedBatteryType, error } = await supabase
      .from('battery_types')
      .update(updateData)
      .eq('id', id)
      .select('id, name, description, unit_price, currentQty, created_at') // استخدام unit_price بدلاً من defaultPrice
      .single();

    if (error) {
      console.error('Error updating battery type:', error);
      throw new Error(error.message);
    }

    return updatedBatteryType;
  },

  deleteBatteryType: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('battery_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting battery type:', error);
      throw new Error(error.message);
    }
  }
};

export { batteryTypeService, type BatteryType, type BatteryTypeFormData };
 
