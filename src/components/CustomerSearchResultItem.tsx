
import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, Plus } from "lucide-react";
import { useCustomerLastSalesPreview } from "@/hooks/useCustomerLastSalesPreview";
import { Customer } from "@/types";

interface CustomerSearchResultItemProps {
  customer: Customer;
  isRTL: boolean;
  language: string;
  onSelect: (c: Customer) => void;
}

export const CustomerSearchResultItem = ({
  customer,
  isRTL,
  language,
  onSelect,
}: CustomerSearchResultItemProps) => {
  const { data: sales, isLoading: isSalesLoading } = useCustomerLastSalesPreview(customer.id);

  return (
    <div
      onClick={() => onSelect(customer)}
      className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
    >
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <User className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {customer.name}
            </p>
            <Badge variant="secondary" className="text-xs">
              {customer.customerCode}
            </Badge>
            {customer.isBlocked && (
              <Badge variant="destructive" className="text-xs">
                {language === "ar" ? "محظور" : "Blocked"}
              </Badge>
            )}
          </div>
          <div className="flex gap-4 mt-1 text-xs text-gray-500 mb-1">
            <span>
              {language === "ar" ? "المبيعات:" : "Sales:"} {customer.totalSoldQuantity}
            </span>
            <span>
              {language === "ar" ? "الإجمالي:" : "Total:"} {customer.totalAmount.toLocaleString()}
            </span>
            <span>
              {language === "ar" ? "الرصيد:" : "Balance:"}{" "}
              <span className={Number(customer.balance) >= 0 ? "text-green-600" : "text-red-600"}>
                {customer.balance !== undefined && customer.balance !== null
                  ? Number(customer.balance).toLocaleString()
                  : "—"}
              </span>
            </span>
          </div>
          {/* جدول آخر بيع لصنفين مختلفين */}
          <div className="mt-1">
            <div className="font-semibold text-xs text-blue-800 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "آخر بيع لصنفين" : "Last two distinct sales"}
            </div>
            {isSalesLoading ? (
              <div className="text-xs text-gray-400">{language === "ar" ? "جاري التحميل..." : "Loading..."}</div>
            ) : (sales && sales.length > 0 ? (
              <div className="rounded bg-gray-100 py-1 px-2">
                <div className="grid grid-cols-5 gap-1 font-bold text-xs mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <div>الصنف</div>
                  <div>الكمية</div>
                  <div>السعر</div>
                  <div>المبلغ</div>
                  <div>التاريخ</div>
                </div>
                {sales.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-1 text-xs border-b last:border-b-0 py-0.5">
                    <div>{row.batteryTypeName || '—'}</div>
                    <div>{row.quantity ?? "—"}</div>
                    <div>{row.price != null ? Number(row.price).toLocaleString() : "—"}</div>
                    <div>{row.total != null ? Number(row.total).toLocaleString() : "—"}</div>
                    <div>{row.date ? new Date(row.date).toLocaleDateString('ar-SA') : "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">{language === "ar" ? "لا توجد بيانات بيع متاحة" : "No sales data available"}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

