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
import { CustomerSearchResultItem } from "./CustomerSearchResultItem";

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
                customers.map(customer => (
                  <CustomerSearchResultItem
                    key={customer.id}
                    customer={customer}
                    isRTL={isRTL}
                    language={language}
                    onSelect={handleCustomerSelection}
                  />
                ))
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
