
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Type for a Purchase item
type PurchaseItem = {
  battery_type_id: string;
  quantity: number;
  price_per_kg: number;
  total: number;
  battery_types?: { name: string } | null;
};

type PurchaseRow = {
  id: string;
  date: string;
  supplier_id: string;
  purchase_items: PurchaseItem[];
};

export type LastPurchaseForSupplier = {
  batteryTypeName: string;
  price: number;
  total: number;
  date: string;
};

export function useSupplierLastPurchases(supplierId: string | undefined) {
  return useQuery<LastPurchaseForSupplier[]>({
    queryKey: ["last-purchases", supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      if (!supplierId) return [];

      // Fetch purchases for this supplier, most recent first, including purchase_items and battery_types info
      const { data, error } = await supabase
        .from("purchases")
        .select(
          `
            id,
            date,
            supplier_id,
            purchase_items(
              battery_type_id,
              quantity,
              price_per_kg,
              total,
              battery_types(name)
            )
          `
        )
        .eq("supplier_id", supplierId)
        .order("date", { ascending: false });

      if (error) throw new Error(error.message);

      // Extract last 2 distinct battery types across all purchases (most recent first)
      const batteryRows: LastPurchaseForSupplier[] = [];
      const seenTypes = new Set<string>();

      for (const purchase of data ?? []) {
        if (!purchase.purchase_items || !Array.isArray(purchase.purchase_items)) continue;
        for (const item of purchase.purchase_items) {
          if (typeof item !== "object" || !item) continue;
          const batteryTypeName =
            item.battery_types?.name || "غير معروف";
          if (!seenTypes.has(batteryTypeName)) {
            seenTypes.add(batteryTypeName);
            batteryRows.push({
              batteryTypeName,
              price: item.price_per_kg,
              total: item.total,
              date: purchase.date,
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
