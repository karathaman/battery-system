import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { routes } from "@/routes";
import { Icons } from "@/components/icons";
import { usePurchases } from "@/hooks/usePurchases";
import { format } from "date-fns";
import { recalculateAllBalancesAndQuantities } from "@/utils/recalculateUtils";
import { toast } from "@/components/ui/use-toast";

export default function IndexPage() {
  const {
    sales,
    isLoading: isLoadingSales,
    error: errorSales,
  } = useSales();
  const {
    customers,
    isLoading: isLoadingCustomers,
    error: errorCustomers,
  } = useCustomers();
  const {
    suppliers,
    isLoading: isLoadingSuppliers,
    error: errorSuppliers,
  } = useSuppliers();
    const {
    purchases,
    isLoading: isLoadingPurchases,
    error: errorPurchases,
  } = usePurchases();

  const [loadingRebuild, setLoadingRebuild] = useState(false);

  const handleRebuild = async () => {
    setLoadingRebuild(true);
    try {
      await recalculateAllBalancesAndQuantities();
      toast({
        title: "تم إعادة الاحتساب",
        description: "تم إعادة احتساب كل الأرصدة والكميات بنجاح.",
      });
    } catch (e) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة الاحتساب",
        variant: "destructive",
      });
    }
    setLoadingRebuild(false);
  };

  return (
    <div className="p-6">
      {/* زر خاص للإداريين فقط! يمكنك إضافة شرط للصلاحيات إذا أضفت صلاحيات مستقبلاً */}
      <button
        className="bg-blue-700 text-white rounded px-4 py-2 hover:bg-blue-800 mb-4 disabled:opacity-50"
        onClick={handleRebuild}
        disabled={loadingRebuild}
      >
        {loadingRebuild ? "جاري إعادة الحساب..." : "إعادة احتساب الأرصدة والكميات"}
      </button>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي المبيعات</CardTitle>
            <CardDescription>
              {isLoadingSales ? (
                <Skeleton className="w-[90px] h-4" />
              ) : errorSales ? (
                "فشل في التحميل"
              ) : (
                "نظرة عامة على المبيعات"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSales ? (
              <Skeleton className="w-[120px] h-8" />
            ) : errorSales ? (
              "خطأ"
            ) : (
              <div className="text-2xl font-bold">
                {sales?.reduce((acc, sale) => acc + sale.total, 0)}
                <span className="text-sm"> ر.س </span>
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              12% زيادة عن الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجمالي العملاء</CardTitle>
            <CardDescription>
              {isLoadingCustomers ? (
                <Skeleton className="w-[90px] h-4" />
              ) : errorCustomers ? (
                "فشل في التحميل"
              ) : (
                "نظرة عامة على العملاء"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <Skeleton className="w-[120px] h-8" />
            ) : errorCustomers ? (
              "خطأ"
            ) : (
              <div className="text-2xl font-bold">{customers?.length}</div>
            )}
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <ArrowDown className="w-4 h-4 mr-1" />
              5% انخفاض عن الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجمالي الموردين</CardTitle>
            <CardDescription>
              {isLoadingSuppliers ? (
                <Skeleton className="w-[90px] h-4" />
              ) : errorSuppliers ? (
                "فشل في التحميل"
              ) : (
                "نظرة عامة على الموردين"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSuppliers ? (
              <Skeleton className="w-[120px] h-8" />
            ) : errorSuppliers ? (
              "خطأ"
            ) : (
              <div className="text-2xl font-bold">{suppliers?.length}</div>
            )}
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              8% زيادة عن الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجمالي المصروفات</CardTitle>
            <CardDescription>
              {isLoadingPurchases ? (
                <Skeleton className="w-[90px] h-4" />
              ) : errorPurchases ? (
                "فشل في التحميل"
              ) : (
                "نظرة عامة على المصروفات"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPurchases ? (
              <Skeleton className="w-[120px] h-8" />
            ) : errorPurchases ? (
              "خطأ"
            ) : (
              <div className="text-2xl font-bold">
                {purchases?.reduce((acc, purchase) => acc + purchase.total, 0)}
                <span className="text-sm"> ر.س </span>
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <ArrowDown className="w-4 h-4 mr-1" />
              3% انخفاض عن الشهر الماضي
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تحليل المبيعات</CardTitle>
            <CardDescription>
              {isLoadingSales ? (
                <Skeleton className="w-[90px] h-4" />
              ) : errorSales ? (
                "فشل في التحميل"
              ) : (
                "نظرة عامة على أداء المبيعات"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingSales ? (
              <Skeleton className="w-full h-[200px]" />
            ) : errorSales ? (
              "خطأ في تحميل بيانات المبيعات."
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={sales?.map((sale) => ({
                    date: format(new Date(sale.date), "MMM dd"),
                    amount: sale.total,
                  }))}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث العملاء</CardTitle>
            <CardDescription>
              {isLoadingCustomers ? (
                <Skeleton className="w-[90px] h-4" />
              ) : errorCustomers ? (
                "فشل في التحميل"
              ) : (
                "آخر العملاء المسجلين"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <Skeleton className="w-full h-[150px]" />
            ) : errorCustomers ? (
              "خطأ في تحميل بيانات العملاء."
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">الكود</TableHead>
                    <TableHead>اسم العميل</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.slice(0, 5).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.customerCode}
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
