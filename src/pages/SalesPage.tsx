import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Plus, Search, Calendar, Printer, Edit, Trash2, Banknote, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Sale, SaleItem } from "@/types/sales";
import { printInvoice } from "@/utils/printUtils";
import { CustomerSearchDialog } from "@/components/CustomerSearchDialog";
import { Customer } from "@/types";
import { useSales } from "@/hooks/useSales";
import { useBatteryTypes } from "@/hooks/useBatteryTypes";
import { SaleFormData, ExtendedSale } from "@/services/salesService";
import { AlertCircle } from "lucide-react";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Save, FileDown, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface ExtendedSaleItem extends SaleItem {
  batteryTypeId: string;
}

const paymentMethods = [
  { value: "cash", label: "نقداً", icon: Banknote },
  { value: "credit", label: "آجل", icon: CreditCard }
];

const SalesPage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleItems, setSaleItems] = useState<ExtendedSaleItem[]>([
    { id: "1", batteryType: "", batteryTypeId: "", quantity: 0, price: 0, total: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  // start with "credit" as the default
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [editingSale, setEditingSale] = useState<ExtendedSale | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [dialogInvoice, setDialogInvoice] = useState<ExtendedSale | null>(null);
  const [confirmDeleteSaleId, setConfirmDeleteSaleId] = useState<string | null>(null);

  const [salesSearch, setSalesSearch] = useState("");
  const [salesFilterDate, setSalesFilterDate] = useState("");

  const { sales, createSale, updateSale, deleteSale, isCreating, isUpdating, isDeleting } = useSales();
  const { batteryTypes, isLoading: batteryTypesLoading } = useBatteryTypes();

  const addSaleItem = () => {
    const newItem: ExtendedSaleItem = {
      id: Date.now().toString(),
      batteryType: "",
      batteryTypeId: "",
      quantity: 0,
      price: 0,
      total: 0
    };
    setSaleItems([...saleItems, newItem]);
  };

  const updateSaleItem = (index: number, field: keyof ExtendedSaleItem, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Update battery type name when battery type ID changes
    if (field === 'batteryTypeId') {
      const selectedBatteryType = batteryTypes.find(bt => bt.id === value);
      if (selectedBatteryType) {
        updatedItems[index].batteryType = selectedBatteryType.name;
        updatedItems[index].price = selectedBatteryType.unit_price;
      }
    }
    
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    
    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    if (!vatEnabled) return 0;
    return Math.round(calculateSubtotal() * 0.15);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discount;
  };

  const handlePrintInvoice = (sale: Sale) => {
    printInvoice(sale);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSaleItems([{ id: "1", batteryType: "", batteryTypeId: "", quantity: 0, price: 0, total: 0 }]);
    setDiscount(0);
    setPaymentMethod("credit");
    setVatEnabled(false);
    setEditingSale(null);
  };

  const generateInvoice = () => {
    if (!selectedCustomer) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار العميل أولاً",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    if (saleItems.some(item => !item.quantity || !item.price || !item.batteryTypeId)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات الأصناف",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const saleData: SaleFormData = {
      customer_id: selectedCustomer.id,
      date: new Date().toISOString().split('T')[0],
      items: saleItems.map(item => ({
        battery_type_id: item.batteryTypeId,
        quantity: item.quantity,
        price_per_kg: item.price
      })),
      subtotal: calculateSubtotal(),
      discount,
      tax: calculateTax(),
      total: calculateTotal(),
      payment_method: paymentMethod,
      notes: ""
    };

    if (editingSale) {
      updateSale({ id: editingSale.id, data: saleData });
    } else {
      createSale(saleData);
    }

    resetForm();
  };

  const editSale = (sale: ExtendedSale) => {
    setEditingSale(sale);
    // Find customer from the sale data
    const customer: Customer = {
      id: sale.customerId,
      customerCode: `C${sale.customerId.substring(0, 3).toUpperCase()}`,
      name: sale.customerName,
      phone: '',
      description: '',
      notes: '',
      lastSale: '', // تحديث اسم الحقل
      totalSoldQuantity: 0, // تحديث اسم الحقل
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      balance: 0
    };
    setSelectedCustomer(customer);
    
    // Convert sale items to extended sale items
    const extendedItems: ExtendedSaleItem[] = sale.items.map(item => {
      const batteryType = batteryTypes.find(bt => bt.name === item.batteryType);
      return {
        ...item,
        batteryTypeId: batteryType?.id || ""
      };
    });
    setSaleItems(extendedItems);
    setDiscount(sale.discount);
    // Only "cash" or "credit" is allowed
    setPaymentMethod(sale.paymentMethod === "credit" ? "credit" : "cash");
    setVatEnabled(sale.tax > 0);
  };

  const handleDeleteSale = (sale: ExtendedSale) => {
    deleteSale(sale.id);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(false);
  };

  // تصدير كشف الحساب للعميل إلى Excel
  const exportSalesToExcel = () => {
    if (!sales.length) return;
    const ws = XLSX.utils.json_to_sheet(sales.map(sale => ({
      "رقم الفاتورة": sale.invoiceNumber,
      "اسم العميل": sale.customerName,
      "التاريخ": sale.date,
      "المجموع": sale.total,
      "الطريقة": sale.paymentMethod === "credit" ? "آجل" : "نقداً"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "كشف حساب المبيعات");
    XLSX.writeFile(wb, "sales-account.xlsx");
  };

  // تصدير كشف الحساب إلى PDF
  const exportSalesToPDF = () => {
    const doc = new jsPDF();
    doc.text("كشف حساب المبيعات:", 10, 10);
    let y = 20;
    sales.forEach(sale => {
      doc.text(`فاتورة: ${sale.invoiceNumber} | عميل: ${sale.customerName} | التاريخ: ${sale.date} | الإجمالي: ${sale.total} | طريقة: ${sale.paymentMethod === "credit" ? "آجل" : "نقداً"}`, 10, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("sales-account.pdf");
  };

  // تصفية قائمة آخر المبيعات
  const filteredSales = sales
    .filter(sale => (
      (!salesSearch || sale.customerName.includes(salesSearch)) &&
      (!salesFilterDate || sale.date.startsWith(salesFilterDate))
    ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-[#f0fdf4] text-[#53864d]">
          <CardTitle
            className="flex items-center justify-center gap-2 flex-row-reverse text-lg sm:text-xl"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {editingSale ? 'تعديل فاتورة المبيعات' : 'نظام المبيعات'}
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {editingSale ? `تعديل فاتورة ${editingSale.invoiceNumber}` : 'إنشاء فاتورة جديدة'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>العميل</Label>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2 flex-row-reverse"
                  onClick={() => setShowCustomerDialog(true)}
                >
                  <Search className="w-4 h-4" />
                  {selectedCustomer ? selectedCustomer.name : "اختر العميل"}
                </Button>
                {selectedCustomer && (
                  <div className="mt-2 p-3 bg-blue-50 rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {selectedCustomer.name}
                        </p>
                        <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                        <Badge variant="secondary" className="mt-1">
                          {selectedCustomer.customerCode}
                        </Badge>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-600">
                          {selectedCustomer.totalAmount.toLocaleString()} ريال
                        </p>
                        <p className="text-xs text-gray-500">إجمالي المشتريات</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sale Items */}
              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>أصناف الفاتورة</Label>
                <div className="space-y-3 mt-2">
                  {saleItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Select
                          value={item.batteryTypeId}
                          onValueChange={(value) => updateSaleItem(index, 'batteryTypeId', value)}
                          disabled={batteryTypesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع البطارية" />
                          </SelectTrigger>
                          <SelectContent>
                            {batteryTypes.map(type => (
                              <SelectItem key={type.id} value={type.id} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {type.name} - {type.unit_price} ريال
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="الكمية"
                          value={item.quantity || ''}
                          onChange={(e) => updateSaleItem(index, 'quantity', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="السعر"
                          value={item.price || ''}
                          onChange={(e) => updateSaleItem(index, 'price', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={item.total.toLocaleString()}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSaleItem(index)}
                          disabled={saleItems.length === 1}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addSaleItem}
                  variant="outline"
                  className="mt-3 w-full flex items-center gap-2"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-4 h-4" />
                  إضافة صنف
                </Button>
              </div>

              {/* Payment Method */}
              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    return (
                      <Button
                        key={method.value}
                        variant={paymentMethod === method.value ? "default" : "outline"}
                        onClick={() => setPaymentMethod(method.value)}
                        className="flex items-center gap-2"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* VAT Toggle */}
              <div className="flex items-center justify-between">
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>تطبيق ضريبة القيمة المضافة (15%)</Label>
                <Switch
                  checked={vatEnabled}
                  onCheckedChange={setVatEnabled}
                />
              </div>

              {/* Discount */}
              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم</Label>
                <Input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={generateInvoice}
                  className="flex-1"
                  disabled={isCreating || isUpdating}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {editingSale ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
                </Button>
                {editingSale && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Summary & قائمة آخر الفواتير + خيارات البحث والتصدير */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                ملخص الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع الفرعي:</span>
                <span className="font-bold">{calculateSubtotal().toLocaleString()} ريال</span>
              </div>
              {vatEnabled && (
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'Tajawal, sans-serif' }}>ضريبة القيمة المضافة (15%):</span>
                  <span className="font-bold">{calculateTax().toLocaleString()} ريال</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم:</span>
                <span className="font-bold text-red-600">-{discount.toLocaleString()} ريال</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي:</span>
                  <span className="font-bold text-green-600">{calculateTotal().toLocaleString()} ريال</span>
                </div>
              </div>
              
              {paymentMethod === 'credit' && (
                <div className="bg-yellow-50 p-3 rounded border">
                  <p className="text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ملاحظة: سيتم إضافة هذا المبلغ لرصيد العميل في حالة البيع الآجل
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* البحث والتصفية و أزرار التصدير */}
          {sales.length > 0 && (
            <Card>
              <CardHeader className="flex flex-col items-start gap-2">
                <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  آخر بيع
                </CardTitle>
                <div className="flex flex-wrap gap-2 mb-2 w-full">
                  <Input
                    placeholder="بحث باسم العميل"
                    className="w-44"
                    value={salesSearch}
                    onChange={e => setSalesSearch(e.target.value)}
                  />
                  <Input
                    type="date"
                    className="w-44"
                    value={salesFilterDate}
                    onChange={e => setSalesFilterDate(e.target.value)}
                  />
                  <Button variant="outline" onClick={exportSalesToExcel} className="flex gap-1">
                    <FileDown className="w-4 h-4" /> تصدير Excel
                  </Button>
                  <Button variant="outline" onClick={exportSalesToPDF} className="flex gap-1">
                    <FileText className="w-4 h-4" /> تصدير PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                <div className="space-y-3">
                  {filteredSales.slice(0, 5).map(sale => {
                    // helper to show payment method as فقط "آجل" أو "نقداً"
                    let paymentMethodLabel = "نقداً";
                    let badgeVariant: "default" | "destructive" = "default";
                    // حتى لو القاعدة ترجع "check" للأجل نعكسها لآجل
                    if (sale.paymentMethod === "credit" || sale.paymentMethod === "check") {
                      paymentMethodLabel = "آجل";
                      badgeVariant = "destructive";
                    }
                    return (
                      <div key={sale.id} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm">{sale.invoiceNumber}</p>
                            <p className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {sale.customerName}
                            </p>
                            <Badge
                              variant={sale.paymentMethod === "credit" || sale.paymentMethod === "check" ? "destructive" : "default"}
                              className="text-xs mt-1"
                            >
                              {sale.paymentMethod === "credit" || sale.paymentMethod === "check" ? "آجل" : "نقداً"}
                            </Badge>
                          </div>
                          <div className="text-left flex gap-1 items-center">
                            {/* Show invoice dialog on click */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setDialogInvoice(sale); setShowInvoiceDialog(true); }}
                              title="عرض الفاتورة"
                              className="text-yellow-500 border-yellow-400"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePrintInvoice(sale)}
                              title="طباعة"
                            >
                              <Printer className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => editSale(sale)}
                              title="تعديل"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {/* زر الحذف مع التأكيد */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  title="حذف"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد حذف الفاتورة</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد أنك تريد حذف هذه الفاتورة؟ لا يمكن التراجع بعد الحذف.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSale(sale)}>
                                    نعم، حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredSales.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">لا توجد فواتير مطابقة</div>
                  )}
                </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Customer Search Dialog */}
      <CustomerSearchDialog
        open={showCustomerDialog}
        onClose={() => setShowCustomerDialog(false)}
        onSelectCustomer={handleCustomerSelect}
        language="ar"
      />

      {/* == عرض dialog الفاتورة == */}
      <InvoiceDialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        invoice={dialogInvoice}
        type="sale"
      />
    </div>
  );
};

export default SalesPage;
