
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PurchaseRow = {
  id: string;
  date: string;
  supplier_id: string;
  purchase_items: {
    battery_type_id: string;
    battery_types?: { name: string } | null;
    quantity: number;
    price_per_kg: number;
    total: number;
  }[];
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
      // Fetch purchases for this supplier (regular purchases)
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select(
          `id, date, purchase_items:battery_type_id (battery_type_id, price_per_kg, quantity, total, battery_types(name))`
        )
        .eq("supplier_id", supplierId)
        .order("date", { ascending: false });

      // Fetch daily_purchases for this supplier (where we use supplier_id, if it exists - if not fallback to supplier code/phone)
      // For safety, let's stick to purchases only for now as daily_purchases might not always use supplier_id (could be added if needed).

      if (purchaseError) throw new Error(purchaseError.message);

      const batteryRows: {
        batteryTypeName: string;
        price: number;
        total: number;
        date: string;
      }[] = [];

      const seenTypes = new Set<string>();

      for (const purchase of purchaseData || []) {
        for (const item of (purchase.purchase_items ?? [])) {
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
