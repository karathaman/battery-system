
export interface VoucherItem {
  id: string;
  description: string;
  amount: number;
  vat?: number;
  vatAmount?: number;
  totalAmount: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  date: string;
  type: 'receipt' | 'payment' | 'all'; // Added 'all' for both receipt and payment
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  items: VoucherItem[];
  subtotal: number;
  totalVat: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  reference?: string;
}

export interface VoucherFormData {
  date: string;
  type: 'receipt' | 'payment' | 'all';
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  items: VoucherItem[];
  paymentMethod: string;
  notes?: string;
  reference?: string;
}

export interface VoucherFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: 'receipt' | 'payment' | 'all' | '';
  entityType?: 'customer' | 'supplier' | '';
  status?: 'pending' | 'completed' | 'cancelled' | '';
  searchTerm?: string;
}
