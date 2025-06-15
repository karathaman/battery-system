import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const StatisticsPage = () => {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          لوحة التحكم
        </h1>
        <p className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          نظرة عامة على إحصائيات النظام
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <Button onClick={() => navigate('/customers')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Users className="w-4 h-4" />
          إدارة العملاء
        </Button>
        <Button onClick={() => navigate('/suppliers')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Truck className="w-4 h-4" />
          إدارة الموردين
        </Button>
        <Button onClick={() => navigate('/sales')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <ShoppingCart className="w-4 h-4" />
          إدارة المبيعات
        </Button>
        <Button onClick={() => navigate('/purchases')} className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Package className="w-4 h-4" />
          إدارة المشتريات
        </Button>
        
        <Button 
          onClick={() => setShowDataFilterDialog(true)}
          variant="destructive"
          className="flex items-center gap-2"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <Filter className="w-4 h-4" />
          تصفية البيانات
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Users className="w-4 h-4" />
              إجمالي العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCustomers}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>عدد العملاء المسجلين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <ShoppingCart className="w-4 h-4" />
              إجمالي المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSales}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>عدد فواتير المبيعات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Truck className="w-4 h-4" />
              إجمالي الموردين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSuppliers}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>عدد الموردين المسجلين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Package className="w-4 h-4" />
              إجمالي المشتريات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalPurchases}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>عدد فواتير المشتريات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <TrendingUp className="w-4 h-4" />
              مبيعات هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{salesThisMonth}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>عدد فواتير المبيعات هذا الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <FileText className="w-4 h-4" />
              مشتريات هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{purchasesThisMonth}</div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>عدد فواتير المشتريات هذا الشهر</p>
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
