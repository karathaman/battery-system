
export interface PurchaseItem {
  id: string;
  batteryType: string;
  quantity: number;
  price: number;
  total: number;
  battery_type_id?: string;
  price_per_kg?: number;
}

export interface Purchase {
  id: string;
  invoice_number: string;
  date: string;
  supplier_id: string;
  items?: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  suppliers?: {
    name: string;
    supplier_code?: string;
  };
  purchase_items?: PurchaseItem[];
}
