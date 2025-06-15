import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, User } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupplierPreview } from "@/hooks/useSupplierPreview";

interface SupplierSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSupplierSelect: (supplier: { id: string; name: string; supplierCode: string; phone: string }) => void;
  searchTerm: string;
  language?: string;
  onAddSupplier: (initialName: string) => void; // دالة لفتح دايلاوج إضافة مورد مع تمرير الاسم المقترح
}

export const SupplierSearchDialog = ({
  open,
  onClose,
  onSupplierSelect,
  searchTerm,
  language = "ar",
  onAddSupplier,
}: SupplierSearchDialogProps) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // استخدام hook لجلب الموردين مع الفلتر
  const { suppliers, isLoading } = useSuppliers(1, 50, {
    searchTerm: localSearchTerm
  });

  const isRTL = language === "ar";

  const handleSupplierSelection = (supplier: any) => {
    onSupplierSelect({
      id: supplier.id,
      name: supplier.name,
      supplierCode: supplier.supplierCode,
      phone: supplier.phone || ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "البحث عن مورد" : "Search Supplier"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className={`absolute top-3 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={language === "ar" ? "ابحث بالاسم، رقم الجوال، أو رمز المورد..." : "Search by name, phone, or supplier code..."}
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              autoFocus
            />
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {language === "ar" ? "جاري البحث..." : "Searching..."}
              </p>
            </div>
          )}

          {!isLoading && localSearchTerm && suppliers.length === 0 && (
            <div className="text-center py-4 border rounded-lg bg-yellow-50">
              <p className="text-gray-600 mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {language === "ar" ? `المورد "${localSearchTerm}" غير موجود` : `Supplier "${localSearchTerm}" not found`}
              </p>
              <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {language === "ar" ? "هل تريد إضافته كمورد جديد؟" : "Would you like to add them as a new supplier?"}
              </p>
              <Button
                onClick={() => {
                  if (localSearchTerm && localSearchTerm.trim().length > 0) {
                    onAddSupplier(localSearchTerm);
                  } else {
                    onAddSupplier("");
                  }
                }}
                className="flex items-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <UserPlus className="w-4 h-4" />
                {language === "ar" ? "إضافة مورد جديد" : "Add New Supplier"}
              </Button>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-2">
            {!isLoading && suppliers.length > 0 ? (
              suppliers.map(supplier => {
                // استخدم hook لجلب التفاصيل لكل مورد
                // استخدام كـ component لاتاحة تشغيل hook للكل (الآمن هنا)
                return (
                  <SupplierPreviewRow
                    key={supplier.id}
                    supplier={supplier}
                    isRTL={isRTL}
                    language={language}
                    onSelect={handleSupplierSelection}
                  />
                );
              })
            ) : !isLoading && localSearchTerm === "" ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "ابدأ بالكتابة للبحث عن مورد" : "Start typing to search for suppliers"}
                </p>
              </div>
            ) : null}
          </div>

          {/* زر إضافة مورد جديد أسفل القائمة عند وجود نتائج بحث */}
          {!isLoading && suppliers.length > 0 && (
            <Button
              onClick={() => {
                if (localSearchTerm && localSearchTerm.trim().length > 0) {
                  onAddSupplier(localSearchTerm);
                } else {
                  onAddSupplier("");
                }
              }}
              variant="outline"
              className="w-full flex items-center gap-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <UserPlus className="w-4 h-4" />
              {language === "ar" ? "إضافة مورد جديد" : "Add New Supplier"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// مكون منفصل لكل مورد ليستدعي hook ويعرض المعلومات
function SupplierPreviewRow({ supplier, isRTL, language, onSelect }: any) {
  const { data, isLoading } = useSupplierPreview(supplier.id);

  return (
    <div
      onClick={() => onSelect(supplier)}
      className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
    >
      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <User className="w-5 h-5 text-blue-600 mt-1" />
        <div className="flex-1">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {supplier.name}
            </p>
            <Badge variant="secondary" className="text-xs">
              {supplier.supplierCode}
            </Badge>
            {supplier.isBlocked && (
              <Badge variant="destructive" className="text-xs">
                {language === "ar" ? "محظور" : "Blocked"}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600">{supplier.phone}</div>

          {/* بيانات الرصيد */}
          <div className="mt-1 text-xs text-gray-700">
            <strong>رصيد المورد:</strong>{" "}
            {isLoading ? "..." : (data?.balance ?? 0)}
          </div>

          {/* آخر مشتريين من صنفين */}
          <div className="mt-2">
            <div className="text-xs text-gray-500 font-bold mb-1">
              {language === "ar" ? "آخر مشتريين:" : "Last 2 Purchases:"}
            </div>
            {isLoading ? (
              <div className="text-xs text-gray-400">جاري التحميل...</div>
            ) : (data?.lastPurchases && data.lastPurchases.length > 0 ? (
              <div className="space-y-1">
                {data.lastPurchases.map((p, idx) => (
                  <div key={idx} className="flex gap-3 text-xs items-center">
                    <span>
                      <strong>{language === "ar" ? "الصنف:" : "Type:"}</strong> {p.batteryTypeName}
                    </span>
                    <span>
                      <strong>{language === "ar" ? "الكمية:" : "Qty:"}</strong> {p.quantity}
                    </span>
                    <span>
                      <strong>{language === "ar" ? "السعر:" : "Price:"}</strong> {p.price}
                    </span>
                    <span>
                      <strong>{language === "ar" ? "التاريخ:" : "Date:"}</strong> {p.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {language === "ar" ? "لا توجد بيانات مشتريات" : "No purchases found"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
