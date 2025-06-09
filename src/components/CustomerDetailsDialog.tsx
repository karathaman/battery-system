import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import type { Customer } from "@/types";

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

interface CustomerDetailsDialogProps {
  customer: Customer;
  open: boolean;
  onClose: () => void;
}

export const CustomerDetailsDialog = ({ customer, open, onClose }: CustomerDetailsDialogProps) => {
  const getDaysSinceLastSale = (lastSale: string) => {
    const lastSaleDate = new Date(lastSale);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastSaleDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <User className="w-5 h-5" />
            تفاصيل العميل
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.phone}
                </span>
              </div>
              {customer.description && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {customer.description}
                  </span>
                </div>
              )}
              {customer.isBlocked && (
                <Badge variant="destructive" className="w-fit">
                  محظور
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Sales Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إحصائيات المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    عدد العمليات
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.totalSales}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    إجمالي المبيعات
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.totalAmount} ريال
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    متوسط السعر
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.averagePrice} ريال
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales History */}
        <Tabs defaultValue="sales" className="mt-4">
          <TabsList>
            <TabsTrigger value="sales" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              المبيعات
            </TabsTrigger>
            <TabsTrigger value="purchases" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              المشتريات
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  سجل المبيعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.sales.length > 0 ? (
                    customer.sales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {sale.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {sale.quantity} كيلو
                          </span>
                          <span className="text-sm font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {sale.finalTotal} ريال
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      لا توجد مبيعات
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  سجل المشتريات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.purchases.length > 0 ? (
                    customer.purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {purchase.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {purchase.quantity} كيلو
                          </span>
                          <span className="text-sm font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {purchase.finalTotal} ريال
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      لا توجد مشتريات
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
