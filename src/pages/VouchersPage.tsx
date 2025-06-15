import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Plus, Edit, Printer, Trash2 } from "lucide-react";
import { CustomerSearchDialog } from "@/components/CustomerSearchDialog";
import { SupplierSearchDialog } from "@/components/SupplierSearchDialog";
import { EditVoucherDialog } from "@/components/EditVoucherDialog";
import { printVoucher } from "@/utils/voucherPrintUtils";
import { useVouchers } from "@/hooks/useVouchers";
import { VoucherFormData } from "@/services/voucherService";
import { Customer } from "@/types";

const VouchersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<"all" | "receipt" | "payment">("all");
  const [showCustomerSearchDialog, setShowCustomerSearchDialog] = useState(false);
  const [showSupplierSearchDialog, setShowSupplierSearchDialog] = useState(false);
  const [newVoucher, setNewVoucher] = useState<Omit<VoucherFormData, 'voucher_number'>>({
    date: new Date().toISOString().split('T')[0],
    type: "receipt",
    entity_type: "customer",
    entity_id: "",
    entity_name: "",
    amount: 0,
    description: "",
    payment_method: "cash"
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);

  const {
    vouchers,
    isLoading,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    isCreating
  } = useVouchers(1, 50, {
    searchTerm,
    type: voucherTypeFilter
  });

  const handleCustomerSelect = (customer: Customer) => {
    setNewVoucher(prev => ({
      ...prev,
      entity_type: "customer",
      entity_id: customer.id,
      entity_name: customer.name
    }));
    setShowCustomerSearchDialog(false);
  };

  const handleSupplierSelect = (supplier: { id: string; name: string }) => {
    setNewVoucher(prev => ({
      ...prev,
      entity_type: "supplier",
      entity_id: supplier.id,
      entity_name: supplier.name
    }));
    setShowSupplierSearchDialog(false);
  };

  const handleEntityTypeChange = (entityType: "customer" | "supplier") => {
    setNewVoucher(prev => ({
      ...prev,
      entity_type: entityType,
      entity_id: "",
      entity_name: ""
    }));
  };

  const handleVoucherTypeChange = (type: "receipt" | "payment") => {
    setNewVoucher(prev => ({
      ...prev,
      type,
      entity_id: "",
      entity_name: ""
    }));
  };

  const openEntityDialog = () => {
    if (newVoucher.entity_type === "customer") {
      setShowCustomerSearchDialog(true);
    } else {
      setShowSupplierSearchDialog(true);
    }
  };

  const handleAddVoucher = () => {
    if (!newVoucher.entity_id || !newVoucher.entity_name) {
      return;
    }

    if (newVoucher.amount <= 0) {
      return;
    }

    createVoucher(newVoucher);

    setNewVoucher({
      date: new Date().toISOString().split('T')[0],
      type: "receipt",
      entity_type: "customer",
      entity_id: "",
      entity_name: "",
      amount: 0,
      description: "",
      payment_method: "cash"
    });
  };

  const getPaymentMethodLabel = (method: string): string => {
    const labels: { [key: string]: string } = {
      cash: 'نقداً',
      card: 'بطاقة',
      bank_transfer: 'تحويل',
      check: 'شيك'
    };
    return labels[method] || method;
  };

  const handleEditVoucher = (voucher: any) => {
    setEditingVoucher(voucher);
    setShowEditDialog(true);
  };

  const handleVoucherUpdated = (updatedVoucher: any) => {
    // The hook will handle the update automatically
  };

  const handlePrintVoucher = (voucher: any) => {
    printVoucher(voucher);
  };

  const handleDeleteVoucher = (voucher: any) => {
    deleteVoucher(voucher.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            إدارة السندات
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن سند..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-sm"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
              </div>
              <div className="flex gap-2">
                <Select value={voucherTypeFilter} onValueChange={(value) => setVoucherTypeFilter(value as "all" | "receipt" | "payment")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="كل الأنواع" style={{ fontFamily: 'Tajawal, sans-serif' }} />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all" style={{ fontFamily: 'Tajawal, sans-serif' }}>كل الأنواع</SelectItem>
                    <SelectItem value="receipt" style={{ fontFamily: 'Tajawal, sans-serif' }}>سند قبض</SelectItem>
                    <SelectItem value="payment" style={{ fontFamily: 'Tajawal, sans-serif' }}>سند دفع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Add New Voucher Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="date" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</Label>
              <Input
                type="date"
                id="date"
                value={newVoucher.date}
                onChange={(e) => setNewVoucher({ ...newVoucher, date: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="type" style={{ fontFamily: 'Tajawal, sans-serif' }}>النوع</Label>
              <Select value={newVoucher.type} onValueChange={handleVoucherTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع السند" style={{ fontFamily: 'Tajawal, sans-serif' }} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="receipt" style={{ fontFamily: 'Tajawal, sans-serif' }}>سند قبض</SelectItem>
                  <SelectItem value="payment" style={{ fontFamily: 'Tajawal, sans-serif' }}>سند دفع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entityType" style={{ fontFamily: 'Tajawal, sans-serif' }}>نوع الجهة</Label>
              <Select value={newVoucher.entity_type} onValueChange={handleEntityTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الجهة" style={{ fontFamily: 'Tajawal, sans-serif' }} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="customer" style={{ fontFamily: 'Tajawal, sans-serif' }}>عميل</SelectItem>
                  <SelectItem value="supplier" style={{ fontFamily: 'Tajawal, sans-serif' }}>مورد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {newVoucher.entity_type === "customer" ? "العميل" : "المورد"}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  id="entity"
                  placeholder={`اختر ${newVoucher.entity_type === "customer" ? "عميل" : "مورد"}`}
                  value={newVoucher.entity_name}
                  readOnly
                  className="text-sm flex-1"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEntityDialog}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  اختيار
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="amount" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ</Label>
              <Input
                type="number"
                id="amount"
                value={newVoucher.amount}
                onChange={(e) => setNewVoucher({ ...newVoucher, amount: parseFloat(e.target.value) })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</Label>
              <Select value={newVoucher.payment_method} onValueChange={(value) => setNewVoucher({ ...newVoucher, payment_method: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" style={{ fontFamily: 'Tajawal, sans-serif' }} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="cash" style={{ fontFamily: 'Tajawal, sans-serif' }}>نقداً</SelectItem>
                  <SelectItem value="card" style={{ fontFamily: 'Tajawal, sans-serif' }}>بطاقة</SelectItem>
                  <SelectItem value="bank_transfer" style={{ fontFamily: 'Tajawal, sans-serif' }}>تحويل</SelectItem>
                  <SelectItem value="check" style={{ fontFamily: 'Tajawal, sans-serif' }}>شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description" style={{ fontFamily: 'Tajawal, sans-serif' }}>البيان</Label>
              <Textarea
                id="description"
                placeholder="أدخل البيان"
                value={newVoucher.description}
                onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                className="text-sm"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button 
                onClick={handleAddVoucher} 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={isCreating}
              >
                <Plus className="w-4 h-4 ml-2" />
                {isCreating ? "جاري الإضافة..." : "إضافة سند"}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-lg sm:text-2xl font-bold">{vouchers.length}</p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي السندات
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold">
                  {vouchers.reduce((sum, v) => sum + v.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي المبالغ
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600 flex items-center justify-center">
                  📊
                </div>
                <p className="text-lg sm:text-2xl font-bold">
                  {vouchers.filter(v => v.type === "receipt").length} / {vouchers.filter(v => v.type === "payment").length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  قبض / دفع
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>قائمة السندات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم السند</th>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>النوع</th>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الجهة</th>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ</th>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</th>
                  <th className="p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b hover:bg-gray-50 text-center">
                    <td className="p-3 font-semibold">{voucher.voucher_number}</td>
                    <td className="p-3">
                      <Badge 
                        variant={voucher.type === "receipt" ? "default" : "secondary"}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {voucher.type === "receipt" ? "سند قبض" : "سند دفع"}
                      </Badge>
                    </td>
                    <td className="p-3">{voucher.date}</td>
                    <td className="p-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {voucher.entity_name}
                      <br />
                      <span className="text-xs text-gray-500">
                        {voucher.entity_type === "customer" ? "عميل" : "مورد"}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-green-600">
                      <span className="flex items-center gap-1 justify-end">
                        {voucher.amount.toLocaleString()}
                        <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-4 h-4" />
                      </span>
                    </td>
                    <td className="p-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {getPaymentMethodLabel(voucher.payment_method)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEditVoucher(voucher)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          تعديل
                        </Button>
                        <Button
                          onClick={() => handlePrintVoucher(voucher)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          طباعة
                        </Button>
                        <Button
                          onClick={() => handleDeleteVoucher(voucher)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Search Dialogs */}
      <CustomerSearchDialog
        open={showCustomerSearchDialog}
        onClose={() => setShowCustomerSearchDialog(false)}
        onSelectCustomer={handleCustomerSelect}
        language="ar"
      />

      <SupplierSearchDialog
        open={showSupplierSearchDialog}
        onClose={() => setShowSupplierSearchDialog(false)}
        onSupplierSelect={handleSupplierSelect}
        searchTerm=""
        language="ar"
        onAddSupplier={() => {}}
      />

      <EditVoucherDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        voucher={editingVoucher}
        onVoucherUpdated={handleVoucherUpdated}
      />
    </div>
  );
};

export default VouchersPage;
