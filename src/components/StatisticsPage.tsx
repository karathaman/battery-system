
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Package, Users, Calendar, Battery, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface StatisticsPageProps {
  language?: string;
}

// Mock data for demonstration
const dailyData = [
  { date: "2024-01-01", amount: 1200, purchases: 5 },
  { date: "2024-01-02", amount: 1800, purchases: 7 },
  { date: "2024-01-03", amount: 900, purchases: 3 },
  { date: "2024-01-04", amount: 2100, purchases: 8 },
  { date: "2024-01-05", amount: 1500, purchases: 6 },
  { date: "2024-01-06", amount: 2400, purchases: 9 },
  { date: "2024-01-07", amount: 1700, purchases: 5 },
];

const batteryTypeData = [
  { name: "بطاريات عادية", value: 45, color: "#8884d8" },
  { name: "بطاريات جافة", value: 25, color: "#82ca9d" },
  { name: "بطاريات زجاج", value: 15, color: "#ffc658" },
  { name: "بطاريات تعبئة", value: 10, color: "#ff7300" },
  { name: "رصاص", value: 5, color: "#8dd1e1" }
];

const monthlyData = [
  { month: "يناير", revenue: 45000, customers: 120 },
  { month: "فبراير", revenue: 38000, customers: 98 },
  { month: "مارس", revenue: 52000, customers: 145 },
  { month: "أبريل", revenue: 41000, customers: 110 },
  { month: "مايو", revenue: 48000, customers: 132 },
  { month: "يونيو", revenue: 55000, customers: 156 },
];

export const StatisticsPage = ({ language = "ar" }: StatisticsPageProps) => {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const isRTL = language === "ar";

  const clearAllData = () => {
    // Here you would clear all data from the database
    toast({
      title: language === "ar" ? "تم مسح البيانات" : "Data Cleared",
      description: language === "ar" ? "تم مسح جميع البيانات بنجاح" : "All data has been cleared successfully",
    });
    setShowClearDialog(false);
  };

  const summaryCards = [
    {
      title: language === "ar" ? "إجمالي الإيرادات" : "Total Revenue",
      value: "279,000",
      unit: language === "ar" ? "ريال" : "SAR",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: language === "ar" ? "عدد المشتريات" : "Total Purchases",
      value: "843",
      unit: language === "ar" ? "مشترى" : "purchases",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: language === "ar" ? "عدد العملاء" : "Total Customers",
      value: "156",
      unit: language === "ar" ? "عميل" : "customers",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: language === "ar" ? "متوسط الشراء" : "Average Purchase",
      value: "331",
      unit: language === "ar" ? "ريال" : "SAR",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Clear Data Button */}
      <div className="flex justify-end">
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Trash2 className="w-4 h-4" />
              {language === "ar" ? "تصفية البيانات" : "Clear Data"}
            </Button>
          </DialogTrigger>
          <DialogContent dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {language === "ar" ? "تأكيد مسح البيانات" : "Confirm Data Clearing"}
              </DialogTitle>
            </DialogHeader>
            <p style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" 
                ? "هل أنت متأكد من رغبتك في مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه." 
                : "Are you sure you want to clear all data? This action cannot be undone."}
            </p>
            <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
              <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button variant="destructive" onClick={clearAllData}>
                {language === "ar" ? "مسح البيانات" : "Clear Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {card.unit}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <TrendingUp className="w-5 h-5" />
              {language === "ar" ? "الإيرادات اليومية" : "Daily Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Battery Types Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Battery className="w-5 h-5" />
              {language === "ar" ? "توزيع أنواع البطاريات" : "Battery Types Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batteryTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {batteryTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Calendar className="w-5 h-5" />
              {language === "ar" ? "اتجاه الإيرادات الشهرية" : "Monthly Revenue Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Users className="w-5 h-5" />
              {language === "ar" ? "نمو العملاء" : "Customer Growth"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="customers" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "أفضل العملاء" : "Top Customers"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "اسم العميل" : "Customer Name"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "عدد المشتريات" : "Total Purchases"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "إجمالي المبلغ" : "Total Amount"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "آخر شراء" : "Last Purchase"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "أحمد محمد", purchases: 25, amount: 8500, lastPurchase: "2024-01-15" },
                  { name: "فاطمة علي", purchases: 18, amount: 6200, lastPurchase: "2024-01-14" },
                  { name: "خالد أحمد", purchases: 15, amount: 5800, lastPurchase: "2024-01-13" },
                  { name: "مريم سالم", purchases: 12, amount: 4300, lastPurchase: "2024-01-12" },
                  { name: "عبدالله حسن", purchases: 10, amount: 3900, lastPurchase: "2024-01-11" }
                ].map((customer, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.name}</td>
                    <td className="p-3">{customer.purchases}</td>
                    <td className="p-3 font-semibold text-green-600">
                      {customer.amount.toLocaleString()}{" "}
                      {language === "ar" ? (
                        <img src="/assets/icons/SaudiRG.svg" alt="SAR" className="inline w-5 h-5 mb-1" />
                      ) : (
                        "SAR"
                      )}
                    </td><td className="p-3">{customer.lastPurchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
