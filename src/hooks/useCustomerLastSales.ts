
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
  payment_method: string;
  sale_items: SaleItem[];
};

export type LastSaleForCustomer = {
  batteryTypeName: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  paymentMethod: string;
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
            payment_method,
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
              quantity: item.quantity,
              price: item.price_per_kg,
              total: item.total,
              date: sale.date,
              paymentMethod: sale.payment_method,
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
