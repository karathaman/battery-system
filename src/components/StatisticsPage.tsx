import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Truck,
  FileText,
  Calendar,
  Filter,
  BarChart as BarChartIcon
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePurchases } from '@/hooks/usePurchases';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays } from 'date-fns';
import { DataFilterDialog } from "./DataFilterDialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react"; // لاستخدام ايقونة السهم مع الدروبداون

interface StatisticsPageProps {
  language: string;
  onTabChange?: (tab: string) => void;
}

export const StatisticsPage = ({ language, onTabChange }: StatisticsPageProps) => {
  const [date, setDate] = React.useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [salesThisMonth, setSalesThisMonth] = useState(0);
  const [purchasesThisMonth, setPurchasesThisMonth] = useState(0);
  const [showDataFilterDialog, setShowDataFilterDialog] = useState(false);

  const isRTL = language === "ar";

  const { customers } = useCustomers();
  const { sales } = useSales();
  const { suppliers } = useSuppliers();
  const { purchases } = usePurchases();

  useEffect(() => {
    if (customers) {
      setTotalCustomers(customers.length);
    }
    if (sales) {
      setTotalSales(sales.length);
    }
    if (suppliers) {
      setTotalSuppliers(suppliers.length);
    }
    if (purchases) {
      setTotalPurchases(purchases.length);
    }
  }, [customers, sales, suppliers, purchases]);

  useEffect(() => {
    const calculateMonthlyData = () => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (sales) {
        const monthlySales = sales.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
        });
        setSalesThisMonth(monthlySales.length);
      }

      if (purchases) {
        const monthlyPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          return purchaseDate >= currentMonthStart && purchaseDate <= currentMonthEnd;
        });
        setPurchasesThisMonth(monthlyPurchases.length);
      }
    };

    calculateMonthlyData();
  }, [sales, purchases]);

  const getTranslatedText = (key: string) => {
    const translations = {
      dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
      overview: { ar: "نظرة عامة على إحصائيات النظام", en: "System statistics overview" },
      manageCustomers: { ar: "إدارة العملاء", en: "Manage Customers" },
      manageSuppliers: { ar: "إدارة الموردين", en: "Manage Suppliers" },
      manageSales: { ar: "إدارة المبيعات", en: "Manage Sales" },
      managePurchases: { ar: "إدارة المشتريات", en: "Manage Purchases" },
      filterData: { ar: "تصفية البيانات", en: "Filter Data" },
      totalCustomers: { ar: "إجمالي العملاء", en: "Total Customers" },
      totalSales: { ar: "إجمالي المبيعات", en: "Total Sales" },
      totalSuppliers: { ar: "إجمالي الموردين", en: "Total Suppliers" },
      totalPurchases: { ar: "إجمالي المشتريات", en: "Total Purchases" },
      salesThisMonth: { ar: "مبيعات هذا الشهر", en: "Sales This Month" },
      purchasesThisMonth: { ar: "مشتريات هذا الشهر", en: "Purchases This Month" },
      registeredCustomers: { ar: "عدد العملاء المسجلين", en: "Number of registered customers" },
      salesInvoices: { ar: "عدد فواتير المبيعات", en: "Number of sales invoices" },
      registeredSuppliers: { ar: "عدد الموردين المسجلين", en: "Number of registered suppliers" },
      purchaseInvoices: { ar: "عدد فواتير المشتريات", en: "Number of purchase invoices" },
      monthlySalesInvoices: { ar: "عدد فواتير المبيعات هذا الشهر", en: "Number of sales invoices this month" },
      monthlyPurchaseInvoices: { ar: "عدد فواتير المشتريات هذا الشهر", en: "Number of purchase invoices this month" }
    };
    return translations[key as keyof typeof translations][language as keyof typeof translations.dashboard];
  };

  const handleNavigation = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // --- بيانات الرسوم البيانية ---
  // توزيع العملاء مقابل الموردين
  const clientVsSupplierPieData = [
    { name: language === "ar" ? "العملاء" : "Customers", value: totalCustomers },
    { name: language === "ar" ? "الموردين" : "Suppliers", value: totalSuppliers },
  ];
  const pieColors = ["#4e844d", "#fab005"];
  
  // بيانات المبيعات والمشتريات آخر 6 أشهر (تحليل شهري)
  const now = new Date();
  const monthlyData: { month: string; salesCount: number; purchasesCount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toLocaleString(language === "ar" ? "ar-EG" : "en-US", { month: "short" });
    // عد فواتير المبيعات والمشتريات بهذا الشهر
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const salesCount = (sales || []).filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    }).length;
    const purchasesCount = (purchases || []).filter(p => {
      const d = new Date(p.date);
      return d >= start && d <= end;
    }).length;
    monthlyData.push({ month, salesCount, purchasesCount });
  }

  // اقتباس تشجيعي
  const motivationalQuotes = [
    language === "ar"
      ? "النجاح ليس بالصدفة، بل هو نتيجة للعمل الجاد والتخطيط الذكي."
      : "Success is not by chance, but the result of hard work and smart planning.",
    language === "ar"
      ? "المساءلة والمراجعة سر نمو الأعمال المستدام."
      : "Review and accountability are the secret to sustainable business growth.",
    language === "ar"
      ? "راقب أرقامك لتصنع مستقبلك المالي."
      : "Track your numbers to build your financial future.",
  ];
  const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // highlight style for cards
  const highlightCard = (val: number, threshold: number) =>
    val > threshold
      ? "bg-green-100 border-green-300"
      : val === 0
      ? "bg-gray-100 border-gray-200"
      : "bg-yellow-50 border-yellow-200";

  
  // --- State للفلترة والفرز ---
  const [topType, setTopType] = useState<'customers'|'suppliers'>('customers');
  const [sortBy, setSortBy] = useState<string>("quantity");
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('desc');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // -- جلب وتصفية بيانات العملاء والموردين --
  const allCustomers = customers ?? [];
  const allSuppliers = suppliers ?? [];

  // Helper: ترتيب البيانات بناءً على نوع الفلترة
  const getSorted = (arr: any[], entity: 'customers'|'suppliers') => {
    let key = sortBy;
    let data = [...arr];
    
    // تحويل مفاتيح العرض المناسبة
    if (entity === 'customers') {
      if (key === "quantity") key = "totalSoldQuantity";
      if (key === "amount") key = "totalAmount";
      if (key === "balance") key = "balance";
      if (key === "lastOp") key = "lastSale";
    } else if (entity === 'suppliers') {
      if (key === "quantity") key = "totalPurchases";
      if (key === "amount") key = "totalAmount";
      if (key === "balance") key = "balance";
      if (key === "lastOp") key = "lastPurchase";
    }
    data.sort((a, b) => {
      if (key === "lastOp") {
        const aVal = a[key] ? new Date(a[key]).getTime() : 0;
        const bVal = b[key] ? new Date(b[key]).getTime() : 0;
        return sortDirection === "asc" ? aVal-bVal : bVal-aVal;
      } else {
        const aVal = (a[key] ?? 0);
        const bVal = (b[key] ?? 0);
        return sortDirection === "asc" ? aVal-bVal : bVal-aVal;
      }
    });
    return data.slice(0, 5);
  };

  const topCustomers = getSorted(allCustomers, "customers");
  const topSuppliers = getSorted(allSuppliers, "suppliers");

  // --- أنواع الفلاتر للعرض ---
  const sortOptions = [
    { key: "quantity", label: language === "ar" ? "الكميات" : "Quantity" },
    { key: "amount", label: language === "ar" ? "المبالغ" : "Amounts" },
    { key: "balance", label: language === "ar" ? "الرصيد" : "Balance" },
    { key: "lastOp", label: language === "ar" ? (topType==="customers" ? "آخر بيع" : "آخر شراء") : (topType==="customers" ? "Last Sale" : "Last Purchase") },
  ];

  // --- بيانات شارت المورد المختار ---
  let selectedSupplier = allSuppliers.find(s => s.id === selectedSupplierId);
  // بيانات الكميات آخر 6 أشهر للمورد
  let supplierChartData: { month: string, qty: number }[] = [];
  if (selectedSupplierId && purchases) {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const monthName = date.toLocaleString(language === "ar" ? "ar-EG" : "en-US", { month: "short" });
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const purchasesOfMonth = purchases.filter(p => p.supplier_id === selectedSupplierId && (new Date(p.date) >= start && new Date(p.date) <= end));
      const totalQty = purchasesOfMonth.reduce((acc, record) => {
        const items = record.items || record.purchase_items || [];
        const recordTotal = items.filter(it => true).reduce((sum, it) => sum + (it.quantity || 0), 0);
        return acc + recordTotal;
      }, 0);
      supplierChartData.push({ month: monthName, qty: totalQty });
    }
  }

  // --- الشيفرة الجديدة: تجميع البطاريات المباعة والمشتراة ---
  // 1- تجميع المنتجات للمبيعات
  const salesProductStats: Record<string, { name: string, quantity: number, total: number }> = {};
  (sales || []).forEach(sale => {
    const items = sale.sale_items || sale.items || [];
    items.forEach((item: any) => {
      // احصل على اسم المنتج من البطارية المرتبطة إذا توفرت
      const btName = (item.battery_types?.name || item.batteryType || item.battery_type || "-");
      if (!salesProductStats[btName]) {
        salesProductStats[btName] = { name: btName, quantity: 0, total: 0 };
      }
      salesProductStats[btName].quantity += Number(item.quantity) || 0;
      salesProductStats[btName].total += Number(item.total) || 0;
    });
  });
  // ترتيب بحسب الكمية المباعة
  const topSoldProducts = Object.values(salesProductStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 2- تجميع المنتجات للمشتريات
  const purchasesProductStats: Record<string, { name: string, quantity: number, total: number }> = {};
  (purchases || []).forEach(purchase => {
    const items = purchase.purchase_items || purchase.items || [];
    items.forEach((item: any) => {
      const btName = (item.battery_types?.name || item.batteryType || item.battery_type || "-");
      if (!purchasesProductStats[btName]) {
        purchasesProductStats[btName] = { name: btName, quantity: 0, total: 0 };
      }
      purchasesProductStats[btName].quantity += Number(item.quantity) || 0;
      purchasesProductStats[btName].total += Number(item.total) || 0;
    });
  });
  // ترتيب بحسب الكمية المشتراة
  const topPurchasedProducts = Object.values(purchasesProductStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Motivational Quote */}
      <div className="text-center mb-4">
        <blockquote className="italic text-lg text-blue-700 font-semibold bg-blue-50 rounded p-4 border border-blue-100 shadow-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          &quot;{quote}&quot;
        </blockquote>
      </div>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {getTranslatedText("dashboard")}
        </h1>
        <p className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {getTranslatedText("overview")}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <Button onClick={() => handleNavigation('customers')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Users className="w-4 h-4" />
          {getTranslatedText("manageCustomers")}
        </Button>
        <Button onClick={() => handleNavigation('suppliers')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Truck className="w-4 h-4" />
          {getTranslatedText("manageSuppliers")}
        </Button>
        <Button onClick={() => handleNavigation('sales')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <ShoppingCart className="w-4 h-4" />
          {getTranslatedText("manageSales")}
        </Button>
        <Button onClick={() => handleNavigation('purchases')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Package className="w-4 h-4" />
          {getTranslatedText("managePurchases")}
        </Button>
        
        <Button 
          onClick={() => setShowDataFilterDialog(true)}
          variant="destructive"
          className="flex items-center gap-2"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <Filter className="w-4 h-4" />
          {getTranslatedText("filterData")}
        </Button>
      </div>

      {/* لوحة رسوم بيانية سريعة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* مخطط دائري: العملاء والموردين */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 justify-center ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <PieChart className="w-5 h-5" />
              {language === "ar" ? "توزيع العملاء والموردين" : "Customers vs Suppliers"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={clientVsSupplierPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    innerRadius={40}
                    label
                  >
                    {clientVsSupplierPieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* مخطط عمودي: مبيعات/مشتريات آخر 6 شهور */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 justify-center ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <BarChartIcon className="w-5 h-5" />
              {language === "ar" ? "المبيعات والمشتريات (آخر 6 أشهر)" : "Sales vs Purchases (6 Months)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsBarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="salesCount" name={language === "ar" ? "المبيعات" : "Sales"} fill="#6f42c1" />
                  <Bar dataKey="purchasesCount" name={language === "ar" ? "المشتريات" : "Purchases"} fill="#fab005" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Cards (الكروت الملونة بقيم متغيرة) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className={highlightCard(totalCustomers, 20)}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Users className="w-4 h-4" />
              {getTranslatedText("totalCustomers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCustomers}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getTranslatedText("registeredCustomers")}</p>
          </CardContent>
        </Card>

        <Card className={highlightCard(totalSales, 50)}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <ShoppingCart className="w-4 h-4" />
              {getTranslatedText("totalSales")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSales}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getTranslatedText("salesInvoices")}</p>
          </CardContent>
        </Card>

        <Card className={highlightCard(totalSuppliers, 10)}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Truck className="w-4 h-4" />
              {getTranslatedText("totalSuppliers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSuppliers}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getTranslatedText("registeredSuppliers")}</p>
          </CardContent>
        </Card>

        <Card className={highlightCard(totalPurchases, 30)}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Package className="w-4 h-4" />
              {getTranslatedText("totalPurchases")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalPurchases}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getTranslatedText("purchaseInvoices")}</p>
          </CardContent>
        </Card>

        <Card className={highlightCard(salesThisMonth, 10)}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <TrendingUp className="w-4 h-4" />
              {getTranslatedText("salesThisMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{salesThisMonth}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getTranslatedText("monthlySalesInvoices")}</p>
          </CardContent>
        </Card>

        <Card className={highlightCard(purchasesThisMonth, 10)}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <FileText className="w-4 h-4" />
              {getTranslatedText("purchasesThisMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{purchasesThisMonth}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getTranslatedText("monthlyPurchaseInvoices")}</p>
          </CardContent>
        </Card>
      </div>
      {/* --- التوب 5 العملاء/الموردين --- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div className="flex gap-2">
            <Button variant={topType==='customers'?'default':'outline'} onClick={()=>setTopType('customers')}>
              {language === "ar" ? "أعلى العملاء" : "Top Customers"}
            </Button>
            <Button variant={topType==='suppliers'?'default':'outline'} onClick={()=>setTopType('suppliers')}>
              {language === "ar" ? "أعلى الموردين" : "Top Suppliers"}
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 border px-2 py-1 rounded bg-white shadow-sm text-sm">
                {sortOptions.find(opt=>opt.key===sortBy)?.label} <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sortOptions.map(opt => (
                  <DropdownMenuItem key={opt.key} onClick={()=>setSortBy(opt.key)}>
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" onClick={()=>setSortDirection(sortDirection==="asc"?"desc":"asc")}>
              {sortDirection==="asc" 
                ? (language==="ar" ? "تصاعدي" : "Ascending")
                : (language==="ar" ? "تنازلي" : "Descending")}
            </Button>
          </div>
        </div>
        {/* جدول توب 5 */}
        <div className="overflow-x-auto mb-4 rounded border border-gray-200 shadow bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                <TableHead>{sortBy==="quantity" ? (language==="ar"? (topType==="customers"?"الكميات المباعة":"الكميات الموردة") : (topType==="customers"?"Sold QTY":"Supplied QTY"))
                  : sortBy==="amount" ? (language==="ar"?"المبلغ":"Amount")
                  : sortBy==="balance" ? (language==="ar"?"الرصيد":"Balance")
                  : (language==="ar"?(topType==="customers"?"آخر بيع":"آخر شراء"):"Last Operation")
                }</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topType === "customers" ? topCustomers : topSuppliers).map((item, i) => (
                <TableRow key={item.id || i}>
                  <TableCell>{i+1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {sortBy==="quantity"? (topType==="customers"? item.totalSoldQuantity : item.totalPurchases)
                    : sortBy==="amount"? item.totalAmount
                    : sortBy==="balance"? item.balance
                    : (topType==="customers"? (item.lastSale? format(new Date(item.lastSale), "yyyy-MM-dd"):"-") : (item.lastPurchase? format(new Date(item.lastPurchase), "yyyy-MM-dd"):"-"))
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- تتبع كميات مورد بشارت --- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div className="text-lg font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "تتبع كميات مورد مختار" : "Supplier Quantity Trend"}
          </div>
          <div>
            <select
              className="border rounded px-2 py-1"
              value={selectedSupplierId || ""}
              onChange={e => setSelectedSupplierId(e.target.value || null)}
            >
              <option value="">{language === "ar" ? "اختر مورّد" : "Select Supplier"}</option>
              {allSuppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedSupplierId && (
          <div style={{ width: "100%", height: 240 }} className="bg-white border rounded p-2 mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsBarChart data={supplierChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" name={language === "ar" ? "الكمية" : "Quantity"} fill="#4e844d" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- جدول المنتجات الأكثر مبيعًا وشراء --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* المنتجات الأكثر مبيعًا */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "أفضل المنتجات مبيعًا" : "Top Sold Products"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-2">{language === "ar" ? "الصنف" : "Product"}</th>
                    <th className="p-2">{language === "ar" ? "الكمية المباعة" : "Sold Quantity"}</th>
                    <th className="p-2">{language === "ar" ? "إجمالي المبيعات" : "Total Sales"}</th>
                  </tr>
                </thead>
                <tbody>
                  {topSoldProducts.map((prod, i) => (
                    <tr key={prod.name + i} className="border-b">
                      <td className="p-2 font-medium">{prod.name}</td>
                      <td className="p-2">{prod.quantity.toLocaleString()}</td>
                      <td className="p-2">{prod.total.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}</td>
                    </tr>
                  ))}
                  {topSoldProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-2 text-center text-gray-400">
                        {language === "ar" ? "لا توجد بيانات مبيعات" : "No sales data available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* المنتجات الأكثر شراء */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "أفضل المنتجات شراءً" : "Top Purchased Products"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="p-2">{language === "ar" ? "الصنف" : "Product"}</th>
                    <th className="p-2">{language === "ar" ? "الكمية المشتراة" : "Purchased Quantity"}</th>
                    <th className="p-2">{language === "ar" ? "إجمالي المشتريات" : "Total Purchases"}</th>
                  </tr>
                </thead>
                <tbody>
                  {topPurchasedProducts.map((prod, i) => (
                    <tr key={prod.name + i} className="border-b">
                      <td className="p-2 font-medium">{prod.name}</td>
                      <td className="p-2">{prod.quantity.toLocaleString()}</td>
                      <td className="p-2">{prod.total.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}</td>
                    </tr>
                  ))}
                  {topPurchasedProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-2 text-center text-gray-400">
                        {language === "ar" ? "لا توجد بيانات مشتريات" : "No purchase data available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Data Filter Dialog */}
      <DataFilterDialog 
        open={showDataFilterDialog}
        onClose={() => setShowDataFilterDialog(false)}
      />
    </div>
  );
}
