
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, User } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";

interface SupplierSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSupplierSelect: (supplier: { id: string; name: string; supplierCode: string; phone: string, balance?: number }) => void;
  searchTerm: string;
  language?: string;
  onAddSupplier?: (initialName: string) => void;
}

export const SupplierSearchDialog = ({
  open,
  onClose,
  onSupplierSelect,
  searchTerm,
  language = "ar",
  onAddSupplier
}: SupplierSearchDialogProps) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Use the real suppliers hook with search filter
  const { suppliers, isLoading } = useSuppliers(1, 50, {
    searchTerm: localSearchTerm
  });

  const isRTL = language === "ar";

  const handleSupplierSelection = (supplier: any) => {
    onSupplierSelect({
      id: supplier.id,
      name: supplier.name,
      supplierCode: supplier.supplierCode,
      phone: supplier.phone || '',
      balance: supplier.balance
    });
    onClose();
  };

  const handleAddSupplier = () => {
    if (onAddSupplier) {
      onAddSupplier(localSearchTerm);
    }
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
                onClick={handleAddSupplier}
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
              suppliers.map(supplier => (
                <div
                  key={supplier.id}
                  onClick={() => handleSupplierSelection(supplier)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <User className="w-5 h-5 text-blue-600" />
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
                      <p className="text-sm text-gray-600">
                        {supplier.phone}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          {language === "ar" ? "المشتريات:" : "Purchases:"} {supplier.totalPurchases}
                        </span>
                        <span>
                          {language === "ar" ? "الإجمالي:" : "Total:"} {supplier.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                      {supplier.lastPurchase && (
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {language === "ar" ? "آخر توريد:" : "Last purchase:"} {supplier.lastPurchase}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : !isLoading && localSearchTerm === "" ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "ابدأ بالكتابة للبحث عن مورد" : "Start typing to search for suppliers"}
                </p>
              </div>
            ) : null}
          </div>

          {suppliers.length > 0 && (
            <Button
              onClick={handleAddSupplier}
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
