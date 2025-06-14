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
import { PurchaseItem } from "@/types/purchases";
import { usePurchases } from "@/hooks/usePurchases";
import { useBatteryTypes } from "@/hooks/useBatteryTypes";
import { Purchase as ServicePurchase, PurchaseFormData } from "@/services/purchaseService";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { InvoiceDialog } from "@/components/InvoiceDialog";

interface ExtendedPurchaseItem extends PurchaseItem {
  batteryTypeId: string;
}

const paymentMethods = [
  { value: "cash", label: "نقداً", icon: Banknote },
  { value: "check", label: "آجل", icon: CreditCard }
];

interface Supplier {
  id: string;
  name: string;
  phone: string;
  supplier_code: string;
  balance: number;
  total_purchases: number;
  total_amount: number;
  average_price: number;
  is_blocked: boolean;
}

const PurchasesPage = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<ExtendedPurchaseItem[]>([
    { id: "1", batteryType: "", batteryTypeId: "", quantity: 0, price: 0, total: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<ServicePurchase | null>(null);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [dialogInvoice, setDialogInvoice] = useState<any>(null);

  const { purchases, createPurchase, updatePurchase, deletePurchase, isCreating, isUpdating, isDeleting } = usePurchases();
  const { batteryTypes, isLoading: batteryTypesLoading } = useBatteryTypes();

  const addPurchaseItem = () => {
    const newItem: ExtendedPurchaseItem = {
      id: Date.now().toString(),
      batteryType: "",
      batteryTypeId: "",
      quantity: 0,
      price: 0,
      total: 0
    };
    setPurchaseItems([...purchaseItems, newItem]);
  };

  const updatePurchaseItem = (index: number, field: keyof ExtendedPurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
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
    
    setPurchaseItems(updatedItems);
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    if (!vatEnabled) return 0;
    return Math.round(calculateSubtotal() * 0.15);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discount;
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setPurchaseItems([{ id: "1", batteryType: "", batteryTypeId: "", quantity: 0, price: 0, total: 0 }]);
    setDiscount(0);
    setPaymentMethod("check");
    setVatEnabled(false);
    setEditingPurchase(null);
  };

  const generatePurchase = async () => {
    if (!selectedSupplier) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المورد أولاً",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    if (purchaseItems.some(item => !item.quantity || !item.price || !item.batteryTypeId)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات الأصناف",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const purchaseData: PurchaseFormData = {
      invoice_number: "", // Will be generated by service
      date: new Date().toISOString().split('T')[0],
      supplier_id: selectedSupplier.id,
      subtotal: calculateSubtotal(),
      discount,
      tax: calculateTax(),
      total: calculateTotal(),
      payment_method: paymentMethod as "cash" | "card" | "bank_transfer" | "check",
      status: "completed",
      items: purchaseItems.map(item => ({
        battery_type_id: item.batteryTypeId,
        quantity: item.quantity,
        price_per_kg: item.price,
        total: item.total
      }))
    };

    if (editingPurchase) {
      updatePurchase({ id: editingPurchase.id, data: purchaseData });
    } else {
      createPurchase(purchaseData);
    }

    resetForm();
  };

  const editPurchase = (purchase: ServicePurchase) => {
    setEditingPurchase(purchase);
    // Find supplier from the purchase data
    const supplier: Supplier = {
      id: purchase.supplier_id,
      name: purchase.suppliers?.name || 'غير معروف',
      phone: '',
      supplier_code: purchase.suppliers?.supplier_code || '',
      balance: 0,
      total_purchases: 0,
      total_amount: 0,
      average_price: 0,
      is_blocked: false
    };
    setSelectedSupplier(supplier);
    
    // Convert purchase items to extended purchase items
    const extendedItems: ExtendedPurchaseItem[] = (purchase.items || purchase.purchase_items || []).map((item: any) => {
      const batteryType = batteryTypes.find(bt => bt.name === (item.batteryType || item.battery_types?.name));
      return {
        id: item.id || Date.now().toString(),
        batteryType: item.batteryType || item.battery_types?.name || 'غير معروف',
        batteryTypeId: batteryType?.id || "",
        quantity: item.quantity,
        price: item.price_per_kg || item.price || 0,
        total: item.total
      };
    });
    setPurchaseItems(extendedItems);
    setDiscount(purchase.discount);
    setPaymentMethod(purchase.payment_method);
    setVatEnabled(purchase.tax > 0);
  };

  const handleDeletePurchase = (purchase: ServicePurchase) => {
    deletePurchase(purchase.id);
  };

  const handlePrintPurchase = (purchase: ServicePurchase) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة شراء رقم ${purchase.invoice_number}</title>
        <style>
          body {
            font-family: 'Tajawal', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .invoice-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .invoice-details {
            margin-bottom: 20px;
          }
          .invoice-details div {
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #f5f5f5;
          }
          .totals {
            margin-top: 20px;
            text-align: left;
          }
          .totals div {
            margin-bottom: 5px;
          }
          .total-final {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
            padding-top: 10px;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>فاتورة مشتريات رقم ${purchase.invoice_number}</h1>
        </div>
        
        <div class="invoice-details">
          <div><strong>التاريخ:</strong> ${new Date(purchase.date).toLocaleDateString('ar-SA')}</div>
          <div><strong>المورد:</strong> ${purchase.suppliers?.name || 'غير معروف'}</div>
          <div><strong>طريقة الدفع:</strong> ${getPaymentMethodLabel(purchase.payment_method)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${(purchase.items || purchase.purchase_items || []).map((item: any) => `
              <tr>
                <td>${item.batteryType || item.battery_types?.name || 'غير معروف'}</td>
                <td>${item.quantity}</td>
                <td>${(item.price_per_kg || item.price || 0).toLocaleString()} ريال</td>
                <td>${item.total.toLocaleString()} ريال</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>المجموع الفرعي: ${purchase.subtotal.toLocaleString()} ريال</div>
          ${purchase.tax > 0 ? `<div>ضريبة القيمة المضافة (15%): ${purchase.tax.toLocaleString()} ريال</div>` : ''}
          ${purchase.discount > 0 ? `<div>الخصم: -${purchase.discount.toLocaleString()} ريال</div>` : ''}
          <div class="total-final">الإجمالي: ${purchase.total.toLocaleString()} ريال</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierDialog(false);
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name, phone, supplier_code, balance, total_purchases, total_amount, average_price, is_blocked");

    if (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }

    return data;
  };

  const SupplierSearchDialog = ({ open, onClose, onSupplierSelect }: { 
    open: boolean; 
    onClose: () => void; 
    onSupplierSelect: (supplier: Supplier) => void 
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
    useEffect(() => {
      fetchSuppliers().then(setSuppliers);
    }, []);
  
    const filteredSuppliers = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md" dir="rtl">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            اختيار المورد
          </h3>
  
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن مورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>
  
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredSuppliers.map(supplier => (
                <div
                  key={supplier.id}
                  onClick={() => {
                    onSupplierSelect(supplier);
                    setSearchTerm("");
                    onClose();
                  }}
                  className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {supplier.name}
                      </p>
                      <p className="text-sm text-gray-600">{supplier.phone}</p>
                      <Badge variant="secondary" className="mt-1">
                        {supplier.supplier_code}
                      </Badge>
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {supplier.balance.toLocaleString()} ريال
                      </p>
                      <p className="text-xs text-gray-500">الرصيد</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-[#eff6ff] text-[#1e40af]">
          <CardTitle
            className="flex items-center justify-center gap-2 flex-row-reverse text-lg sm:text-xl"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {editingPurchase ? 'تعديل فاتورة المشتريات' : 'نظام المشتريات'}
            <ShoppingCart className="w-4 h-4" />
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {editingPurchase ? `تعديل فاتورة ${editingPurchase.invoice_number}` : 'إنشاء فاتورة جديدة'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supplier Selection */}
              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>المورد</Label>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2 flex-row-reverse"
                  onClick={() => setShowSupplierDialog(true)}
                >
                  <Search className="w-4 h-4" />
                  {selectedSupplier ? selectedSupplier.name : "اختر المورد"}
                </Button>
                {selectedSupplier && (
                  <div className="mt-2 p-3 bg-blue-50 rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {selectedSupplier.name}
                        </p>
                        <p className="text-sm text-gray-600">{selectedSupplier.phone}</p>
                        <Badge variant="secondary" className="mt-1">
                          {selectedSupplier.supplier_code}
                        </Badge>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${selectedSupplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedSupplier.balance.toLocaleString()} ريال
                        </p>
                        <p className="text-xs text-gray-500">الرصيد الحالي</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Items */}
              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>أصناف الفاتورة</Label>
                <div className="space-y-3 mt-2">
                  {purchaseItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Select
                          value={item.batteryTypeId}
                          onValueChange={(value) => updatePurchaseItem(index, 'batteryTypeId', value)}
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
                          onChange={(e) => updatePurchaseItem(index, 'quantity', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="السعر"
                          value={item.price || ''}
                          onChange={(e) => updatePurchaseItem(index, 'price', Number(e.target.value) || 0)}
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
                          onClick={() => removePurchaseItem(index)}
                          disabled={purchaseItems.length === 1}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addPurchaseItem}
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
                  onClick={generatePurchase}
                  className="flex-1"
                  disabled={isCreating || isUpdating}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {editingPurchase ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
                </Button>
                {editingPurchase && (
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

        {/* Purchase Summary */}
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
              
              {paymentMethod === 'check' && (
                <div className="bg-yellow-50 p-3 rounded border">
                  <p className="text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ملاحظة: سيتم إضافة هذا المبلغ لرصيد المورد في حالة الشراء الآجل
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          {purchases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  آخر المشتريات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchases.slice(0, 5).map(purchase => (
                    <div key={purchase.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{purchase.invoice_number}</p>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {purchase.suppliers?.name || 'غير معروف'}
                          </p>
                          <Badge variant={purchase.payment_method === 'check' ? 'destructive' : 'default'} className="text-xs mt-1">
                            {paymentMethods.find(m => m.value === purchase.payment_method)?.label}
                          </Badge>
                        </div>
                        <div className="text-left flex gap-1 items-center">
                          {/* Show invoice dialog on click */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setDialogInvoice(purchase); setShowInvoiceDialog(true); }}
                            title="عرض الفاتورة"
                            className="text-yellow-500 border-yellow-400"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePrintPurchase(purchase)}
                            title="طباعة"
                          >
                            <Printer className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => editPurchase(purchase)}
                            title="تعديل"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeletePurchase(purchase)}
                            title="حذف"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Supplier Search Dialog */}
      <SupplierSearchDialog
        open={showSupplierDialog}
        onClose={() => setShowSupplierDialog(false)}
        onSupplierSelect={handleSupplierSelect}
      />
      {/* == Dialog عرض الفاتورة == */}
      <InvoiceDialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        invoice={dialogInvoice}
        type="purchase"
      />
    </div>
  );
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: { [key: string]: string } = {
    cash: 'نقداً',
    card: 'بطاقة',
    transfer: 'تحويل',
    check: 'آجل'
  };
  return labels[method] || method;
};

export default PurchasesPage;
