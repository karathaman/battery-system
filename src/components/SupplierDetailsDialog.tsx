
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart, MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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

interface Supplier {
  id: string;
  supplierCode: string;
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
  last2Quantities?: number[];
  last2Prices?: number[];
  last2BatteryTypes?: string[];
}

interface SupplierDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const SupplierDetailsDialog = ({ open, onClose, supplier }: SupplierDetailsDialogProps) => {
  if (!supplier) return null;

  const [supplierHistory, setSupplierHistory] = useState([]);
  const [accountStatement, setAccountStatement] = useState<AccountStatementEntry[]>([]);
  const [activeTab, setActiveTab] = useState("deliveries");

  useEffect(() => {
    if (open && supplier) {
      const fetchHistory = async () => {
        const history = await fetchSupplierHistory(supplier.supplierCode);
        setSupplierHistory(history);
        
        const statement = await fetchAccountStatement(supplier.id);
        setAccountStatement(statement);
      };

      fetchHistory();
    }
  }, [open, supplier]);

  if (!supplier) return null;

  const fetchSupplierHistory = async (supplierCode: string) => {
    try {
      console.log("Fetching history for supplierCode:", supplierCode);

      // Fetch data from daily_purchases
      const { data: dailyPurchases, error: dailyError } = await supabase
        .from("daily_purchases")
        .select("id, date, battery_type, quantity, price_per_kg, total, discount, final_total")
        .eq("supplier_code", supplierCode);

      if (dailyError) {
        console.error("Error fetching daily purchases:", dailyError);
      }

      console.log("Daily Purchases:", dailyPurchases);

      // Fetch data from purchases and purchase_items
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select(`
          id,
          date,
          subtotal,
          discount,
          total,
          purchase_items (
            battery_type_id,
            quantity,
            price_per_kg,
            total
          ),
          suppliers!inner (
            supplier_code
          )
        `)
        .eq("suppliers.supplier_code", supplierCode);

      if (purchaseError) {
        console.error("Error fetching purchases:", purchaseError);
      }

      console.log("Purchase Data:", purchaseData);

      // Get battery type names for purchase items
      const batteryTypeIds = purchaseData?.flatMap(purchase => 
        purchase.purchase_items?.map(item => item.battery_type_id) || []
      ) || [];

      const { data: batteryTypes } = await supabase
        .from("battery_types")
        .select("id, name")
        .in("id", batteryTypeIds);

      const batteryTypeMap = Object.fromEntries(
        batteryTypes?.map(bt => [bt.id, bt.name]) || []
      );

      // Format daily purchases
      const formattedDailyPurchases = (dailyPurchases || []).map(purchase => ({
        id: purchase.id,
        date: purchase.date,
        battery_type: purchase.battery_type,
        quantity: purchase.quantity,
        price_per_kg: purchase.price_per_kg,
        total: purchase.total,
        discount: purchase.discount || 0,
        final_total: purchase.final_total,
        source: 'daily'
      }));

      // Format regular purchases
      const formattedPurchases = [];
      (purchaseData || []).forEach(purchase => {
        if (purchase.purchase_items && purchase.purchase_items.length > 0) {
          purchase.purchase_items.forEach(item => {
            formattedPurchases.push({
              id: `${purchase.id}-${item.battery_type_id}`,
              date: purchase.date,
              battery_type: batteryTypeMap[item.battery_type_id] || 'غير محدد',
              quantity: item.quantity,
              price_per_kg: item.price_per_kg,
              total: item.total,
              discount: purchase.discount || 0,
              final_total: item.total - (purchase.discount || 0),
              source: 'purchase'
            });
          });
        }
      });

      // Combine and sort by date (newest first)
      const allHistory = [...formattedDailyPurchases, ...formattedPurchases];
      const sortedHistory = allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return sortedHistory;
    } catch (error) {
      console.error("Unexpected error fetching supplier history:", error);
      return [];
    }
  };

