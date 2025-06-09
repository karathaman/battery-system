import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";

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
  name: string;
  phone: string;
  lastPurchase: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  messageSent?: boolean;
  lastMessageSent?: string;
  notes?: string;
  isBlocked?: boolean;
  blockReason?: string;
  purchases: Purchase[];
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
  if (!customer) return null;

  const getDaysSinceLastPurchase = (lastPurchase: string) => {
    const today = new Date();
    const purchaseDate = new Date(lastPurchase);
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات العميل - {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <User className="w-5 h-5" />
                معلومات العميل الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الاسم:</span>
                  <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الجوال:</span>
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>آخر شراء:</span>
                  <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.lastPurchase} (منذ {getDaysSinceLastPurchase(customer.lastPurchase)} يوم)</span>
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Badge variant={customer.isBlocked ? "destructive" : "default"}>
                    {customer.isBlocked ? "محظور" : "نشط"}
                  </Badge>
                </div>
              </div>
              {customer.notes && (
                <div className="mt-4">
                  <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>ملاحظات: </span>
                  <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.notes}</span>
                </div>
              )}
              {customer.isBlocked && customer.blockReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <span className="font-semibold text-red-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>سبب الحظر: </span>
                  <span className="text-red-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.blockReason}</span>
                </div>
              )}
              
              {/* Last 2 Sales Details */}
              {customer.last2Quantities && customer.last2Quantities.length >= 2 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>آخر عمليتي بيع:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-semibold text-green-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        البيعة الأخيرة
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الصنف:</span>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {customer.last2BatteryTypes?.[0] || "غير محدد"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية:</span>
                          <span className="font-semibold">{customer.last2Quantities[0]} كيلو</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر:</span>
                          <span className="font-semibold text-blue-600">{customer.last2Prices![0]} ريال</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        البيعة السابقة
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الصنف:</span>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {customer.last2BatteryTypes?.[1] || "غير محدد"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية:</span>
                          <span className="font-semibold">{customer.last2Quantities[1]} كيلو</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر:</span>
                          <span className="font-semibold text-blue-600">{customer.last2Prices![1]} ريال</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comparison */}
                  <div className="mt-4 bg-yellow-50 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      مقارنة التغييرات
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>تغيير الكمية: </span>
                        <span className={`font-semibold ${customer.last2Quantities[0] > customer.last2Quantities[1] ? 'text-green-600' : 'text-red-600'}`}>
                          {customer.last2Quantities[0] > customer.last2Quantities[1] ? '↗' : '↘'} 
                          {Math.abs(customer.last2Quantities[0] - customer.last2Quantities[1])} كيلو
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>تغيير السعر: </span>
                        <span className={`font-semibold ${customer.last2Prices![0] > customer.last2Prices![1] ? 'text-green-600' : 'text-red-600'}`}>
                          {customer.last2Prices![0] > customer.last2Prices![1] ? '↗' : '↘'} 
                          {Math.abs(customer.last2Prices![0] - customer.last2Prices![1])} ريال
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <TrendingUp className="w-5 h-5" />
                إحصائيات المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{customer.totalPurchases}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الكمية</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{customer.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ (ريال)</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{customer.averagePrice}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط السعر (ريال)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <ShoppingCart className="w-5 h-5" />
                تاريخ المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.purchases.length > 0 ? (
                <div className="space-y-3">
                  {customer.purchases.map((purchase) => (
                    <div key={purchase.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ: </span>
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{purchase.date}</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>النوع: </span>
                          <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{purchase.batteryType}</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية: </span>
                          <span>{purchase.quantity} كيلو</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر: </span>
                          <span>{purchase.pricePerKg} ريال/كيلو</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي: </span>
                          <span>{purchase.total} ريال</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم: </span>
                          <span>{purchase.discount} ريال</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع النهائي: </span>
                          <span className="font-bold text-green-600">{purchase.finalTotal} ريال</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
