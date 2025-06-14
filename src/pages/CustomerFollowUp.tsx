
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Filter, UserPlus, TrendingUp, Calendar, Edit3, Trash2, Ban, UnlockIcon, Phone, User } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer, FilterOptions } from "@/types";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";

const CustomerFollowUp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSaleFilter, setLastSaleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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
          <Card key={customer.id} className={`shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 ${customer.isBlocked ? 'border-red-300 bg-red-50' : 'border-blue-200'}`}>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header with name and avatar */}
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-row-reverse text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {customer.customerCode}
                      </Badge>
                      {customer.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          محظور
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {customer.description && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {customer.description}
                    </p>
                  </div>
                )}

                {/* Statistics */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{customer.totalPurchases}</div>
                      <div className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>المشتريات</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{customer.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditCustomer(customer)}
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-1 text-xs hover:bg-blue-50 hover:border-blue-300"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                      disabled={isUpdating}
                    >
                      <Edit3 className="w-3 h-3" />
                      تعديل
                    </Button>
                    
                    {customer.isBlocked ? (
                      <Button
                        onClick={() => handleUnblockCustomer(customer.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs text-green-600 hover:bg-green-50 hover:border-green-300"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <UnlockIcon className="w-3 h-3" />
                        إلغاء الحظر
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleBlockCustomer(customer.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <Ban className="w-3 h-3" />
                        حظر
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center gap-2 text-xs hover:bg-red-600"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف العميل
                  </Button>
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
    </div>
  );
};

export default CustomerFollowUp;
