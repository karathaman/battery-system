import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart, MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";

interface Purchase {
  id: string;
  date: string;
  batteryType: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
}

interface AccountStatementEntry {
  id: string;
  date: string;
  type: 'purchase' | 'voucher_receipt' | 'voucher_payment';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  description?: string;
  lastPurchase?: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  purchases: Purchase[];
  notes?: string;
  isBlocked?: boolean;
  blockReason?: string;
  balance: number;
  messageSent?: boolean;
  lastMessageSent?: string;
}

interface CustomerDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerDetailsDialog = ({ open, onClose, customer }: CustomerDetailsDialogProps) => {
  if (!customer) return null;

  const [customerHistory, setCustomerHistory] = useState([]);
  const [accountStatement, setAccountStatement] = useState<AccountStatementEntry[]>([]);
  const [activeTab, setActiveTab] = useState("deliveries");

  // DATE RANGE FILTER
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    if (open && customer) {
      const fetchHistoryAndStats = async () => {
        // Fetch customer history and account statement
        const history = await fetchCustomerHistory(customer.customerCode);
        setCustomerHistory(history);
        const statement = await fetchAccountStatement(customer.id);
        setAccountStatement(statement);
      };

      fetchHistoryAndStats();
    }
  }, [open, customer]);

  const fetchCustomerHistory = async (customerCode: string) => {
    try {
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, date, battery_type, quantity, price_per_kg, total, discount, final_total")
        .eq("customer_code", customerCode);

      if (purchaseError) {
        console.error("Error fetching purchases:", purchaseError);
      }

      return purchases || [];
    } catch (error) {
      console.error("Unexpected error fetching customer history:", error);
      return [];
    }
  };

  const fetchAccountStatement = async (customerId: string) => {
    try {
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, date, total, invoice_number, payment_method")
        .eq("customer_id", customerId);

      if (purchaseError) {
        console.error("Error fetching purchases:", purchaseError);
      }

      const entries: AccountStatementEntry[] = [];

      (purchases || []).forEach(purchase => {
        const isCredit = purchase.payment_method !== 'cash' && !!purchase.invoice_number;
        entries.push({
          id: purchase.id,
          date: purchase.date,
          type: 'purchase',
          description: isCredit
            ? `فاتورة مبيعات (آجل) - ${purchase.invoice_number || '-'}` 
            : `فاتورة مبيعات - ${purchase.invoice_number || '-'}`,
          debit: purchase.total,
          credit: 0,
          balance: 0,
          reference: purchase.invoice_number || '-'
        });
      });

      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let runningBalance = 0;
      entries.forEach(entry => {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
      });

      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return entries;
    } catch (error) {
      console.error("Unexpected error fetching account statement:", error);
      return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center bg-blue-50 " style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات العميل - {customer.name} - {customer.customerCode}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ====== FILTERS BAR ====== */}
          <div className="flex flex-wrap items-center gap-4 bg-blue-50 rounded-lg p-2 mb-2">
            <span className="text-sm text-gray-500">من</span>
            <input
              type="date"
              value={dateRange.startDate || ""}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="border rounded-md p-2 text-sm text-gray-600 bg-white"
            />
            <span className="text-sm text-gray-500">إلى</span>
            <input
              type="date"
              value={dateRange.endDate || ""}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="border rounded-md p-2 text-sm text-gray-600 bg-white"
            />
            <button
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                setDateRange({
                  startDate: lastWeek.toISOString().split("T")[0],
                  endDate: today.toISOString().split("T")[0],
                });
              }}
              className="bg-blue-400 text-white text-sm py-1 px-2 rounded-md"
            >
              آخر أسبوع
            </button>
            <span className="text-gray-400">-</span>
            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setMonth(today.getMonth() - 1);
                setDateRange({
                  startDate: lastMonth.toISOString().split("T")[0],
                  endDate: today.toISOString().split("T")[0],
                });
              }}
              className="bg-blue-400 text-white text-sm py-1 px-2 rounded-md"
            >
              آخر شهر
            </button>
          </div>
          {/* ====== END FILTERS BAR ====== */}

          {/* Tabs for Purchases & Statement */}
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                  <TabsList className="bg-blue-50" dir="rtl">
                    <TabsTrigger value="deliveries" className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <ShoppingCart className="w-4 h-4" />
                      تاريخ المبيعات
                    </TabsTrigger>
                    <TabsTrigger value="statement" className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <FileText className="w-4 h-4" />
                      كشف الحساب
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="deliveries" className="mt-4">
                  {/* Delivery History Table */}
                  {customerHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 font-semibold text-right">التاريخ</th>
                            <th className="p-3 font-semibold text-right">الصنف</th>
                            <th className="p-3 font-semibold text-right">الكمية</th>
                            <th className="p-3 font-semibold text-right">سعر الكيلو</th>
                            <th className="p-3 font-semibold text-right">الإجمالي</th>
                            <th className="p-3 font-semibold text-right">الخصم</th>
                            <th className="p-3 font-semibold text-right">المبلغ النهائي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerHistory.map((entry, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 text-sm">{entry.date}</td>
                              <td className="p-3 text-sm">{entry.battery_type}</td>
                              <td className="p-3 text-sm">{entry.quantity}</td>
                              <td className="p-3 text-sm">{entry.price_per_kg}</td>
                              <td className="p-3 text-sm">{entry.total.toLocaleString()}</td>
                              <td className="p-3 text-sm">{entry.discount?.toLocaleString() || 0}</td>
                              <td className="p-3 text-sm font-bold text-green-600">{entry.final_total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      لا توجد مبيعات مسجلة
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="statement" className="mt-4">
                  {/* Account Statement Table */}
                  {accountStatement.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="p-3 font-semibold text-right">التاريخ</th>
                            <th className="p-3 font-semibold text-right">نوع الحركة</th>
                            <th className="p-3 font-semibold text-right">البيان</th>
                            <th className="p-3 font-semibold text-right">مدين</th>
                            <th className="p-3 font-semibold text-right">دائن</th>
                            <th className="p-3 font-semibold text-right">المرجع (رقم الفاتورة)</th>
                            <th className="p-3 font-semibold text-right">الرصيد</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accountStatement.map((entry, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50 text-center">
                              <td className="p-3 text-sm">{entry.date}</td>
                              <td className="p-3 text-sm">
                                {entry.type === 'purchase' ? (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                                    فاتورة مبيعات
                                  </span>
                                ) : entry.type === 'voucher_receipt' ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">سند قبض</span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">سند صرف</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">{entry.description}</td>
                              <td className="p-3 text-sm text-red-600">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                              <td className="p-3 text-sm text-green-600">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                              <td className="p-3 text-sm font-mono">{entry.reference || '-'}</td>
                              <td className={`p-3 text-sm font-bold ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.balance.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      لا توجد حركات في كشف الحساب
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
