
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LastPurchaseForSupplier = {
  batteryTypeName: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  source: "purchases" | "daily";
};

async function getLastPurchases(supplierId: string | undefined): Promise<LastPurchaseForSupplier[]> {
  if (!supplierId) return [];

  // 1. Fetch recent purchases from 'purchases' table
  const { data: purchases, error: purchasesError } = await supabase
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

  if (purchasesError) throw new Error(purchasesError.message);

  // Map purchase items
  const purchaseRows: LastPurchaseForSupplier[] = [];
  for (const purchase of purchases ?? []) {
    if (!purchase.purchase_items || !Array.isArray(purchase.purchase_items)) continue;
    for (const item of purchase.purchase_items) {
      const batteryTypeName = item.battery_types?.name || "غير معروف";
      purchaseRows.push({
        batteryTypeName,
        quantity: item.quantity,
        price: item.price_per_kg,
        total: item.total,
        date: purchase.date,
        source: "purchases",
      });
    }
  }

  // 2. Fetch recent daily purchases from 'daily_purchases' for same supplier
  // For daily_purchases, supplier linkage may be by code, phone, or name. We'll need supplierCode and/or phone.
  // We'll first get supplier info from 'suppliers' table:
  const { data: supplierInfo, error: supplierError } = await supabase
    .from("suppliers")
    .select("supplier_code, phone, name")
    .eq("id", supplierId)
    .maybeSingle();

  if (supplierError) throw new Error(supplierError.message);

  const queries = [];
  if (supplierInfo?.supplier_code) queries.push(["supplier_code", supplierInfo.supplier_code]);
  if (supplierInfo?.phone) queries.push(["supplier_phone", supplierInfo.phone]);
  if (supplierInfo?.name) queries.push(["supplier_name", supplierInfo.name]);

  let dailyRows: LastPurchaseForSupplier[] = [];

  if (queries.length > 0) {
    let query = supabase
      .from("daily_purchases")
      .select("*")
      .order("date", { ascending: false });
    for (const [column, value] of queries) {
      query = query.or(`${column}.eq.${value}`);
    }
    const { data: dailyPurchases, error: dailyError } = await query;
    if (dailyError) throw new Error(dailyError.message);

    dailyRows =
      (dailyPurchases ?? []).map((item: any) => ({
        batteryTypeName: item.battery_type || "غير معروف",
        quantity: item.quantity,
        price: item.price_per_kg,
        total: item.total,
        date: item.date,
        source: "daily" as const,
      })) || [];
  }

  // Merge and sort all rows
  const allRows = [...purchaseRows, ...dailyRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Extract last 2 distinct battery types
  const seenTypes = new Set<string>();
  const batteryRows: LastPurchaseForSupplier[] = [];
  for (const row of allRows) {
    if (!seenTypes.has(row.batteryTypeName)) {
      seenTypes.add(row.batteryTypeName);
      batteryRows.push(row);
    }
    if (batteryRows.length >= 2) break;
  }
  return batteryRows;
}

export function useSupplierLastPurchases(supplierId: string | undefined) {
  return useQuery<LastPurchaseForSupplier[]>({
    queryKey: ["last-purchases", supplierId],
    enabled: !!supplierId,
    queryFn: () => getLastPurchases(supplierId),
  });
}
