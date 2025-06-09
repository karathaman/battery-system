import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Phone, Calendar, Filter, User, Package, DollarSign, Edit3, Save, X, Ban, BarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CustomerDetailsDialog } from "@/components/CustomerDetailsDialog";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import type { Customer } from "@/types";

const CustomerFollowUp = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSaleFilter, setLastSaleFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.customerCode.includes(searchTerm);

    const matchesLastSale = (() => {
      const daysSinceLastSale = getDaysSinceLastSale(customer.lastSale);
      switch (lastSaleFilter) {
        case "recent":
          return daysSinceLastSale <= 7;
        case "week":
          return daysSinceLastSale <= 30;
        case "month":
          return daysSinceLastSale > 30;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesLastSale;
  });

  const getDaysSinceLastSale = (lastSale: string) => {
    const lastSaleDate = new Date(lastSale);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastSaleDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const showCustomerStatistics = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleBlockCustomer = (customerId: string) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? { ...customer, isBlocked: !customer.isBlocked }
          : customer
      )
    );
    setShowBlockDialog(false);
    toast({
      title: "تم تحديث حالة العميل",
      description: "تم تحديث حالة الحظر بنجاح",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            متابعة العملاء
          </h1>
          <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            متابعة عمليات البيع وإحصائيات العملاء
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg mb-6 sm:mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                متابعة العملاء ({filteredCustomers.length})
              </CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <AddCustomerDialog onCustomerAdded={handleCustomerAdded} language="ar" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="بحث عن عميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  dir="rtl"
                />
              </div>
              <Select value={lastSaleFilter} onValueChange={setLastSaleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="تصفية حسب آخر عملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="recent">خلال 7 أيام</SelectItem>
                  <SelectItem value="week">خلال 30 يوم</SelectItem>
                  <SelectItem value="month">أكثر من 30 يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg sm:text-xl mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {customer.name}
                    </CardTitle>
                    <p className="text-sm text-blue-100" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {customer.customerCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white hover:bg-blue-500"
                      onClick={() => showCustomerStatistics(customer)}
                    >
                      <BarChart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white hover:bg-blue-500"
                      onClick={() => setEditingCustomer(customer.id)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Sale Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {customer.totalSales} عملية
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {customer.totalAmount} ريال
                      </span>
                    </div>
                  </div>

                  {/* Last Sale */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        آخر عملية: {customer.lastSale}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      منذ {getDaysSinceLastSale(customer.lastSale)} يوم
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Block/Unblock Button */}
                    <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant={customer.isBlocked ? "outline" : "destructive"}
                          className="w-full flex items-center gap-2 flex-row-reverse text-xs sm:text-sm"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          {customer.isBlocked ? (
                            <>
                              <User className="w-3 h-3 sm:w-4 sm:h-4" />
                              إلغاء الحظر
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                              حظر العميل
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {customer.isBlocked ? "إلغاء حظر العميل" : "حظر العميل"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {customer.isBlocked
                              ? "هل أنت متأكد من إلغاء حظر هذا العميل؟"
                              : "هل أنت متأكد من حظر هذا العميل؟"}
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowBlockDialog(false)}
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                              إلغاء
                            </Button>
                            <Button
                              variant={customer.isBlocked ? "default" : "destructive"}
                              onClick={() => handleBlockCustomer(customer.id)}
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                              {customer.isBlocked ? "إلغاء الحظر" : "حظر"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <Card className="shadow-md mt-8">
            <CardContent className="p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-sm sm:text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                لا توجد عملاء مطابقين للبحث أو الفلاتر المحددة
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <CustomerDetailsDialog
          customer={selectedCustomer}
          open={showCustomerDetails}
          onClose={() => setShowCustomerDetails(false)}
        />
      )}
    </div>
  );
};

export default CustomerFollowUp;
