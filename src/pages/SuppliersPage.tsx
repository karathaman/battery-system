
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Search, Filter, UserPlus, TrendingUp, Calendar, Edit3, Trash2, Ban, UnlockIcon } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Supplier, FilterOptions } from "@/types";
import { AddSupplierDialog } from "@/components/AddSupplierDialog";
import { EditSupplierDialog } from "@/components/EditSupplierDialog";

const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastPurchaseFilter, setLastPurchaseFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const filters: FilterOptions = {
    searchTerm,
    lastPurchaseFilter
  };

  const {
    suppliers,
    pagination,
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    blockSupplier,
    unblockSupplier,
    isCreating,
    isUpdating,
    isDeleting
  } = useSuppliers(1, 50, filters);

  const handleSupplierAdded = (supplierData: any) => {
    createSupplier(supplierData);
    setShowAddDialog(false);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowEditDialog(true);
  };

  const handleSupplierUpdated = (updatedSupplier: Supplier) => {
    updateSupplier({
      id: updatedSupplier.id,
      data: {
        name: updatedSupplier.name,
        phone: updatedSupplier.phone,
        description: updatedSupplier.description,
        notes: updatedSupplier.notes
      }
    });
    setShowEditDialog(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteSupplier(supplierId);
    }
  };

  const handleBlockSupplier = (supplierId: string) => {
    const reason = prompt('يرجى إدخال سبب الحظر:');
    if (reason) {
      blockSupplier({ id: supplierId, reason });
    }
  };

  const handleUnblockSupplier = (supplierId: string) => {
    if (confirm('هل أنت متأكد من إلغاء حظر هذا المورد؟')) {
      unblockSupplier(supplierId);
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
              إدارة الموردين [{suppliers.length}]
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </CardTitle>
          </div>
        </CardHeader>
        
        <div className="grid px-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-lg sm:text-2xl font-bold">{suppliers.length}</p>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إجمالي الموردين
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
              <p className="text-lg sm:text-2xl font-bold">
                {suppliers.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إجمالي المشتريات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center !block">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-lg sm:text-2xl font-bold">
                {suppliers.length > 0 ? Math.round(suppliers.reduce((sum, s) => sum + s.averagePrice, 0) / suppliers.length) : 0}
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
              placeholder="ابحث عن مورد بالاسم أو رقم الجوال..."
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
                فلترة حسب آخر عملية شراء
              </label>
              <Select value={lastPurchaseFilter} onValueChange={setLastPurchaseFilter}>
                <SelectTrigger
                  className="text-right w-full"
                  style={{ fontFamily: "Tajawal, sans-serif" }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموردين</SelectItem>
                  <SelectItem value="recent">آخر أسبوع</SelectItem>
                  <SelectItem value="week">آخر شهر</SelectItem>
                  <SelectItem value="month">أكثر من شهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto sm:items-end">
              <Button
                onClick={() => {
                  setLastPurchaseFilter("all");
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
                إضافة مورد جديد
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suppliers.map(supplier => (
          <Card key={supplier.id} className={`shadow-md hover:shadow-lg transition-shadow ${supplier.isBlocked ? 'border-red-300 bg-red-50' : ''}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {supplier.name}
                    </h3>
                    <p className="text-sm text-gray-600 text-right">{supplier.phone}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {supplier.supplierCode}
                      </Badge>
                      {supplier.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          محظور
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {supplier.description && (
                  <p className="text-sm text-gray-600 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {supplier.description}
                  </p>
                )}

                <div className="bg-blue-50 rounded p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{supplier.totalPurchases}</p>
                      <p className="text-gray-600">المشتريات</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{supplier.totalAmount.toLocaleString()} ريال</p>
                      <p className="text-gray-600">الإجمالي</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditSupplier(supplier)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-1 text-xs"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    disabled={isUpdating}
                  >
                    <Edit3 className="w-3 h-3" />
                    تعديل
                  </Button>
                  
                  {supplier.isBlocked ? (
                    <Button
                      onClick={() => handleUnblockSupplier(supplier.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs text-green-600 hover:bg-green-50"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <UnlockIcon className="w-3 h-3" />
                      إلغاء الحظر
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBlockSupplier(supplier.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs text-orange-600 hover:bg-orange-50"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Ban className="w-3 h-3" />
                      حظر
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  variant="destructive"
                  size="sm"
                  className="w-full flex items-center gap-2 text-xs"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3" />
                  حذف المورد
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا توجد موردين
            </p>
            <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ابدأ بإضافة موردين جدد لإدارة أعمالك
            </p>
          </CardContent>
        </Card>
      )}

      <AddSupplierDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSupplierAdded={handleSupplierAdded}
      />

      <EditSupplierDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        supplier={editingSupplier}
        onSupplierUpdated={handleSupplierUpdated}
      />
    </div>
  );
};

export default SuppliersPage;
