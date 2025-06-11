
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BatteryType {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
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
      .select('id, name, description, unit_price, created_at')
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
        unit_price: data.unit_price
      })
      .select('id, name, description, unit_price, created_at')
      .single();

    if (error) {
      console.error('Error creating battery type:', error);
      throw new Error(error.message);
    }

    return newBatteryType;
  },

  updateBatteryType: async (id: string, data: Partial<BatteryTypeFormData>): Promise<BatteryType> => {
    const { data: updatedBatteryType, error } = await supabase
      .from('battery_types')
      .update(data)
      .eq('id', id)
      .select('id, name, description, unit_price, created_at')
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
