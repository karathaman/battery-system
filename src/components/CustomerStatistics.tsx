import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart3,
  User,
  Phone,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { useSales } from "@/hooks/useSales";

interface Sale {
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
  lastSale: string;
  totalAmount: number;
  averagePrice: number;
  sales: Sale[];
  notes?: string;
  isBlocked?: boolean;
  blockReason?: string;
  last2Quantities?: number[];
  last2Prices?: number[];
}

interface CustomerStatisticsProps {
  language?: string;
  customers: Customer[];
}

export const CustomerStatistics = ({
  language = "ar",
  customers,
}: CustomerStatisticsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const isRTL = language === "ar";
  const { sales, isLoading } = useSales();

  // --- Debug: Print all sales structure at runtime
  if (typeof window !== "undefined" && sales && sales.length) {
    // Show a sample sale and its keys for debugging
    // Won't re-execute on every render as long as sales reference is unchanged
    // @ts-ignore
    window.__LOV_DEBUG_SALES = sales;
    console.log("All fetched sales for statistics:", sales);
    if (sales[0]) {
      console.log("[Debug] Example sale keys:", Object.keys(sales[0]));
      console.log("[Debug] Example sale items (from .items):", sales[0].items);
      console.log("[Debug] Example sale sale_items (from .sale_items):", sales[0].sale_items);
    }
  }

  // احصائيات العميل فقط من جدول المبيعات وسلة الأصناف sale_items بشكل صارم
  const mappedCustomers = customers.map((customer) => {
    const customerSales = (sales || []).filter(
      (sale) => sale.customerId === customer.id
    );

    let totalQuantity = 0;
    let totalAmount = 0;
    let totalWeightedPrice = 0;
    let totalSaleCount = customerSales.length;

    let foundItems = false;

    customerSales.forEach((sale) => {
      // لنتأكد من بنية sale.sale_items فعليا ونطبعها للكونسول
      if (typeof window !== "undefined") {
        console.log(`[CUSTOMER_STATS] sale.id=${sale.id} sale_items:`, sale.sale_items);
      }

      // استخدم حصرا sale.sale_items فقط
      if (Array.isArray(sale.sale_items) && sale.sale_items.length > 0) {
        foundItems = true;
        sale.sale_items.forEach((item: any) => {
          const quantity = Number(item.quantity) || 0;
          const pricePerKg =
            typeof item.price_per_kg !== "undefined"
              ? Number(item.price_per_kg)
              : Number(item.price); // fallback
          const total =
            typeof item.total !== "undefined"
              ? Number(item.total)
              : quantity * pricePerKg;
          totalQuantity += quantity;
          totalWeightedPrice += pricePerKg * quantity;
          // نكتفي بحساب إجمالي الفاتورة لاحقًا
        });
      }
      // المبلغ الإجمالي يؤخذ دائما من sale.total
      totalAmount += Number(sale.total) || 0;
    });

    // متوسط السعر بناءً على الوزن/الكمية
    const averagePricePerKg =
      totalQuantity > 0 ? Math.round(totalWeightedPrice / totalQuantity) : 0;
    const averageInvoiceAmount =
      totalSaleCount > 0 ? Math.round(totalAmount / totalSaleCount) : 0;

    const lastSaleObj = customerSales.length
      ? [...customerSales].sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : undefined;
    const lastSale = lastSaleObj ? lastSaleObj.date : "";

    // جدول تفاصيل المبيعات في الديالوج (نعرض فقط أول صنف من كل فاتورة لمعاينة نوع الصنف)
    const uiSales = customerSales.map((sale) => {
      let items = [];
      if (Array.isArray(sale.sale_items) && sale.sale_items.length > 0) {
        items = sale.sale_items.map((item: any) => ({
          batteryType: item.battery_types?.name || "-",
          quantity: Number(item.quantity) || 0,
          price: Number(
            typeof item.price_per_kg !== "undefined"
              ? item.price_per_kg
              : item.price
          ) || 0,
          total:
            typeof item.total !== "undefined"
              ? Number(item.total)
              : (Number(item.quantity) || 0) *
                (Number(item.price_per_kg) || Number(item.price) || 0),
        }));
      }
      const firstItem = items[0] || {};
      return {
        id: sale.id,
        date: sale.date,
        batteryType: firstItem.batteryType || "",
        quantity: firstItem.quantity || 0,
        pricePerKg: firstItem.price || 0,
        total: sale.total,
        discount: sale.discount ?? 0,
        finalTotal: (Number(sale.total) || 0) - (Number(sale.discount) || 0),
      };
    });

    return {
      ...customer,
      sales: uiSales,
      totalSales: totalSaleCount,
      totalQuantity,
      totalAmount,
      averagePricePerKg,
      averageInvoiceAmount,
      lastSale,
      __foundItems: foundItems, // debug مفيد
    };
  });

  const filteredCustomers = mappedCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  const CustomerDetailsDialog = ({ customer }: { customer: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {language === "ar" ? "عرض التفاصيل" : "View Details"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar"
              ? `إحصائيات العميل: ${customer.name}`
              : `Customer Statistics: ${customer.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* عدد المبيعات */}
            <Card>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "عدد المبيعات" : "Total Sales"}
                    </p>
                    <p className="text-2xl font-bold">{customer.totalSales || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* إجمالي الكمية */}
            <Card>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "إجمالي الكمية" : "Total Quantity"}
                    </p>
                    <p className="text-2xl font-bold">{customer.totalQuantity?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* إجمالي المبلغ */}
            <Card>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "إجمالي المبلغ" : "Total Amount"}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {customer.totalAmount?.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* متوسط السعر */}
            <Card>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "متوسط السعر" : "Avg. Price/Kg"}
                    </p>
                    <p className="text-2xl font-bold">
                      {customer.averagePricePerKg?.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* متوسط مبلغ الفاتورة */}
            <Card>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "متوسط الفاتورة" : "Avg. Invoice"}
                    </p>
                    <p className="text-2xl font-bold">
                      {customer.averageInvoiceAmount?.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Sales History */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {language === "ar" ? "تاريخ المبيعات" : "Sales History"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "التاريخ" : "Date"}
                      </th>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "نوع البطارية" : "Battery Type"}
                      </th>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "الكمية" : "Quantity"}
                      </th>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "سعر الكيلو" : "Price/Kg"}
                      </th>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "الإجمالي" : "Total"}
                      </th>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "الخصم" : "Discount"}
                      </th>
                      <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {language === "ar" ? "المبلغ النهائي" : "Final Amount"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customer.sales || []).map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{sale.date}</td>
                        <td className="p-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>{sale.batteryType}</td>
                        <td className="p-3">{sale.quantity}</td>
                        <td className="p-3">{sale.pricePerKg}</td>
                        <td className="p-3">{sale.total?.toLocaleString?.() ?? sale.total}</td>
                        <td className="p-3">{sale.discount?.toLocaleString?.() ?? sale.discount}</td>
                        <td className="p-3 font-bold text-green-600">{sale.finalTotal?.toLocaleString?.() ?? sale.finalTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* حالة لا يوجد بيانات */}
          {!customer.__foundItems && (
            <div className="text-red-500 text-center mt-4 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar"
                ? "لا توجد بيانات صنف للمبيعات لهذا العميل. تحقق من جلب بيانات المبيعات والأصناف جيدًا."
                : "No sale item data found for this customer. Please check your sales data structure."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <BarChart3 className="w-5 h-5" />
            {language === "ar" ? "إحصائيات العملاء" : "Customer Statistics"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <Input
              placeholder={language === "ar" ? "ابحث عن عميل..." : "Search for customer..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {customer.name}
                        </h3>
                        <div className={`flex items-center gap-2 text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className={`flex items-center gap-4 text-sm text-gray-500 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {language === "ar" ? "عدد المبيعات:" : "Sales:"} {customer.totalSales || 0}
                          </span>
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {language === "ar" ? "إجمالي المبلغ:" : "Total Amount:"} {customer.totalAmount?.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CustomerDetailsDialog customer={customer} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
