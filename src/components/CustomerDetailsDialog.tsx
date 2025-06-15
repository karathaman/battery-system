import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart, MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { exportAccountStatementToExcel, exportAccountStatementToPDF } from "@/utils/accountExportUtils";

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

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  description?: string;
  lastPurchase?: string;
  total_sold_quantity: number;
  totalAmount: number;
  averagePrice: number;
  purchases: Purchase[];
  notes?: string;
  isBlocked?: boolean;
  blockReason?: string;
  balance: number;
  messageSent?: boolean;
  lastMessageSent?: string;
  last2Quantities?: number[];
  last2Prices?: number[];
  last2BatteryTypes?: string[];
}

interface CustomerDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

interface AccountStatementEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'sale' | 'voucher';
}

export const CustomerDetailsDialog = ({ open, onClose, customer }: CustomerDetailsDialogProps) => {
  const [customerHistory, setCustomerHistory] = useState([]);
  const [accountStatement, setAccountStatement] = useState<AccountStatementEntry[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  // --- NEW STATE FOR BATTERY TYPE FILTER ---
  const [batteryTypeFilter, setBatteryTypeFilter] = useState<string>("all");

  // --- BATTERY TYPES FROM DB ---
  const [batteryTypesFromDB, setBatteryTypesFromDB] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    const fetchBatteryTypes = async () => {
      const { data, error } = await supabase.from("battery_types").select("name");
      if (!error && data) {
        setBatteryTypesFromDB(data.map(bt => bt.name));
      }
    };
    fetchBatteryTypes();
  }, [open]);

  // --- CREATE A BATTERY TYPE LIST BASED ON HISTORY ---
  // نستخرج الأنواع الموجودة في السجل نفسه فقط
  const batteryTypesList =
    batteryTypesFromDB && batteryTypesFromDB.length > 0
      ? batteryTypesFromDB
      : [];

  // فلترة التاريخ حسب التواريخ ونوع البطارية
  const filteredHistory = customerHistory
    .filter((entry: any) => {
      const entryDate = new Date(entry.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      if (batteryTypeFilter !== "all" && entry.battery_type !== batteryTypeFilter)
        return false;
      return true;
    });

  // إعادة حساب الكمية/المبلغ/المتوسط حسب الفلاتر
  const totalQuantity = filteredHistory.reduce(
    (sum: number, e: any) => sum + (Number(e.quantity) || 0),
    0
  );
  const totalAmount = filteredHistory.reduce(
    (sum: number, e: any) => sum + (Number(e.final_total) || 0),
    0
  );
  const averagePrice =
    totalQuantity > 0
      ? Math.round(
          filteredHistory.reduce(
            (sum: number, e: any) =>
              sum + (Number(e.price_per_kg) || 0) * (Number(e.quantity) || 0),
            0
          ) / totalQuantity
        )
      : 0;

  useEffect(() => {
    if (open && customer) {
      const fetchHistory = async () => {
        const history = await fetchCustomerHistory(customer.customerCode);
        setCustomerHistory(history);
      };

      const fetchStatement = async () => {
        const statement = await fetchAccountStatement(customer.id);
        setAccountStatement(statement);
      };

      fetchHistory();
      fetchStatement();
    }
  }, [open, customer]);

  if (!customer) return null;

  const fetchCustomerHistory = async (customerCode: string) => {
    try {
      console.log("Fetching history for customerCode:", customerCode);

      // Fetch data from sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          id, 
          date, 
          subtotal, 
          discount, 
          total,
          sale_items (
            battery_type_id,
            quantity,
            price_per_kg,
            total
          )
        `)
        .eq("customer_id", customer.id);

      if (salesError) {
        console.error("Error fetching sales:", salesError);
        return [];
      }

      console.log("Sales:", sales);

      // Transform sales data to match the expected format
      const history = sales.map(sale => ({
        id: sale.id,
        date: sale.date,
        battery_type: "نوع البطارية", // You might need to join with battery_types table
        quantity: sale.sale_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        price_per_kg: sale.sale_items?.[0]?.price_per_kg || 0,
        total: sale.subtotal,
        discount: sale.discount,
        final_total: sale.total
      }));

      // Sort by date
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error("Unexpected error fetching customer history:", error);
      return [];
    }
  };

  const fetchAccountStatement = async (customerId: string) => {
    try {
      console.log("Fetching account statement for customer:", customerId);

      // Fetch all sales for the customer (we'll show all sales that affect account balance)
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("id, date, total, invoice_number")
        .eq("customer_id", customerId);

      if (salesError) {
        console.error("Error fetching sales:", salesError);
      }

      // Fetch vouchers (receipts and payments)
      const { data: vouchers, error: voucherError } = await supabase
        .from("vouchers")
        .select("id, date, amount, voucher_number, type")
        .eq("entity_type", "customer")
        .eq("entity_id", customerId);

      if (voucherError) {
        console.error("Error fetching vouchers:", voucherError);
      }

      console.log("Sales:", sales);
      console.log("Vouchers:", vouchers);

      // Format account statement entries
      const entries: AccountStatementEntry[] = [];

      // Add sales as debit entries (increase customer debt)
      (sales || []).forEach(sale => {
        entries.push({
          id: sale.id,
          date: sale.date,
          description: `فاتورة مبيعات رقم ${sale.invoice_number}`,
          debit: sale.total,
          credit: 0,
          balance: 0, // Will be calculated below
          type: 'sale'
        });
      });

      // Add vouchers as credit/debit entries
      (vouchers || []).forEach(voucher => {
        const isReceipt = voucher.type === 'receipt';
        entries.push({
          id: voucher.id,
          date: voucher.date,
          description: `${isReceipt ? 'سند قبض' : 'سند صرف'} رقم ${voucher.voucher_number}`,
          debit: isReceipt ? 0 : voucher.amount,
          credit: isReceipt ? voucher.amount : 0,
          balance: 0, // Will be calculated below
          type: 'voucher'
        });
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      entries.forEach(entry => {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
      });

      return entries;
    } catch (error) {
      console.error("Unexpected error fetching account statement:", error);
      return [];
    }
  };

  const getDaysSinceLastPurchase = (lastPurchase?: string) => {
    if (!lastPurchase) return 0;
    const today = new Date();
    const purchaseDate = new Date(lastPurchase);
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSinceLastMessage = (lastMessage?: string) => {
    if (!lastMessage) return 0;
    const today = new Date();
    const messageDate = new Date(lastMessage);
    const diffTime = Math.abs(today.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center bg-blue-50 " style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات العميل - {customer?.name} - {customer?.customerCode}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>من</span>
          <input
            type="date"
            value={dateRange.startDate || ""}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="border rounded-md p-2 text-sm text-gray-600"
          />
          <span className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>إلى</span>
          <input
            type="date"
            value={dateRange.endDate || ""}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="border rounded-md p-2 text-sm text-gray-600"
          />
          <button
            type="button"
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
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >آخر أسبوع</button>
          <span className="text-gray-400">-</span>
          <button
            type="button"
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
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >آخر شهر</button>
          <select
            value={batteryTypeFilter}
            onChange={(e) => setBatteryTypeFilter(e.target.value)}
            className="border rounded-md p-2 text-sm text-gray-600"
            style={{ minWidth: 110 }}
          >
            <option value="all">كل الأصناف</option>
            {batteryTypesList.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-6">
          {/* Customer Basic Info */}
          <Card>
            <CardHeader className="flex justify-center">
              <CardTitle className="flex text-blue-800 items-center bg-blue-50 px-2 py-2 rounded-md gap-2 flex-row-reverse justify-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                معلومات العميل الأساسية 
                <User className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-1 ">
                <div className="flex flex-col items-center gap-1 justify-center bg-blue-50 px-1 py-2 rounded-md">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1 justify-center">
                    <User className="w-4 h-4" />
                    الاسم
                  </span>
                  <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.name}</span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-green-50 px-1 py-2 gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    الجوال
                  </span>
                  <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.phone}</span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-blue-50 px-1 py-2 rounded-md gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    آخر شراء
                  </span>
                  <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {customer.lastPurchase ? `${customer.lastPurchase} (منذ ${getDaysSinceLastPurchase(customer.lastPurchase)} يوم)` : "لا يوجد"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-green-50 px-1 py-2 rounded-md gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    آخر رسالة
                  </span>
                  <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {customer.lastMessageSent ? `${customer.lastMessageSent} (منذ ${getDaysSinceLastMessage(customer.lastMessageSent)} يوم)` : "لم ترسل رسائل"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-blue-50 px-1 py-2 rounded-md gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    الحالة
                  </span>
                  <div className="flex gap-2">
                    <Badge
                      variant="default"
                      className={
                        customer.isBlocked
                          ? "bg-red-600 text-white"
                          : "bg-green-600 text-white"
                      }
                    >
                      {customer.isBlocked ? "محظور" : "نشط"}
                    </Badge>
                    {customer.messageSent && (
                      <Badge variant="secondary">
                        تم إرسال رسالة
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
 
              {(customer.description || customer.notes) && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-2 mt-1"> 
                  {customer.notes && (
                    <div className="text-xs bg-yellow-50 px-1 py-2 rounded-md">
                      <span className="text-xs text-gray-700">ملاحظات</span>
                      <div className="font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {customer.isBlocked && customer.blockReason && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="font-semibold text-red-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>سبب الحظر: </span>
                  <span className="text-red-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.blockReason}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Statistics */}
          <Card>
            <CardHeader className="flex justify-center">
              <CardTitle
                className="flex items-center gap-2 px-2 py-2 rounded-md bg-green-50 flex-row-reverse justify-center text-center w-full"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span className="text-green-500">إحصائيات المبيعات</span>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الكمية</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{averagePrice}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط السعر</p>
                </div>
                <div className={`${customer?.balance >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
                  <p className={`text-2xl font-bold ${customer?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer?.balance?.toLocaleString?.() ?? 0}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>الرصيد</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales History and Account Statement Tabs */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Tabs */}
                <Tabs defaultValue="sales" className="w-full">
                  <TabsList className="grid w-full md:w-auto grid-cols-2">
                    <TabsTrigger value="sales" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      تاريخ المبيعات
                    </TabsTrigger>
                    <TabsTrigger value="statement" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <FileText className="w-4 h-4 ml-2" />
                      كشف الحساب
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sales">
                    {/* Sales History */}
                    {filteredHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الصنف</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>سعر الكيلو</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ النهائي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHistory.map((entry: any, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm">{entry.date}</td>
                                <td className="p-3 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{entry.battery_type}</td>
                                <td className="p-3 text-sm">{entry.quantity}</td>
                                <td className="p-3 text-sm">{entry.price_per_kg}</td>
                                <td className="p-3 text-sm">{(entry.total?.toLocaleString?.() ?? entry.total) || 0}</td>
                                <td className="p-3 text-sm">{(entry.discount?.toLocaleString?.() ?? entry.discount) || 0}</td>
                                <td className="p-3 text-sm font-bold text-green-600">{(entry.final_total?.toLocaleString?.() ?? entry.final_total) || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا توجد مبيعات مسجلة
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="statement">
                    {/* أزرار التصدير */}
                    {accountStatement.length > 0 && (
                      <div className="mb-3 flex gap-2 justify-end">
                        <button
                          className="bg-green-600 text-white py-1 px-3 rounded shadow hover:bg-green-700 text-sm"
                          onClick={() => {
                            const cols: { title: string; key: string; format?: (v: any) => any }[] = [
                              { title: "التاريخ", key: "date" },
                              { title: "البيان", key: "description" },
                              { title: "مدين", key: "debit", format: (v: any) => v > 0 ? v.toLocaleString() : "-" },
                              { title: "دائن", key: "credit", format: (v: any) => v > 0 ? v.toLocaleString() : "-" },
                              { title: "الرصيد", key: "balance", format: (v: any) => v.toLocaleString() }
                            ];
                            const filtered = accountStatement.filter((entry) => {
                              const entryDate = new Date(entry.date);
                              const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
                              const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
                              if (startDate && entryDate < startDate) return false;
                              if (endDate && entryDate > endDate) return false;
                              return true;
                            });
                            exportAccountStatementToExcel({
                              data: filtered,
                              columns: cols,
                              filename: `كشف حساب عميل ${customer.name}.xlsx`
                            });
                          }}
                        >تصدير Excel</button>
                        <button
                          className="bg-blue-600 text-white py-1 px-3 rounded shadow hover:bg-blue-700 text-sm"
                          onClick={() => {
                            const cols: { title: string; key: string; format?: (v: any) => any }[] = [
                              { title: "التاريخ", key: "date" },
                              { title: "البيان", key: "description" },
                              { title: "مدين", key: "debit", format: (v: any) => v > 0 ? v.toLocaleString() : "-" },
                              { title: "دائن", key: "credit", format: (v: any) => v > 0 ? v.toLocaleString() : "-" },
                              { title: "الرصيد", key: "balance", format: (v: any) => v.toLocaleString() }
                            ];
                            const filtered = accountStatement.filter((entry) => {
                              const entryDate = new Date(entry.date);
                              const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
                              const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
                              if (startDate && entryDate < startDate) return false;
                              if (endDate && entryDate > endDate) return false;
                              return true;
                            });
                            exportAccountStatementToPDF({
                              data: filtered,
                              columns: cols,
                              filename: `كشف حساب عميل ${customer.name}.pdf`,
                              title: `كشف حساب العميل: ${customer.name} (${customer.customerCode})`
                            });
                          }}
                        >تصدير PDF</button>
                      </div>
                    )}
                    {/* Account Statement Table */}
                    {accountStatement.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>البيان</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>مدين</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>دائن</th>
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الرصيد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accountStatement
                              .filter((entry) => {
                                const entryDate = new Date(entry.date);
                                const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
                                const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

                                if (startDate && entryDate < startDate) return false;
                                if (endDate && entryDate > endDate) return false;

                                return true;
                              })
                              .map((entry, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="p-3 text-sm">{entry.date}</td>
                                  <td className="p-3 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{entry.description}</td>
                                  <td className="p-3 text-sm text-red-600">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                                  <td className="p-3 text-sm text-green-600">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                                  <td className={`p-3 text-sm font-bold ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {entry.balance.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا توجد حركات على الحساب
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
