
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Plus, Search, CreditCard, Banknote, Smartphone, Calendar, Printer, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Sale, SaleItem } from "@/types/sales";
import { printInvoice } from "@/utils/printUtils";
import { addTransactionToCustomer, updateCustomerBalance, removeCustomerTransaction } from "@/utils/accountUtils";
import { CustomerSearchDialog } from "@/components/CustomerSearchDialog";
import { Customer } from "@/types";

const batteryTypes = [
  "بطاريات عادية",
  "بطاريات جافة",
  "بطاريات زجاج",
  "بطاريات تعبئة",
  "رصاص"
];

const paymentMethods = [
  { value: "cash", label: "نقداً", icon: Banknote },
  { value: "card", label: "بطاقة", icon: CreditCard },
  { value: "transfer", label: "تحويل", icon: Smartphone },
  { value: "credit", label: "آجل", icon: Calendar }
];

const SalesPage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { id: "1", batteryType: "بطاريات عادية", quantity: 0, price: 0, total: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);

  const addSaleItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      batteryType: "بطاريات عادية",
      quantity: 0,
      price: 0,
      total: 0
    };
    setSaleItems([...saleItems, newItem]);
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
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

  const editSale = (sale: Sale) => {
    setEditingSale(sale);
    // Note: We would need to find the customer by ID from the database
    // For now, we'll create a minimal customer object
    const customer: Customer = {
      id: sale.customerId,
      customerCode: `C${sale.customerId.substring(0, 3).toUpperCase()}`,
      name: sale.customerName,
      phone: '',
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
    setSelectedCustomer(customer);
    setSaleItems([...sale.items]);
    setDiscount(sale.discount);
    setPaymentMethod(sale.paymentMethod);
    setVatEnabled(sale.tax > 0);
  };

  const updateSale = () => {
    if (!editingSale || !selectedCustomer) return;

    const updatedSale: Sale = {
      ...editingSale,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: [...saleItems],
      subtotal: calculateSubtotal(),
      discount,
      tax: calculateTax(),
      total: calculateTotal(),
      paymentMethod,
    };

    setRecentSales(recentSales.map(sale => 
      sale.id === editingSale.id ? updatedSale : sale
    ));

    toast({
      title: "تم تحديث الفاتورة",
      description: `تم تحديث فاتورة رقم ${editingSale.invoiceNumber} بنجاح`,
      duration: 2000,
    });

    // Reset form
    setEditingSale(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSaleItems([{ id: "1", batteryType: "بطاريات عادية", quantity: 0, price: 0, total: 0 }]);
    setDiscount(0);
    setPaymentMethod("cash");
    setVatEnabled(false);
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

    if (saleItems.some(item => !item.quantity || !item.price)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات الأصناف",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const newSale: Sale = {
      id: Date.now().toString(),
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: [...saleItems],
      subtotal: calculateSubtotal(),
      discount,
      tax: calculateTax(),
      total: calculateTotal(),
      paymentMethod,
      status: "completed"
    };

    // Add to recent sales
    setRecentSales([newSale, ...recentSales]);

    // Handle customer balance and account statement for credit sales
    if (paymentMethod === 'credit') {
      addTransactionToCustomer(selectedCustomer.id, {
        date: newSale.date,
        type: 'sale',
        description: `فاتورة مبيعات رقم ${invoiceNumber}`,
        amount: newSale.total,
        invoiceNumber,
        vatAmount: newSale.tax
      });
    }

    toast({
      title: "تم إنشاء الفاتورة",
      description: `تم إنشاء فاتورة رقم ${invoiceNumber} بنجاح`,
      duration: 2000,
    });

    // Reset form
    resetForm();
  };

  const handleDeleteSale = (sale: Sale) => {
    // Remove from recent sales
    setRecentSales(prev => prev.filter(s => s.id !== sale.id));
    
    // Remove transaction from customer account if it was a credit sale
    if (sale.paymentMethod === 'credit') {
      // Find the transaction and remove it
      removeCustomerTransaction(sale.customerId, sale.id);
    }

    toast({
      title: "تم حذف الفاتورة",
      description: `تم حذف فاتورة رقم ${sale.invoiceNumber} وتحديث الحساب`,
      duration: 2000,
    });
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(false);
  };

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
                          value={item.batteryType}
                          onValueChange={(value) => updateSaleItem(index, 'batteryType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {batteryTypes.map(type => (
                              <SelectItem key={type} value={type} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {type}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
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
                  onClick={editingSale ? updateSale : generateInvoice}
                  className="flex-1"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {editingSale ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
                </Button>
                {editingSale && (
                  <Button
                    onClick={() => {
                      setEditingSale(null);
                      resetForm();
                    }}
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

        {/* Invoice Summary */}
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

          {/* Recent Sales */}
          {recentSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  آخر المبيعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSales.slice(0, 5).map(sale => (
                    <div key={sale.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{sale.invoiceNumber}</p>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {sale.customerName}
                          </p>
                          <Badge variant={sale.paymentMethod === 'credit' ? 'destructive' : 'default'} className="text-xs mt-1">
                            {paymentMethods.find(m => m.value === sale.paymentMethod)?.label}
                          </Badge>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-green-600">{sale.total.toLocaleString()} ريال</p>
                          <div className="flex gap-1 mt-1">
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
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeleteSale(sale)}
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
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

      {/* Customer Search Dialog */}
      <CustomerSearchDialog
        open={showCustomerDialog}
        onClose={() => setShowCustomerDialog(false)}
        onSelectCustomer={handleCustomerSelect}
        language="ar"
      />
    </div>
  );
};

export default SalesPage;
