import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, Plus, Search, Printer, Edit, Trash2, Banknote, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBatteryTypes } from "@/hooks/useBatteryTypes";
import { ExtendedSale, SaleFormData } from "@/services/salesService";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { CustomerSearchDialog } from "@/components/CustomerSearchDialog";

interface SaleItem {
  id: string;
  batteryType: string;
  batteryTypeId: string;
  quantity: number;
  price: number;
  total: number;
}

const paymentMethods = [
  { value: "cash", label: "نقداً", icon: Banknote },
  { value: "credit", label: "آجل", icon: CreditCard }
];

interface Customer {
  id: string;
  name: string;
  phone: string;
  customer_code: string;
  balance: number;
  total_sales: number;
  total_amount: number;
  average_price: number;
  is_blocked: boolean;
}

const SalesPage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { id: "1", batteryType: "", batteryTypeId: "", quantity: 0, price: 0, total: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [editingSale, setEditingSale] = useState<ExtendedSale | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [dialogInvoice, setDialogInvoice] = useState<any>(null);

  const { sales, createSale, updateSale, deleteSale, isCreating, isUpdating, isDeleting } = useSales();
  const { batteryTypes, isLoading: batteryTypesLoading } = useBatteryTypes();

  const addSaleItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      batteryType: "",
      batteryTypeId: "",
      quantity: 0,
      price: 0,
      total: 0
    };
    setSaleItems([...saleItems, newItem]);
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...saleItems];
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

  const resetForm = () => {
    setSelectedCustomer(null);
    setSaleItems([{ id: "1", batteryType: "", batteryTypeId: "", quantity: 0, price: 0, total: 0 }]);
    setDiscount(0);
    setPaymentMethod("cash");
    setVatEnabled(false);
    setEditingSale(null);
  };

  const generateSale = async () => {
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
      invoiceNumber: "",
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      subtotal: calculateSubtotal(),
      discount,
      tax: calculateTax(),
      total: calculateTotal(),
      paymentMethod: paymentMethod as "cash" | "credit",
      status: "completed",
      items: saleItems.map(item => ({
        batteryTypeId: item.batteryTypeId,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
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
    const customer: Customer = {
      id: sale.customerId,
      name: sale.customerName || 'غير معروف',
      phone: '',
      customer_code: '',
      balance: 0,
      total_sales: 0,
      total_amount: 0,
      average_price: 0,
      is_blocked: false
    };
    setSelectedCustomer(customer);
    
    setSaleItems(sale.items || []);
    setDiscount(sale.discount);
    setPaymentMethod(sale.paymentMethod);
    setVatEnabled(sale.tax > 0);
  };

  const handleDeleteSale = (sale: ExtendedSale) => {
    deleteSale(sale.id);
  };

  const handlePrintSale = (sale: ExtendedSale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة بيع رقم ${sale.invoiceNumber}</title>
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
          <h1>فاتورة مبيعات رقم ${sale.invoiceNumber}</h1>
        </div>
        
        <div class="invoice-details">
          <div><strong>التاريخ:</strong> ${new Date(sale.date).toLocaleDateString('ar-SA')}</div>
          <div><strong>العميل:</strong> ${sale.customerName || 'غير معروف'}</div>
          <div><strong>طريقة الدفع:</strong> ${sale.paymentMethod === 'credit' ? 'آجل' : 'نقداً'}</div>
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
            ${(sale.items || []).map((item: any) => `
              <tr>
                <td>${item.batteryType || 'غير معروف'}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toLocaleString()} ريال</td>
                <td>${item.total.toLocaleString()} ريال</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>المجموع الفرعي: ${sale.subtotal.toLocaleString()} ريال</div>
          ${sale.tax > 0 ? `<div>ضريبة القيمة المضافة (15%): ${sale.tax.toLocaleString()} ريال</div>` : ''}
          ${sale.discount > 0 ? `<div>الخصم: -${sale.discount.toLocaleString()} ريال</div>` : ''}
          <div class="total-final">الإجمالي: ${sale.total.toLocaleString()} ريال</div>
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

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      customer_code: customer.customerCode || '',
      balance: 0,
      total_sales: 0,
      total_amount: 0,
      average_price: 0,
      is_blocked: false
    });
    setShowCustomerDialog(false);
  };

  const handleAddCustomer = (initialName: string) => {
    console.log("Add customer called with name:", initialName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-green-700 to-teal-600 p-6">
            <div className="flex items-center justify-center gap-3">
              <ShoppingBag className="w-8 h-8 text-white" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {editingSale ? `تعديل فاتورة ${editingSale.invoiceNumber}` : 'نظام المبيعات'}
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Form Section */}
          <div className="xl:col-span-3 space-y-6">
            {/* Customer Selection Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  اختيار العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Button 
                  variant="outline" 
                  className="w-full h-14 flex items-center gap-3 text-right border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200"
                  onClick={() => setShowCustomerDialog(true)}
                >
                  <Search className="w-5 h-5 text-gray-500" />
                  <span className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedCustomer ? selectedCustomer.name : "اختر العميل"}
                  </span>
                </Button>
                
                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {selectedCustomer.name}
                        </h3>
                        <p className="text-gray-600">{selectedCustomer.phone}</p>
                        <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-800">
                          {selectedCustomer.customer_code}
                        </Badge>
                      </div>
                      <div className="text-left">
                        <p className={`text-xl font-bold ${selectedCustomer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedCustomer.balance.toLocaleString()} ريال
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
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
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
                      {saleItems.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="w-1/3">
                            <Select
                              value={item.batteryTypeId}
                              onValueChange={(value) => updateSaleItem(index, 'batteryTypeId', value)}
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
                              onChange={(e) => updateSaleItem(index, 'quantity', Number(e.target.value) || 0)}
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="السعر"
                              value={item.price || ''}
                              onChange={(e) => updateSaleItem(index, 'price', Number(e.target.value) || 0)}
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
                              onClick={() => removeSaleItem(index)}
                              disabled={saleItems.length === 1}
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
                  onClick={addSaleItem}
                  variant="outline"
                  className="mt-4 w-full h-12 border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة صنف جديد
                </Button>
              </CardContent>
            </Card>

            {/* Payment & Settings Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
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
                    onClick={generateSale}
                    className="flex-1 h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    disabled={isCreating || isUpdating}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {editingSale ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
                  </Button>
                  {editingSale && (
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
            {/* Sale Summary */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-teal-100 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
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
                  
                  <div className="border-t-2 border-emerald-200 pt-3">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow-lg">
                      <span className="font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي:</span>
                      <span className="font-bold text-xl">{calculateTotal().toLocaleString()} ريال</span>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'credit' && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      ملاحظة: سيتم إضافة هذا المبلغ لرصيد العميل في حالة البيع الآجل
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sales */}
        {sales.length > 0 && (
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                آخر المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sales.slice(0, 6).map(sale => (
                  <div key={sale.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg text-gray-800">{sale.invoiceNumber}</p>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {sale.customerName || 'غير معروف'}
                          </p>
                          <Badge variant={sale.paymentMethod === 'credit' ? 'destructive' : 'default'} className="mt-2">
                            {paymentMethods.find(m => m.value === sale.paymentMethod)?.label}
                          </Badge>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-green-600">{sale.total.toLocaleString()} ريال</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setDialogInvoice(sale); setShowInvoiceDialog(true); }}
                          className="flex-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePrintSale(sale)}
                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editSale(sale)}
                          className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteSale(sale)}
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
        <CustomerSearchDialog
          open={showCustomerDialog}
          onClose={() => setShowCustomerDialog(false)}
          onCustomerSelect={handleCustomerSelect}
        />

        <InvoiceDialog
          open={showInvoiceDialog}
          onClose={() => setShowInvoiceDialog(false)}
          invoice={dialogInvoice}
          type="sale"
        />
      </div>
    </div>
  );
};

export default SalesPage;
