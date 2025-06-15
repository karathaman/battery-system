import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart, MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
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

  // --- NEW STATE FOR STATS ---
  const [stats, setStats] = useState({
    totalQuantity: 0,
    totalAmount: 0,
    averagePrice: 0
  });

  // BATTERY TYPES FILTER STATE
  const [batteryTypesFromDB, setBatteryTypesFromDB] = useState<string[]>([]); // All battery types from DB
  const [batteryTypeFilter, setBatteryTypeFilter] = useState<string>("all");

  // DATE RANGE FILTER
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    if (open && supplier) {
      const fetchHistoryAndStats = async () => {
        // 1. Fetch both daily purchases and purchases
        const history = await fetchSupplierHistory(supplier.supplierCode);
        setSupplierHistory(history);

        // 2. Compute combined stats from both sources
        let totalQuantity = 0;
        let totalAmount = 0;
        let totalWeightedSum = 0;
        let totalRecords = 0;

        // يومية
        const { data: dailyPurchases, error: dailyError } = await supabase
          .from("daily_purchases")
          .select("quantity, price_per_kg, total")
          .eq("supplier_code", supplier.supplierCode);

        if (dailyPurchases && dailyPurchases.length) {
          dailyPurchases.forEach((p) => {
            totalQuantity += Number(p.quantity) || 0;
            totalAmount += Number(p.total) || 0;
            totalWeightedSum += (Number(p.price_per_kg) || 0) * (Number(p.quantity) || 0);
            totalRecords += 1;
          });
        }

        // مشتريات شاملة + أصنافها
        const { data: purchaseData, error: purchaseError } = await supabase
          .from("purchases")
          .select(`
            id,
            supplier_id,
            purchase_items (quantity, price_per_kg, total)
          `)
          .eq("supplier_id", supplier.id);

        if (purchaseData && Array.isArray(purchaseData)) {
          purchaseData.forEach((purchase) => {
            if (Array.isArray(purchase.purchase_items)) {
              purchase.purchase_items.forEach((item) => {
                totalQuantity += Number(item.quantity) || 0;
                totalAmount += Number(item.total) || 0;
                totalWeightedSum += (Number(item.price_per_kg) || 0) * (Number(item.quantity) || 0);
                totalRecords += 1;
              });
            }
          });
        }

        // متوسط السعر (على مستوى كل كيلو)
        const averagePrice = totalQuantity > 0 ? (totalWeightedSum / totalQuantity).toFixed(2) : 0;

        setStats({
          totalQuantity,
          totalAmount,
          averagePrice: Number(averagePrice)
        });

        // كشف الحساب
        const statement = await fetchAccountStatement(supplier.id);
        setAccountStatement(statement);
      };

      fetchHistoryAndStats();
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

      // جلب جميع فواتير المشتريات الخاصة بالمورد
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, date, total, invoice_number, payment_method")
        .eq("supplier_id", supplierId);

      if (purchaseError) {
        console.error("Error fetching purchases:", purchaseError);
      }

      // جلب السندات (قبض وصرف)
      const { data: vouchers, error: voucherError } = await supabase
        .from("vouchers")
        .select("id, date, amount, type, voucher_number, reference, notes")
        .eq("entity_id", supplierId)
        .eq("entity_type", "supplier");

      if (voucherError) {
        console.error("Error fetching vouchers:", voucherError);
      }

      // تجهيز كشف الحساب
      const entries: AccountStatementEntry[] = [];

      // إدراج فواتير المشتريات (الآجلة والنقدية)
      (purchases || []).forEach(purchase => {
        // هنا نميز الفاتورة "آجلة" إذا كان payment_method != 'cash'
        const isCredit = purchase.payment_method !== 'cash' && !!purchase.invoice_number;
        entries.push({
          id: purchase.id,
          date: purchase.date,
          type: 'purchase',
          description: isCredit
            ? `فاتورة مشتريات (آجل) - ${purchase.invoice_number || '-'}` 
            : `فاتورة مشتريات - ${purchase.invoice_number || '-'}`,
          debit: purchase.total,
          credit: 0,
          balance: 0,
          reference: purchase.invoice_number || '-'
        });
      });

      // إدراج السندات
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
          balance: 0,
          reference: voucher.voucher_number || '-'
        });
      });

      // ترتيب حسب التاريخ للأقدم للأحدث لتسهيل الترصيد
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // حساب الرصيد الجاري لكل صف
      let runningBalance = 0;
      entries.forEach(entry => {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
      });

      // قلب الترتيب للعرض (الأحدث أولًا)
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

  // جلب أنواع البطاريات من جدول battery_types عند فتح الديالوج فقط أول مرة
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

  // عند تغيير الفلاتر يتم تصفية السجل
  const filterDataByDateAndBattery = (data: any[]) => {
    return data.filter((entry) => {
      // date
      const entryDate = new Date(entry.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;

      // battery type
      if (batteryTypeFilter !== "all" && entry.battery_type !== batteryTypeFilter) return false;

      return true;
    });
  };

  // بيانات التوريدات بعد تطبيق الفلاتر
  const filteredHistory = useMemo(
    () => filterDataByDateAndBattery(supplierHistory),
    [supplierHistory, dateRange, batteryTypeFilter]
  );

  // إحصائيات مشتقة فقط من البيانات المفلترة بالوقت و/أو النوع
  const filteredStats = useMemo(() => {
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalWeightedSum = 0;

    filteredHistory.forEach((entry) => {
      totalQuantity += Number(entry.quantity) || 0;
      totalAmount += Number(entry.final_total) || 0;
      totalWeightedSum += (Number(entry.price_per_kg) || 0) * (Number(entry.quantity) || 0);
    });
    const averagePrice = totalQuantity > 0 ? (totalWeightedSum / totalQuantity).toFixed(2) : "0";
    return {
      totalQuantity,
      totalAmount,
      averagePrice: parseFloat(averagePrice),
    };
  }, [filteredHistory]);

  // --- Add this helper for filtering by date ---
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

        {/* الفلاتر - خارج الـ Tabs */}
        <div className="flex flex-wrap items-center gap-4 bg-blue-50 rounded-lg p-2 mb-4 mt-4">
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
          >
            آخر أسبوع
          </button>
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
          >
            آخر شهر
          </button>
          <select
            value={batteryTypeFilter}
            onChange={(e) => setBatteryTypeFilter(e.target.value)}
            className="border rounded-md p-2 text-sm bg-white text-gray-800 ml-2"
            style={{ minWidth: 120, fontFamily: 'Tajawal, sans-serif' }}>
            <option value="all">كل الأصناف</option>
            {batteryTypesFromDB.map((type, idx) => (
              <option value={type} key={idx}>{type}</option>
            ))}
          </select>
        </div>

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
                  <p className="text-2xl font-bold text-blue-600">{filteredStats.totalQuantity.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الكمية</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />

                  <p className="text-2xl font-bold text-green-600">{filteredStats.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{filteredStats.averagePrice}</p>
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
              {/* --- Tabs & Filters --- */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
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
                  </div>
                  {/* --- END FILTERS --- */}
                </Tabs>
              </div>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
