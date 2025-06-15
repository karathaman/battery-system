
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle, User, FileText, Edit, X, Ban, CheckCircle, Edit3 } from "lucide-react";
import { useSupplierLastPurchases } from "@/hooks/useSupplierLastPurchases";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

interface SupplierCardProps {
  supplier: any;
  resetBalance: (supplierId: string) => void;
  getDaysSinceLastPurchase: (lastPurchase?: string) => number;
  getDaysSinceLastMessage: (lastMessage?: string) => number;
  sendWhatsAppMessage: (supplier: any) => void;
  handleEditSupplier: (supplier: any) => void;
  handleDeleteSupplier: (supplierId: string) => void;
  handleBlockSupplier: (supplierId: string) => void;
  handleUnblockSupplier: (supplierId: string) => void;
  saveNotes: (supplierId: string) => void;
  editingSupplier: string | null;
  setEditingSupplier: (value: string | null) => void;
  supplierNotes: string;
  setSupplierNotes: (value: string) => void;
  generateSupplierStatement: (supplierId: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  resetBalance,
  getDaysSinceLastPurchase,
  getDaysSinceLastMessage,
  sendWhatsAppMessage,
  handleEditSupplier,
  handleDeleteSupplier,
  handleBlockSupplier,
  handleUnblockSupplier,
  saveNotes,
  editingSupplier,
  setEditingSupplier,
  supplierNotes,
  setSupplierNotes,
  generateSupplierStatement,
}) => {
  const { data: lastPurchases, isLoading: isLastPurchasesLoading } = useSupplierLastPurchases(supplier.id);

  return (
    <Card
      className={`shadow-md hover:shadow-lg transition-shadow ${supplier.isBlocked ? "border-red-200 bg-red-50" : supplier.description?.includes("عميل مميز") ? "border-green-200 bg-green-50 " : ""
        }`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2 flex-row-reverse">
            <div className="flex-1">
              <h3
                className="text-sm sm:text-base font-semibold truncate"
                style={{ fontFamily: "Tajawal, sans-serif" }}
              >
                {supplier.name} - <Badge variant="secondary" className="text-xs">{supplier.supplierCode}</Badge>
              </h3>

              <div className="flex items-center gap-2 mt-1 flex-row-reverse flex-wrap">
                {supplier.isBlocked && (
                  <Badge variant="destructive" className="text-xs">
                    محظور
                  </Badge>
                )}

                {getDaysSinceLastPurchase(supplier.lastPurchase) > 30 && (
                  <Badge variant="destructive" className="text-xs">
                    متأخر
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {/* Supplier Notes */}
            {supplier.notes && (
              <div className="flex items-start gap-2 bg-yellow-50 rounded p-2">
                <MessageCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span className="text-xs font-semibold text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {supplier.notes}
                </span>
              </div>
            )}

            {/* Supplier Phone & Description */}
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-semibold text-gray-600" style={{ fontFamily: "Tajawal, sans-serif" }}>
                {supplier.phone}
              </span>
            </div>
            {/* Last Purchase */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: "Tajawal, sans-serif" }}>
                آخر توريد: {supplier.lastPurchase || "لا يوجد"}
                {supplier.lastPurchase && (
                  <span className={`ml-1 ${getDaysSinceLastPurchase(supplier.lastPurchase) > 30 ? 'text-red-600' : 'text-green-600'}`}>
                    &nbsp; &nbsp; ← &nbsp; {getDaysSinceLastPurchase(supplier.lastPurchase)} يوم
                  </span>
                )}
              </span>
            </div>

            {/* Last Message */}
            <div className="flex items-center gap-2">
              <MessageCircle className="w-3 h-3 text-green-400" />
              <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                آخر رسالة: {supplier.lastMessageSent ? new Date(supplier.lastMessageSent).toLocaleDateString("en-CA") : "لم ترسل"}
                {supplier.lastMessageSent && (
                  <span className="ml-1 text-blue-600 ">
                    &nbsp; ← &nbsp; {getDaysSinceLastMessage(supplier.lastMessageSent)} يوم
                  </span>
                )}
              </span>
            </div>

            {/* Balance */}
            <div className="flex items-center gap-2">
              <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-3 h-3" />
              <span
                className={`text-xs font-semibold ${supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                الرصيد: {supplier.balance.toLocaleString()} ريال
              </span>
              <Button
                onClick={() => resetBalance(supplier.id)}
                variant="outline"
                size="sm"
                className="ml-2 px-2 py-1 text-xs border-red-300 text-red-600 hover:text-white hover:bg-red-600 transition-all"
                style={{ fontFamily: 'Tajawal, sans-serif', height: '20px', lineHeight: '20px' }}
              >
                تصفير الرصيد
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2 border-gray-300 border">
              <p className="text-xs text-gray-500  " style={{ fontFamily: 'Tajawal, sans-serif' }}>الكميات</p>
              <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.totalPurchases}</p>
            </div>
            <div className="bg-gray-50 rounded p-2 border-gray-300 border">
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</p>
              <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => generateSupplierStatement(supplier.id)}
              variant="default"
              size="sm"
              className="w-full flex items-center gap-2 flex-row-reverse text-xs"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <FileText className="w-3 h-3" />
              عرض التفاصيل وكشف الحساب
            </Button>

            <div className="grid grid-cols-3 gap-1">
              <Button
                onClick={() => sendWhatsAppMessage(supplier)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 flex-row-reverse text-xs bg-green-50 hover:bg-green-100"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <MessageCircle className="w-3 h-3" />
                واتساب
              </Button>

              <Button
                onClick={() => handleEditSupplier(supplier)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 flex-row-reverse text-xs"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Edit className="w-3 h-3" />
                تعديل
              </Button>

              <Button
                onClick={() => handleDeleteSupplier(supplier.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 flex-row-reverse text-xs text-red-600"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <X className="w-3 h-3" />
                حذف
              </Button>
            </div>

            {/* Block/Unblock Button */}
            <div className="w-full">
              {supplier.isBlocked ? (
                <Button
                  onClick={() => handleUnblockSupplier(supplier.id)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-1 flex-row-reverse text-xs text-green-600"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <CheckCircle className="w-3 h-3" />
                  إلغاء الحظر
                </Button>
              ) : (
                <Button
                  onClick={() => handleBlockSupplier(supplier.id)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-1 flex-row-reverse text-xs text-white bg-red-600"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Ban className="w-3 h-3" />
                  حظر المورد
                </Button>
              )}
            </div>

            {/* Notes Section */}
            <div className="mt-2">
              {editingSupplier === supplier.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    placeholder="أضف ملاحظات..."
                    className="text-xs"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    rows={2}
                  />
                  <div className="flex gap-1">
                    <Button
                      onClick={() => saveNotes(supplier.id)}
                      size="sm"
                      className="flex-1 text-xs"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      حفظ
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingSupplier(null);
                        setSupplierNotes("");
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    onClick={() => {
                      setEditingSupplier(supplier.id);
                      setSupplierNotes(supplier.notes || "");
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs flex items-center gap-1"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <Edit3 className="w-3 h-3" />
                    {supplier.notes ? "تعديل الملاحظات" : "إضافة ملاحظات"}
                  </Button>
                </div>
              )}
            </div>

            {/* Add last 2 purchases section below last purchase and above stats grid */}
            <div className="mt-2">
              <div className="bg-green-50 rounded-lg p-2 mb-2">
                <div className="font-semibold text-xs text-green-800 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  آخر عمليتي شراء لصنفين مختلفين
                </div>
                {isLastPurchasesLoading ? (
                  <div className="text-xs text-gray-500">جاري التحميل ...</div>
                ) : (lastPurchases && lastPurchases.length > 0 ? (
                  lastPurchases.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-700 my-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <span>{item.batteryTypeName}</span>
                      <span>السعر: {item.price}</span>
                      <span>المبلغ: {item.total}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400">لا توجد بيانات توريد متاحة</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
