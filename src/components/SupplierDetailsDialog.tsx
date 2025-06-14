
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Calendar, Package, DollarSign, TrendingUp, ShoppingCart, Edit } from "lucide-react";
import { Supplier } from "@/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface SupplierDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onEditSupplier?: (supplier: Supplier) => void;
}

export const SupplierDetailsDialog = ({ open, onClose, supplier, onEditSupplier }: SupplierDetailsDialogProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  if (!supplier) return null;

  const getDaysSinceLastPurchase = (lastPurchase: string) => {
    const today = new Date();
    const purchaseDate = new Date(lastPurchase);
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditClick = () => {
    setEditingSupplier(supplier);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingSupplier && onEditSupplier) {
      onEditSupplier(editingSupplier);
      setShowEditDialog(false);
      toast({ title: "تم تحديث بيانات المورد بنجاح" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إحصائيات المورد - {supplier.name}
              </DialogTitle>
              <Button
                onClick={handleEditClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Edit className="w-4 h-4" />
                تعديل بيانات المورد
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Supplier Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <User className="w-5 h-5" />
                  معلومات المورد الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الاسم:</span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الجوال:</span>
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>آخر شراء:</span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {supplier.lastPurchase ? `${supplier.lastPurchase} (منذ ${getDaysSinceLastPurchase(supplier.lastPurchase)} يوم)` : "لا يوجد"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Badge variant={supplier.isBlocked ? "destructive" : "default"}>
                      {supplier.isBlocked ? "محظور" : "نشط"}
                    </Badge>
                  </div>
                </div>
                
                {supplier.description && (
                  <div className="mt-4">
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الوصف: </span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.description}</span>
                  </div>
                )}
                
                {supplier.notes && (
                  <div className="mt-4">
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>ملاحظات: </span>
                    <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.notes}</span>
                  </div>
                )}
                
                {supplier.isBlocked && supplier.blockReason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <span className="font-semibold text-red-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>سبب الحظر: </span>
                    <span className="text-red-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.blockReason}</span>
                  </div>
                )}
                
                {/* Last 2 Purchases Details */}
                {supplier.last2Quantities && supplier.last2Quantities.length >= 2 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>آخر عمليتي شراء:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-semibold text-green-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          الشراء الأخير
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الصنف:</span>
                            <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {supplier.last2BatteryTypes?.[0] || "غير محدد"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية:</span>
                            <span className="font-semibold">{supplier.last2Quantities[0]} كيلو</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر:</span>
                            <span className="font-semibold text-blue-600">{supplier.last2Prices![0]} ريال</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          الشراء السابق
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الصنف:</span>
                            <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {supplier.last2BatteryTypes?.[1] || "غير محدد"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية:</span>
                            <span className="font-semibold">{supplier.last2Quantities[1]} كيلو</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر:</span>
                            <span className="font-semibold text-blue-600">{supplier.last2Prices![1]} ريال</span>
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
                          <span className={`font-semibold ${supplier.last2Quantities[0] > supplier.last2Quantities[1] ? 'text-green-600' : 'text-red-600'}`}>
                            {supplier.last2Quantities[0] > supplier.last2Quantities[1] ? '↗' : '↘'} 
                            {Math.abs(supplier.last2Quantities[0] - supplier.last2Quantities[1])} كيلو
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>تغيير السعر: </span>
                          <span className={`font-semibold ${supplier.last2Prices![0] > supplier.last2Prices![1] ? 'text-green-600' : 'text-red-600'}`}>
                            {supplier.last2Prices![0] > supplier.last2Prices![1] ? '↗' : '↘'} 
                            {Math.abs(supplier.last2Prices![0] - supplier.last2Prices![1])} ريال
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
                    <p className="text-2xl font-bold text-blue-600">{supplier.totalPurchases}</p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الكمية</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{supplier.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">{supplier.averagePrice}</p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط السعر</p>
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
                {supplier.purchases.length > 0 ? (
                  <div className="space-y-3">
                    {supplier.purchases.map((purchase) => (
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

      {/* Edit Dialog */}
      {showEditDialog && editingSupplier && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "Tajawal, sans-serif" }}>
                تعديل بيانات المورد - {editingSupplier.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="اسم المورد"
                value={editingSupplier.name}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
              />
              <Input
                placeholder="رقم الهاتف"
                value={editingSupplier.phone}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
              />
              <Button onClick={handleSaveEdit} className="w-full">
                حفظ التعديلات
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
