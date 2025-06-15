import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User } from "lucide-react";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer } from "@/types";
import { useCustomerLastSalesPreview } from "@/hooks/useCustomerLastSalesPreview";

interface CustomerSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  searchTerm?: string;
  language?: string;
}

export const CustomerSearchDialog = ({ 
  open, 
  onClose, 
  onSelectCustomer,
  searchTerm = "",
  language = "ar" 
}: CustomerSearchDialogProps) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const isRTL = language === "ar";
  const { customers, isLoading } = useCustomers(1, 50, { searchTerm: internalSearchTerm });

  // Cache the result of last sales per customer (avoid repeated requests)
  const lastSalesPerCustomer = Object.fromEntries(
    customers.map(c => {
      const { data, isLoading: loading } = useCustomerLastSalesPreview(c.id);
      return [c.id, { data, isLoading: loading }];
    })
  );

  const handleSearch = (term: string) => {
    setInternalSearchTerm(term);
  };

  const handleAddNewCustomer = () => {
    setShowAddCustomer(true);
  };

  const handleCustomerAdded = (customer: Customer) => {
    onSelectCustomer(customer);
    setShowAddCustomer(false);
    onClose();
  };

  const handleCustomerSelection = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "البحث عن عميل" : "Search Customer"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className={`absolute top-3 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={language === "ar" ? "ابحث بالاسم، رقم الجوال، أو رمز العميل..." : "Search by name, phone, or customer code..."}
                value={internalSearchTerm}
                onChange={(e) => handleSearch(e.target.value)}
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

            {!isLoading && internalSearchTerm && customers.length === 0 && (
              <div className="text-center py-4 border rounded-lg bg-yellow-50">
                <p className="text-gray-600 mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? `العميل "${internalSearchTerm}" غير موجود` : `Customer "${internalSearchTerm}" not found`}
                </p>
                <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "هل تريد إضافته كعميل جديد؟" : "Would you like to add them as a new customer?"}
                </p>
                <Button
                  onClick={handleAddNewCustomer}
                  className="flex items-center gap-2"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-4 h-4" />
                  {language === "ar" ? "إضافة عميل جديد" : "Add New Customer"}
                </Button>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2">
              {!isLoading && customers.length > 0 ? (
                customers.map(customer => {
                  const sales = lastSalesPerCustomer[customer.id]?.data ?? [];
                  const isSalesLoading = lastSalesPerCustomer[customer.id]?.isLoading;
                  return (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelection(customer)}
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
                            {/* الرصيد */}
                            <span>
                              {language === "ar" ? "الرصيد:" : "Balance:"} {" "}
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
                              <div className="text-xs text-gray-400">جاري التحميل...</div>
                            ) : (sales.length > 0 ? (
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
                              <div className="text-xs text-gray-400">لا توجد بيانات بيع متاحة</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : !isLoading && internalSearchTerm === "" ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "ابدأ بالكتابة للبحث عن عميل" : "Start typing to search for customers"}
                  </p>
                </div>
              ) : null}
            </div>

            {customers.length > 0 && (
              <Button
                onClick={handleAddNewCustomer}
                variant="outline"
                className="w-full flex items-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Plus className="w-4 h-4" />
                {language === "ar" ? "إضافة عميل جديد" : "Add New Customer"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddCustomerDialog
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={handleCustomerAdded}
        initialName={internalSearchTerm}
        language={language}
      />
    </>
  );
};
