
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BatteryType {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  is_active: boolean;
  created_at: string;
}

interface BatteryTypeFormData {
  name: string;
  description?: string;
  unit_price: number;
}

const batteryTypeService = {
  getBatteryTypes: async (): Promise<BatteryType[]> => {
    const { data, error } = await supabase
      .from('battery_types')
      .select('id, name, description, unit_price, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching battery types:', error);
      throw new Error(error.message);
    }

    return data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true
    })) || [];
  },

  createBatteryType: async (data: BatteryTypeFormData): Promise<BatteryType> => {
    const { data: newBatteryType, error } = await supabase
      .from('battery_types')
      .insert({
        name: data.name,
        description: data.description,
        unit_price: data.unit_price,
        is_active: true
      })
      .select('id, name, description, unit_price, is_active, created_at')
      .single();

    if (error) {
      console.error('Error creating battery type:', error);
      throw new Error(error.message);
    }

    return {
      ...newBatteryType,
      is_active: newBatteryType.is_active ?? true
    };
  },

  updateBatteryType: async (id: string, data: Partial<BatteryTypeFormData>): Promise<BatteryType> => {
    const { data: updatedBatteryType, error } = await supabase
      .from('battery_types')
      .update(data)
      .eq('id', id)
      .select('id, name, description, unit_price, is_active, created_at')
      .single();

    if (error) {
      console.error('Error updating battery type:', error);
      throw new Error(error.message);
    }

    return {
      ...updatedBatteryType,
      is_active: updatedBatteryType.is_active ?? true
    };
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
  },

  toggleBatteryTypeStatus: async (id: string, isActive: boolean): Promise<BatteryType> => {
    const { data: updatedBatteryType, error } = await supabase
      .from('battery_types')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id, name, description, unit_price, is_active, created_at')
      .single();

    if (error) {
      console.error('Error toggling battery type status:', error);
      throw new Error(error.message);
    }

    return {
      ...updatedBatteryType,
      is_active: updatedBatteryType.is_active ?? true
    };
  }
};

export { batteryTypeService, type BatteryType, type BatteryTypeFormData };
