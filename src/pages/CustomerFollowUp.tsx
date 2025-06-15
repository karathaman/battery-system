import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Filter, UserPlus, TrendingUp, Calendar, Edit3, Trash2, Ban, UnlockIcon, Phone, User, DollarSign, RotateCcw, MessageCircle, Edit, X, FileText, CheckCircle, Package } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer, FilterOptions } from "@/types";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import { CustomerDetailsDialog } from "@/components/CustomerDetailsDialog";
import { useCustomerLastSales } from "@/hooks/useCustomerLastSales";
import { CustomerCard } from "@/components/CustomerCard";

const CustomerFollowUp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSaleFilter, setLastSaleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [sortField, setSortField] = useState("balance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  // فرز العملاء حسب الفلتر المختار
  const sortedCustomers = [...customers].sort((a, b) => {
    let aValue: any = a[sortField as keyof Customer] ?? 0;
    let bValue: any = b[sortField as keyof Customer] ?? 0;
    // آخر بيع يحتاج تحويل لتاريخ
    if (sortField === "lastSale") {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }
    if (sortDirection === "asc") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

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
        
        <div className="grid px-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-700" />
              <p className="text-lg sm:text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.totalSoldQuantity, 0).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إجمالي الكميات الموردة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-lg sm:text-2xl font-bold">
                {customers.reduce((sum, c) => sum + (c.balance ?? 0), 0).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-purple-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                الأرصدة
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

            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-gray-700 block mb-2" style={{ fontFamily: "Tajawal, sans-serif" }}>
                ترتيب حسب
              </label>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger className="text-right w-32" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">الرصيد</SelectItem>
                    <SelectItem value="lastSale">آخر عملية بيع</SelectItem>
                    <SelectItem value="totalSoldQuantity">مجموع الكميات</SelectItem>
                    <SelectItem value="totalAmount">إجمالي المبالغ</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDirection} onValueChange={val => setSortDirection(val as "asc" | "desc")}>
                  <SelectTrigger className="text-right w-28" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">تصاعدي</SelectItem>
                    <SelectItem value="desc">تنازلي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
        {sortedCustomers.map(customer => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onShowDetails={handleShowDetails}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onResetBalance={handleResetBalance}
            onBlockCustomer={handleBlockCustomer}
            onUnblockCustomer={handleUnblockCustomer}
            getDaysSinceLastPurchase={getDaysSinceLastPurchase}
          />
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
