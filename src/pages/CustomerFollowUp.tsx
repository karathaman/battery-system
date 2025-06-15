import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Filter, UserPlus, TrendingUp, Calendar, Edit3, Trash2, Ban, UnlockIcon, Phone, User, DollarSign, RotateCcw, MessageCircle, Edit, X, FileText, CheckCircle } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer, FilterOptions } from "@/types";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import { CustomerDetailsDialog } from "@/components/CustomerDetailsDialog";

const CustomerFollowUp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSaleFilter, setLastSaleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filters: FilterOptions = {
    searchTerm,
    lastPurchaseFilter: lastSaleFilter
  };

  const {
    customers,
    pagination,
    isLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    blockCustomer,
    unblockCustomer,
    isCreating,
    isUpdating,
    isDeleting
  } = useCustomers(1, 50, filters);

  const handleCustomerAdded = (customerData: any) => {
    createCustomer(customerData);
    setShowAddDialog(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditDialog(true);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    updateCustomer({
      id: updatedCustomer.id,
      data: {
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        description: updatedCustomer.description,
        notes: updatedCustomer.notes
      }
    });
    setShowEditDialog(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteCustomer(customerId);
    }
  };

  const handleBlockCustomer = (customerId: string) => {
    const reason = prompt('يرجى إدخال سبب الحظر:');
    if (reason) {
      blockCustomer({ id: customerId, reason });
    }
  };

  const handleUnblockCustomer = (customerId: string) => {
    if (confirm('هل أنت متأكد من إلغاء حظر هذا العميل؟')) {
      unblockCustomer(customerId);
    }
  };

  const handleResetBalance = (customerId: string, customerName: string) => {
    if (confirm(`هل أنت متأكد من تصفير رصيد العميل: ${customerName}؟`)) {
      updateCustomer({
        id: customerId,
        data: { balance: 0 }
      });
    }
  };

  const handleShowDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };

  const getDaysSinceLastPurchase = (date: string): number => {
    const lastSaleDate = new Date(date);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - lastSaleDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader className="bg-[#f0fdf4] text-white p-4 sm:p-6">
          <div className="w-full flex justify-center">
            <CardTitle className="flex text-[#4e844d] items-center gap-2 flex-row-reverse text-lg sm:text-xl text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              متابعة العملاء [{customers.length}]
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </CardTitle>
          </div>
        </CardHeader>
        
        <div className="grid px-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-lg sm:text-2xl font-bold">{customers.length}</p>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إجمالي العملاء
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
              <p className="text-lg sm:text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إجمالي المبيعات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-lg sm:text-2xl font-bold">
                {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.averagePrice, 0) / customers.length) : 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                متوسط سعر الكيلو
              </p>
            </CardContent>
          </Card>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث عن عميل بالاسم أو رقم الجوال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right text-sm"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex-1 min-w-0">
              <label
                className="text-sm font-medium text-gray-700 block mb-2"
                style={{ fontFamily: "Tajawal, sans-serif" }}
              >
                فلترة حسب آخر عملية بيع
              </label>
              <Select value={lastSaleFilter} onValueChange={setLastSaleFilter}>
                <SelectTrigger
                  className="text-right w-full"
                  style={{ fontFamily: "Tajawal, sans-serif" }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العملاء</SelectItem>
                  <SelectItem value="recent">آخر أسبوع</SelectItem>
                  <SelectItem value="week">آخر شهر</SelectItem>
                  <SelectItem value="month">أكثر من شهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto sm:items-end">
              <Button
                onClick={() => {
                  setLastSaleFilter("all");
                  setSearchTerm("");
                }}
                variant="outline"
                className="flex-1 flex items-center gap-2 flex-row-reverse"
                style={{ fontFamily: "Tajawal, sans-serif" }}
              >
                <Filter className="w-4 h-4" />
                إعادة تعيين الفلاتر
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex-1 flex items-center gap-2 flex-row-reverse bg-[#4e844d]"
                style={{ fontFamily: "Tajawal, sans-serif" }}
              >
                <UserPlus className="w-4 h-4" />
                إضافة عميل جديد
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {customers.map(customer => (
          <Card
            key={customer.id}
            className={`shadow-md hover:shadow-lg transition-shadow ${customer.isBlocked ? 'border-red-200 bg-red-50' : customer.description?.includes("عميل مميز") ? 'border-green-200 bg-green-50 ' : ''}`}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                  <div className="flex-1">
                    <h3
                      className="text-sm sm:text-base font-semibold truncate"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {customer.name} - <Badge variant="secondary" className="text-xs">{customer.customerCode}</Badge>
                    </h3>
          
                    <div className="flex items-center gap-2 mt-1 flex-row-reverse flex-wrap">
                      {customer.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          محظور
                        </Badge>
                      )}
          
                      {customer.lastSale && getDaysSinceLastPurchase(customer.lastSale) > 30 && (
                        <Badge variant="destructive" className="text-xs">
                          متأخر
                        </Badge>
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
                      onClick={() => handleResetBalance(customer.id, customer.name)}
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
                    onClick={() => handleShowDetails(customer)}
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
                      onClick={() => handleEditCustomer(customer)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 flex-row-reverse text-xs"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Edit className="w-3 h-3" />
                      تعديل
                    </Button>
          
                    <Button
                      onClick={() => handleDeleteCustomer(customer.id)}
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
                        onClick={() => handleUnblockCustomer(customer.id)}
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
                        onClick={() => handleBlockCustomer(customer.id)}
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
        ))}
      </div>

      {customers.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا توجد عملاء
            </p>
            <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ابدأ بإضافة عملاء جدد لإدارة أعمالك
            </p>
          </CardContent>
        </Card>
      )}

      <AddCustomerDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      <EditCustomerDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      <CustomerDetailsDialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        customer={selectedCustomer ? { ...selectedCustomer, total_sold_quantity: selectedCustomer.totalSoldQuantity } : null}
      />
    </div>
  );
};

export default CustomerFollowUp;
