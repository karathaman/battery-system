
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SaleRow = {
  id: string;
  date: string;
  customer_id: string;
  // Each sale has sale_items joined
  sale_items: {
    battery_type_id: string;
    battery_types?: { name: string } | null;
    quantity: number;
    price_per_kg: number;
    total: number;
  }[];
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

      // Fetch sales for this customer, most recent first, including joined sale_items and battery_types info
      const { data, error } = await supabase
        .from("sales")
        .select(
          `id, date, sale_items:battery_type_id (battery_type_id, quantity, price_per_kg, total, battery_types(name))`
        )
        .eq("customer_id", customerId)
        .order("date", { ascending: false });

      if (error) throw new Error(error.message);

      // Extract all items, flatten by battery_type, and find latest 2 distinct types
      const batteryRows: {
        batteryTypeName: string;
        price: number;
        total: number;
        date: string;
      }[] = [];

      // Group by type: track types seen
      const seenTypes = new Set<string>();
      for (const sale of data || []) {
        for (const item of (sale.sale_items ?? [])) {
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
