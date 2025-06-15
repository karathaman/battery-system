
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle, User, DollarSign, FileText, Edit, X, Ban, CheckCircle } from "lucide-react";
import { useCustomerLastSales } from "@/hooks/useCustomerLastSales";
import { Customer } from "@/types";
import { useState } from "react";

interface Props {
  customer: Customer;
  onShowDetails: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onResetBalance: (customerId: string, name: string) => void;
  onBlockCustomer: (customerId: string) => void;
  onUnblockCustomer: (customerId: string) => void;
  getDaysSinceLastPurchase: (date: string) => number;
}

export function CustomerCard({
  customer,
  onShowDetails,
  onEditCustomer,
  onDeleteCustomer,
  onResetBalance,
  onBlockCustomer,
  onUnblockCustomer,
  getDaysSinceLastPurchase,
}: Props) {
  const { data: lastSales, isLoading: isLastSalesLoading } = useCustomerLastSales(customer.id);

  return (
    <Card
      className={`shadow-md hover:shadow-lg transition-shadow ${customer.isBlocked ? 'border-red-200 bg-red-50' : customer.description?.includes("عميل مميز") ? 'border-green-200 bg-green-50 ' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2 flex-row-reverse">
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {customer.name} - <Badge variant="secondary" className="text-xs">{customer.customerCode}</Badge>
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-row-reverse flex-wrap">
                {customer.isBlocked && (
                  <Badge variant="destructive" className="text-xs">محظور</Badge>
                )}
                {customer.lastSale && getDaysSinceLastPurchase(customer.lastSale) > 30 && (
                  <Badge variant="destructive" className="text-xs">متأخر</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {/* Customer Notes */}
            {customer.notes && (
              <div className="flex items-start gap-2 bg-yellow-50 rounded p-2">
                <MessageCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span className="text-xs font-semibold text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.notes}
                </span>
              </div>
            )}

            {/* Customer Phone & Description */}
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {customer.phone}
              </span>
            </div>

            {/* Last Sale */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                آخر بيع: {customer.lastSale || "لا يوجد"}
                {customer.lastSale && (
                  <span className={`ml-1 ${getDaysSinceLastPurchase(customer.lastSale) > 30 ? 'text-red-600' : 'text-green-600'}`}>
                    &nbsp; &nbsp; ← &nbsp; {getDaysSinceLastPurchase(customer.lastSale)} يوم
                  </span>
                )}
              </span>
            </div>

            {/* Balance */}
            <div className="flex items-center gap-2">
              <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-3 h-3" />
              <span
                className={`text-xs font-semibold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                الرصيد: {customer.balance.toLocaleString()} ريال
              </span>
              <Button
                onClick={() => onResetBalance(customer.id, customer.name)}
                variant="outline"
                size="sm"
                className="ml-2 px-2 py-1 text-xs border-red-300 text-red-600 hover:text-white hover:bg-red-600 transition-all"
                style={{ fontFamily: 'Tajawal, sans-serif', height: '20px', lineHeight: '20px' }}
              >
                تصفير الرصيد
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <div className="bg-blue-50 rounded-lg p-2 mb-2">
              <div className="font-semibold text-xs text-blue-800 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                آخر عمليتي بيع لصنفين مختلفين
              </div>
              {isLastSalesLoading ? (
                <div className="text-xs text-gray-500">جاري التحميل ...</div>
              ) : (lastSales && lastSales.length > 0 ? (
                <>
                  <div className="flex justify-between text-gray-800 font-bold text-xs mb-1 px-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <span>الصنف</span>
                    <span>الكمية</span>
                    <span>السعر</span>
                    <span>المبلغ</span>
                  </div>
                  {lastSales.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-700 my-1 px-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <span>{item.batteryTypeName}</span>
                      <span>{item.quantity}</span>
                      <span>{item.price}</span>
                      <span>{item.total}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-xs text-gray-400">لا توجد بيانات مبيعات متاحة</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2 border-gray-300 border">
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>مجموع الكميات المباعة</p>
              <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.totalSoldQuantity}</p>
            </div>
            <div className="bg-gray-50 rounded p-2 border-gray-300 border">
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</p>
              <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => onShowDetails(customer)}
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
                onClick={() => onEditCustomer(customer)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 flex-row-reverse text-xs"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Edit className="w-3 h-3" />
                تعديل
              </Button>
              <Button
                onClick={() => onDeleteCustomer(customer.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 flex-row-reverse text-xs text-red-600"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <X className="w-3 h-3" />
                حذف
              </Button>
            </div>
            <div className="w-full">
              {customer.isBlocked ? (
                <Button
                  onClick={() => onUnblockCustomer(customer.id)}
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
                  onClick={() => onBlockCustomer(customer.id)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-1 flex-row-reverse text-xs text-white bg-red-600"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Ban className="w-3 h-3" />
                  حظر العميل
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
