import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, Search, Printer, Edit, Trash2, Banknote, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PurchaseItem } from "@/types/purchases";
import { usePurchases } from "@/hooks/usePurchases";
import { useBatteryTypes } from "@/hooks/useBatteryTypes";
import { Purchase as ServicePurchase, PurchaseFormData } from "@/services/purchaseService";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { SupplierSearchDialog } from "@/components/SupplierSearchDialog";

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
      invoice_number: "",
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

  const handleSupplierSelect = (supplier: any) => {
    setSelectedSupplier({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone || '',
      supplier_code: supplier.supplierCode,
      balance: 0,
      total_purchases: 0,
      total_amount: 0,
      average_price: 0,
      is_blocked: false
    });
    setShowSupplierDialog(false);
  };

  const handleAddSupplier = (initialName: string) => {
    console.log("Add supplier called with name:", initialName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 p-6">
            <div className="flex items-center justify-center gap-3">
              <ShoppingCart className="w-8 h-8 text-white" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {editingPurchase ? `تعديل فاتورة ${editingPurchase.invoice_number}` : 'نظام المشتريات'}
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Form Section */}
          <div className="xl:col-span-3 space-y-6">
            {/* Supplier Selection Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  اختيار المورد
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Button 
                  variant="outline" 
                  className="w-full h-14 flex items-center gap-3 text-right border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => setShowSupplierDialog(true)}
                >
                  <Search className="w-5 h-5 text-gray-500" />
                  <span className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedSupplier ? selectedSupplier.name : "اختر المورد"}
                  </span>
                </Button>
                
                {selectedSupplier && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {selectedSupplier.name}
                        </h3>
                        <p className="text-gray-600">{selectedSupplier.phone}</p>
                        <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                          {selectedSupplier.supplier_code}
                        </Badge>
                      </div>
                      <div className="text-left">
                        <p className={`text-xl font-bold ${selectedSupplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedSupplier.balance.toLocaleString()} ريال
                        </p>
                        <p className="text-sm text-gray-500">الرصيد الحالي</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items Table Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  أصناف الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>نوع البطارية</TableHead>
                        <TableHead className="text-center font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية</TableHead>
                        <TableHead className="text-center font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر</TableHead>
                        <TableHead className="text-center font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</TableHead>
                        <TableHead className="text-center font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="w-1/3">
                            <Select
                              value={item.batteryTypeId}
                              onValueChange={(value) => updatePurchaseItem(index, 'batteryTypeId', value)}
                              disabled={batteryTypesLoading}
                            >
                              <SelectTrigger className="w-full">
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
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="الكمية"
                              value={item.quantity || ''}
                              onChange={(e) => updatePurchaseItem(index, 'quantity', Number(e.target.value) || 0)}
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="السعر"
                              value={item.price || ''}
                              onChange={(e) => updatePurchaseItem(index, 'price', Number(e.target.value) || 0)}
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="text-center font-semibold text-green-600">
                              {item.total.toLocaleString()} ريال
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePurchaseItem(index)}
                              disabled={purchaseItems.length === 1}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <Button
                  onClick={addPurchaseItem}
                  variant="outline"
                  className="mt-4 w-full h-12 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة صنف جديد
                </Button>
              </CardContent>
            </Card>

            {/* Payment & Settings Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إعدادات الدفع
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Payment Methods */}
                <div>
                  <Label className="text-lg font-semibold mb-3 block" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    طريقة الدفع
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <Button
                          key={method.value}
                          variant={paymentMethod === method.value ? "default" : "outline"}
                          onClick={() => setPaymentMethod(method.value)}
                          className="h-14 flex items-center gap-3 text-lg"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          <Icon className="w-5 h-5" />
                          {method.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* VAT & Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <Label className="text-lg font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        ضريبة القيمة المضافة (15%)
                      </Label>
                      <Switch
                        checked={vatEnabled}
                        onCheckedChange={setVatEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الخصم (ريال)
                    </Label>
                    <Input
                      type="number"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-12 text-lg"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={generatePurchase}
                    className="flex-1 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isCreating || isUpdating}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {editingPurchase ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
                  </Button>
                  {editingPurchase && (
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="h-14 px-8"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      إلغاء
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Purchase Summary */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-100 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="text-center text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  ملخص الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع الفرعي:</span>
                    <span className="font-bold text-lg">{calculateSubtotal().toLocaleString()} ريال</span>
                  </div>
                  
                  {vatEnabled && (
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>ضريبة القيمة المضافة:</span>
                      <span className="font-bold text-lg text-blue-600">{calculateTax().toLocaleString()} ريال</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم:</span>
                    <span className="font-bold text-lg text-red-600">-{discount.toLocaleString()} ريال</span>
                  </div>
                  
                  <div className="border-t-2 border-green-200 pt-3">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg">
                      <span className="font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي:</span>
                      <span className="font-bold text-xl">{calculateTotal().toLocaleString()} ريال</span>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'check' && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      ملاحظة: سيتم إضافة هذا المبلغ لرصيد المورد في حالة الشراء الآجل
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Purchases */}
        {purchases.length > 0 && (
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                آخر المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.slice(0, 6).map(purchase => (
                  <div key={purchase.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg text-gray-800">{purchase.invoice_number}</p>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {purchase.suppliers?.name || 'غير معروف'}
                          </p>
                          <Badge variant={purchase.payment_method === 'check' ? 'destructive' : 'default'} className="mt-2">
                            {paymentMethods.find(m => m.value === purchase.payment_method)?.label}
                          </Badge>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-green-600">{purchase.total.toLocaleString()} ريال</p>
                          <p className="text-xs text-gray-500">
                            {new Date(purchase.date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setDialogInvoice(purchase); setShowInvoiceDialog(true); }}
                          className="flex-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePrintPurchase(purchase)}
                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editPurchase(purchase)}
                          className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeletePurchase(purchase)}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <SupplierSearchDialog
          open={showSupplierDialog}
          onClose={() => setShowSupplierDialog(false)}
          onSupplierSelect={handleSupplierSelect}
        />

        <InvoiceDialog
          open={showInvoiceDialog}
          onClose={() => setShowInvoiceDialog(false)}
          invoice={dialogInvoice}
          type="purchase"
        />
      </div>
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
