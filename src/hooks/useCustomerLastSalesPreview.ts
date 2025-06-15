
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LastSalePreview = {
  batteryTypeName: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
};

export function useCustomerLastSalesPreview(customerId: string | undefined) {
  return useQuery<LastSalePreview[]>({
    queryKey: ["customer-last-sales-preview", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          id,
          date,
          sale_items(
            battery_type_id,
            quantity,
            price_per_kg,
            total,
            battery_types(name)
          )
        `
        )
        .eq("customer_id", customerId)
        .order("date", { ascending: false });
      if (error) throw new Error(error.message);

      const rows: LastSalePreview[] = [];
      const seenTypes = new Set<string>();
      for (const sale of data ?? []) {
        if (!sale.sale_items || !Array.isArray(sale.sale_items)) continue;
        for (const item of sale.sale_items) {
          if (!item || typeof item !== "object") continue;
          const batteryTypeName = item.battery_types?.name || "غير معروف";
          if (!seenTypes.has(batteryTypeName)) {
            seenTypes.add(batteryTypeName);
            rows.push({
              batteryTypeName,
              quantity: item.quantity,
              price: item.price_per_kg,
              total: item.total,
              date: sale.date,
            });
          }
          if (rows.length >= 2) break;
        }
        if (rows.length >= 2) break;
      }
      return rows;
    },
  });
}
