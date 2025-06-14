
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart, MessageCircle } from "lucide-react";
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
  balance: number; // Made required
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

export const CustomerDetailsDialog = ({ open, onClose, customer }: CustomerDetailsDialogProps) => {
  const [customerHistory, setCustomerHistory] = useState([]);

  useEffect(() => {
    if (open && customer) {
      const fetchHistory = async () => {
        const history = await fetchCustomerHistory(customer.customerCode);
        setCustomerHistory(history);
      };

      fetchHistory();
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

  useEffect(() => {
    if (open && customer) {
      const fetchHistory = async () => {
        const history = await fetchCustomerHistory(customer.customerCode);
        setCustomerHistory(history);
      };

      fetchHistory();
    }
  }, [open, customer]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center bg-blue-50 " style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات العميل - {customer.name} - {customer.customerCode}
          </DialogTitle>
        </DialogHeader>

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
                <span className="text-green-500">إحصائيات المشتريات</span>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{customer.totalPurchases}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الكمية</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{customer.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{customer.averagePrice}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط السعر</p>
                </div>
                <div className={`${customer.balance >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
                  <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
                  <p className={`text-2xl font-bold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.balance.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>الرصيد</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle
                className="flex flex-col md:flex-row justify-between items-center gap-2 px-2 py-2 rounded-md bg-blue-50 flex-row-reverse"
                style={{ fontFamily: "Tajawal, sans-serif" }}
              >
                {/* التواريخ والأزرار على اليمين */}
                <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-0 order-2 md:order-1">
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
                {/* العنوان على اليسار */}
                <span className="flex text-blue-800 items-center gap-2 order-1 md:order-2">
                  <ShoppingCart className="w-5 h-5" />
                  تاريخ المشتريات
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtered Data */}
              {customerHistory.length > 0 ? (
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
                      {customerHistory
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
                            <td className="p-3 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{entry.battery_type}</td>
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
                <p className="text-center text-gray-500 py-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  لا توجد مشتريات مسجلة
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
