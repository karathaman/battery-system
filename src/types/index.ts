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
  balance: number; // Made required to match usage
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

// Sale types
export interface SaleItem {
  id: string;
  batteryType: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
}

// Receipt/Voucher types
export interface ReceiptItem {
  id: string;
  description: string;
  amount: number;
  vat?: number;
  vatAmount?: number;
  totalAmount: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  date: string;
  type: 'receipt' | 'payment' | 'all'; // Added 'all' for mixed type
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  items: ReceiptItem[];
  subtotal: number;
  totalVat: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  reference?: string;
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
  search?: string; // Added for backward compatibility
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  messageStatus?: string;
  lastPurchaseFilter?: string;
  type?: string; // Added for receipt/voucher filtering
  isBlocked?: boolean; // Added for customer/supplier blocking filter
}
