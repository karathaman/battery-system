
// Customer types
export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  description?: string;
  notes?: string;
  lastPurchase?: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  purchases: CustomerPurchase[];
  last2Quantities?: number[];
  last2Prices?: number[];
  last2BatteryTypes?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  messageSent?: boolean;
  lastMessageSent?: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  description?: string;
  notes?: string;
}

export interface CustomerPurchase {
  id: string;
  date: string;
  batteryType: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
}

// Supplier types
export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  phone: string;
  description?: string;
  notes?: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  balance: number;
  lastPurchase?: string;
  purchases: SupplierPurchase[];
  isBlocked?: boolean;
  blockReason?: string;
  messageSent?: boolean;
  lastMessageSent?: string;
  last2Quantities?: number[];
  last2Prices?: number[];
  last2BatteryTypes?: string[];
}

export interface SupplierFormData {
  name: string;
  phone: string;
  description?: string;
  notes?: string;
}

export interface SupplierPurchase {
  id: string;
  date: string;
  batteryType: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
}

// Purchase types
export interface PurchaseItem {
  id: string;
  batteryType: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  color: string;
  createdDate: string;
  completedDate?: string;
}

export interface TaskGroup {
  id: string;
  title: string;
  tasks: Task[];
  createdDate: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common types
export interface FilterOptions {
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  messageStatus?: string;
  lastPurchaseFilter?: string;
}
