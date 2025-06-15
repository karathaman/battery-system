
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Type for each item in a Sale row
type SaleItem = {
  battery_type_id: string;
  quantity: number;
  price_per_kg: number;
  total: number;
  battery_types?: { name: string } | null;
};

type SaleRow = {
  id: string;
  date: string;
  customer_id: string;
  sale_items: SaleItem[];
};

export type LastSaleForCustomer = {
  batteryTypeName: string;
  price: number;
  total: number;
  date: string;
};

export function useCustomerLastSales(customerId: string | undefined) {
  return useQuery<LastSaleForCustomer[]>({
    queryKey: ["last-sales", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      if (!customerId) return [];

      // Fetch sales for this customer, most recent first, including sale_items and battery_types info
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
            id,
            date,
            customer_id,
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

      // Extract last 2 distinct battery types across all sales (most recent first)
      const batteryRows: LastSaleForCustomer[] = [];
      const seenTypes = new Set<string>();

      for (const sale of data ?? []) {
        if (!sale.sale_items || !Array.isArray(sale.sale_items)) continue;
        for (const item of sale.sale_items) {
          if (typeof item !== "object" || !item) continue;
          const batteryTypeName =
            item.battery_types?.name || "غير معروف";
          if (!seenTypes.has(batteryTypeName)) {
            seenTypes.add(batteryTypeName);
            batteryRows.push({
              batteryTypeName,
              price: item.price_per_kg,
              total: item.total,
              date: sale.date,
            });
          }
          if (batteryRows.length >= 2) break;
        }
        if (batteryRows.length >= 2) break;
      }

      return batteryRows;
    },
  });
}