  const fetchAccountStatement = async (supplierId: string) => {
    try {
      console.log("Fetching account statement for supplier:", supplierId);

      // Fetch all purchases for the supplier (we'll show all purchases that affect account balance)
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, date, total, invoice_number")
        .eq("supplier_id", supplierId);

      if (purchaseError) {
        console.error("Error fetching purchases:", purchaseError);
      }

      // Fetch vouchers (receipts and payments)
      const { data: vouchers, error: voucherError } = await supabase
        .from("vouchers")
        .select("id, date, amount, type, voucher_number, reference, notes")
        .eq("entity_id", supplierId)
        .eq("entity_type", "supplier");

      if (voucherError) {
        console.error("Error fetching vouchers:", voucherError);
      }

      console.log("Purchases:", purchases);
      console.log("Vouchers:", vouchers);

      // Format account statement entries
      const entries: AccountStatementEntry[] = [];

      // Add purchases as debit entries (increase supplier balance/debt)
      (purchases || []).forEach(purchase => {
        entries.push({
          id: purchase.id,
          date: purchase.date,
          type: 'purchase',
          description: `فاتورة مشتريات - ${purchase.invoice_number}`,
          debit: purchase.total,
          credit: 0,
          balance: 0, // Will be calculated later
          reference: purchase.invoice_number
        });
      });

      // Add vouchers
      (vouchers || []).forEach(voucher => {
        entries.push({
          id: voucher.id,
          date: voucher.date,
          type: voucher.type === 'receipt' ? 'voucher_receipt' : 'voucher_payment',
          description: voucher.type === 'receipt' 
            ? `سند قبض - ${voucher.voucher_number}` 
            : `سند صرف - ${voucher.voucher_number}`,
          debit: voucher.type === 'payment' ? voucher.amount : 0,
          credit: voucher.type === 'receipt' ? voucher.amount : 0,
          balance: 0, // Will be calculated later
          reference: voucher.voucher_number
        });
      });

      // Sort by date (oldest first for balance calculation)
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      entries.forEach(entry => {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
      });

      // Sort by date (newest first for display)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  const filterDataByDate = (data: any[]) => {
    return data.filter((entry) => {
      const entryDate = new Date(entry.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;

      return true;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center bg-blue-50 " style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات المورد - {supplier.name} - {supplier.supplierCode}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Basic Info */}
          <Card>
            <CardHeader className="flex justify-center">
              <CardTitle className="flex text-blue-800 items-center bg-blue-50 px-2 py-2 rounded-md gap-2 flex-row-reverse justify-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                معلومات المورد الأساسية 
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
                  <span className="  text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.name}</span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-green-50 px-1 py-2 gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    الجوال
                  </span>
                  <span className="  text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.phone}</span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-blue-50 px-1 py-2 rounded-md gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    آخر توريد
                  </span>
                  <span className="  text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {supplier.lastPurchase ? `${supplier.lastPurchase} (منذ ${getDaysSinceLastPurchase(supplier.lastPurchase)} يوم)` : "لا يوجد"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 justify-center bg-green-50 px-1 py-2 rounded-md gap-1">
                  <span className="font-bold text-md text-gray-700 flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    آخر رسالة
                  </span>
                  <span className="  text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {supplier.lastMessageSent ? `${supplier.lastMessageSent} (منذ ${getDaysSinceLastMessage(supplier.lastMessageSent)} يوم)` : "لم ترسل رسائل"}
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
                        supplier.isBlocked
                          ? "bg-red-600 text-white"
                          : "bg-green-600 text-white"
                      }
                    >
                      {supplier.isBlocked ? "محظور" : "نشط"}
                    </Badge>
                    {supplier.messageSent && (
                      <Badge variant="secondary">
                        تم إرسال رسالة
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
 
              {(supplier.description || supplier.notes) && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-2 mt-1"> 
                  {supplier.notes && (
                    <div className="text-xs bg-yellow-50 px-1 py-2 rounded-md">
                      <span className="text-xs  text-gray-700">ملاحظات</span>
                      <div className="font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {supplier.isBlocked && supplier.blockReason && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="font-semibold text-red-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>سبب الحظر: </span>
                  <span className="text-red-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.blockReason}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Statistics */}
          <Card>
            <CardHeader className="flex justify-center">
              <CardTitle
                className="flex items-center gap-2  px-2 py-2 rounded-md  bg-green-50 flex-row-reverse justify-center text-center w-full"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span className=" text-green-500 ">إحصائيات التوريدات</span>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{supplier.totalPurchases}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الكمية</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />

                  <p className="text-2xl font-bold text-green-600">{supplier.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{supplier.averagePrice}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط السعر </p>
                </div>
                <div className={`${supplier.balance >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />

                  <p className={`text-2xl font-bold ${supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {supplier.balance.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>الرصيد</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Purchase History and Account Statement */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <TabsList className="bg-blue-50" dir="rtl">
                      <TabsTrigger value="deliveries" className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <ShoppingCart className="w-4 h-4" />
                        تاريخ التوريدات
                      </TabsTrigger>
                      <TabsTrigger value="statement" className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <FileText className="w-4 h-4" />
                        كشف الحساب
                      </TabsTrigger>
                    </TabsList>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-500">من</span>
                      <input
                        type="date"
                        value={dateRange.startDate || ""}
                        onChange={(e) =>
                          setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="border rounded-md p-2 text-sm text-gray-600"
                      />
                      <span className="text-sm text-gray-500">إلى</span>
                      <input
                        type="date"
                        value={dateRange.endDate || ""}
                        onChange={(e) =>
                          setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="border rounded-md p-2 text-sm text-gray-600"
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
                  </div>

                  <TabsContent value="deliveries" className="mt-4">
                    {/* Delivery History Table */}
                    {supplierHistory.length > 0 ? (
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
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المصدر</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterDataByDate(supplierHistory).map((entry, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm">{entry.date}</td>
                                <td className="p-3 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{entry.battery_type}</td>
                                <td className="p-3 text-sm">{entry.quantity}</td>
                                <td className="p-3 text-sm">{entry.price_per_kg}</td>
                                <td className="p-3 text-sm">{entry.total.toLocaleString()}</td>
                                <td className="p-3 text-sm">{entry.discount?.toLocaleString() || 0}</td>
                                <td className="p-3 text-sm font-bold text-green-600">{entry.final_total.toLocaleString()}</td>
                                <td className="p-3 text-sm">
                                  <Badge variant={entry.source === 'daily' ? 'default' : 'secondary'}>
                                    {entry.source === 'daily' ? 'يومية' : 'فاتورة'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا توجد توريدات مسجلة
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="statement" className="mt-4">
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
                              <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المرجع</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterDataByDate(accountStatement).map((entry, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm">{entry.date}</td>
                                <td className="p-3 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{entry.description}</td>
                                <td className="p-3 text-sm text-red-600">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                                <td className="p-3 text-sm text-green-600">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                                <td className={`p-3 text-sm font-bold ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {entry.balance.toLocaleString()}
                                </td>
                                <td className="p-3 text-sm">{entry.reference || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا توجد حركات في كشف الحساب
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
