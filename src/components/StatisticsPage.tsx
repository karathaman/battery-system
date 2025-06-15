
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
  Filter
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

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
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

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

      {/* Add Data Filter Dialog */}
      <DataFilterDialog 
        open={showDataFilterDialog}
        onClose={() => setShowDataFilterDialog(false)}
      />
    </div>
  );
};
