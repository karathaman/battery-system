
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Truck, ShoppingCart, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCustomers } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalSuppliers: number;
  activeSuppliers: number;
  blockedSuppliers: number;
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  totalPurchases: number;
  totalSales: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
  dailyPurchases: number;
  dailyPurchaseAmount: number;
}

export const StatisticsPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    blockedSuppliers: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    blockedCustomers: 0,
    totalPurchases: 0,
    totalSales: 0,
    totalPurchaseAmount: 0,
    totalSalesAmount: 0,
    dailyPurchases: 0,
    dailyPurchaseAmount: 0
  });

  const { suppliers } = useSuppliers(1, 1000);
  const { customers } = useCustomers(1, 1000);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get purchase statistics
        const { data: purchases, error: purchaseError } = await supabase
          .from('purchases')
          .select('total, created_at');

        // Get sales statistics
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('total, created_at');

        // Get daily purchases for today
        const today = new Date().toISOString().split('T')[0];
        const { data: dailyPurchases, error: dailyError } = await supabase
          .from('daily_purchases')
          .select('final_total')
          .eq('date', today);

        if (purchaseError) console.error('Error fetching purchases:', purchaseError);
        if (salesError) console.error('Error fetching sales:', salesError);
        if (dailyError) console.error('Error fetching daily purchases:', dailyError);

        // Calculate statistics
        const totalPurchaseAmount = purchases?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
        const totalSalesAmount = sales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
        const dailyPurchaseAmount = dailyPurchases?.reduce((sum, dp) => sum + (dp.final_total || 0), 0) || 0;

        setStats({
          totalSuppliers: suppliers.length,
          activeSuppliers: suppliers.filter(s => !s.isBlocked).length,
          blockedSuppliers: suppliers.filter(s => s.isBlocked).length,
          totalCustomers: customers.length,
          activeCustomers: customers.filter(c => !c.isBlocked).length,
          blockedCustomers: customers.filter(c => c.isBlocked).length,
          totalPurchases: purchases?.length || 0,
          totalSales: sales?.length || 0,
          totalPurchaseAmount,
          totalSalesAmount,
          dailyPurchases: dailyPurchases?.length || 0,
          dailyPurchaseAmount
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    if (suppliers.length > 0 || customers.length > 0) {
      fetchStats();
    }
  }, [suppliers, customers]);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue" }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
    color?: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          لوحة الإحصائيات
        </h1>
        <Badge variant="outline" className="text-sm">
          آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الموردين"
          value={stats.totalSuppliers}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="إجمالي العملاء"
          value={stats.totalCustomers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="إجمالي المشتريات"
          value={stats.totalPurchases}
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="مشتريات اليوم"
          value={stats.dailyPurchases}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="قيمة المشتريات الإجمالية"
          value={`${stats.totalPurchaseAmount.toLocaleString()} ريال`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="قيمة المبيعات الإجمالية"
          value={`${stats.totalSalesAmount.toLocaleString()} ريال`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="قيمة مشتريات اليوم"
          value={`${stats.dailyPurchaseAmount.toLocaleString()} ريال`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="موردين نشطين"
          value={stats.activeSuppliers}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="موردين محظورين"
          value={stats.blockedSuppliers}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="عملاء نشطين"
          value={stats.activeCustomers}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="عملاء محظورين"
          value={stats.blockedCustomers}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            معلومات إضافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط قيمة المشتريات:</span>
              <span className="font-semibold">
                {stats.totalPurchases > 0 ? (stats.totalPurchaseAmount / stats.totalPurchases).toFixed(2) : '0'} ريال
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط قيمة المبيعات:</span>
              <span className="font-semibold">
                {stats.totalSales > 0 ? (stats.totalSalesAmount / stats.totalSales).toFixed(2) : '0'} ريال
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>نسبة الموردين النشطين:</span>
              <span className="font-semibold">
                {stats.totalSuppliers > 0 ? ((stats.activeSuppliers / stats.totalSuppliers) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>نسبة العملاء النشطين:</span>
              <span className="font-semibold">
                {stats.totalCustomers > 0 ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الأرباح المتوقعة:</span>
              <span className="font-semibold text-green-600">
                {(stats.totalSalesAmount - stats.totalPurchaseAmount).toLocaleString()} ريال
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
