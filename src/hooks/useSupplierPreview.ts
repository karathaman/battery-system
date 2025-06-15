
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SupplierPreviewPurchase = {
  batteryTypeName: string;
  quantity: number;
  price: number;
  date: string;
};

export type SupplierPreviewData = {
  lastPurchases: SupplierPreviewPurchase[];
  balance: number;
};

async function getSupplierPreview(supplierId: string) : Promise<SupplierPreviewData> {
  if (!supplierId) return { lastPurchases: [], balance: 0 };

  // Get supplier balance
  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select("balance")
    .eq("id", supplierId)
    .maybeSingle();

  // Get last purchases from both 'purchases' and 'daily_purchases'
  const { data: purchases } = await supabase
    .from("purchases")
    .select(`
      date,
      supplier_id,
      purchase_items(
        battery_type_id,
        quantity,
        price_per_kg,
        battery_types(name)
      )
    `)
    .eq("supplier_id", supplierId)
    .order("date", { ascending: false });

  let purchaseRows: SupplierPreviewPurchase[] = [];
  for (const purchase of purchases ?? []) {
    if (!purchase.purchase_items) continue;
    for (const item of purchase.purchase_items) {
      purchaseRows.push({
        batteryTypeName: item.battery_types?.name || "غير معروف",
        quantity: item.quantity,
        price: item.price_per_kg,
        date: purchase.date,
      });
    }
  }

  // Daily purchases by supplier id, code, or name
  const { data: supplierInfo } = await supabase
    .from("suppliers")
    .select("supplier_code, phone, name")
    .eq("id", supplierId)
    .maybeSingle();

  let queries: [string, string][] = [];
  if (supplierInfo?.supplier_code) queries.push(["supplier_code", supplierInfo.supplier_code]);
  if (supplierInfo?.phone) queries.push(["supplier_phone", supplierInfo.phone]);
  if (supplierInfo?.name) queries.push(["supplier_name", supplierInfo.name]);
  
  let dailyRows: SupplierPreviewPurchase[] = [];
  if (queries.length > 0) {
    let query = supabase
      .from("daily_purchases")
      .select("*")
      .order("date", { ascending: false });
    for (const [column, value] of queries) {
      query = query.or(`${column}.eq.${value}`);
    }
    const { data: dailyPurchases } = await query;
    dailyRows = (dailyPurchases ?? []).map((item: any) => ({
      batteryTypeName: item.battery_type || "غير معروف",
      quantity: item.quantity,
      price: item.price_per_kg,
      date: item.date,
    })) || [];
  }

  // Merge, sort, filter for two distinct battery types
  const allRows = [...purchaseRows, ...dailyRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const seenTypes = new Set();
  const lastPurchases: SupplierPreviewPurchase[] = [];
  for (const row of allRows) {
    if (!seenTypes.has(row.batteryTypeName)) {
      seenTypes.add(row.batteryTypeName);
      lastPurchases.push(row);
    }
    if (lastPurchases.length >= 2) break;
  }

  return {
    lastPurchases,
    balance: supplier?.balance || 0,
  };
}

export function useSupplierPreview(supplierId: string | undefined) {
  return useQuery<SupplierPreviewData>({
    queryKey: ["supplier-preview", supplierId],
    enabled: !!supplierId,
    queryFn: () => getSupplierPreview(supplierId!),
  });
}
