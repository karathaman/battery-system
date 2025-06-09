export interface Sale {
  id: string;
  date: string;
  quantity: number;
  batteryType: string;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
  notes?: string;
}

export interface Purchase {
  id: string;
  date: string;
  quantity: number;
  batteryType: string;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
  notes?: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  description?: string;
  lastSale: string;
  totalSales: number;
  totalAmount: number;
  averagePrice: number;
  sales: Sale[];
  lastPurchase: string;
  totalPurchases: number;
  purchases: Purchase[];
  isBlocked: boolean;
  blockReason?: string;
  notes?: string;
  last2Quantities?: number[];
  last2Prices?: number[];
} 