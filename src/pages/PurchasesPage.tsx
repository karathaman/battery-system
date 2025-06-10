import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Search, Plus, Calendar, DollarSign, TrendingUp, Users, Edit, Printer, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SupplierSearchDialog } from "@/components/SupplierSearchDialog";
import { BatteryTypeSelector } from "@/components/BatteryTypeSelector";
import { Purchase, PurchaseItem } from "@/types/purchases";
import { addTransactionToSupplier, removeSupplierTransactionByInvoice } from "@/utils/accountUtils";

// Mock data
const mockPurchases: Purchase[] = [
  {
    id: "1",
    invoiceNumber: "P001",
    date: "2024-01-20",
    supplierId: "S001",
    supplierName: "مورد البطاريات الرئيسي",
    items: [
      { id: "1", batteryType: "AAA", quantity: 100, price: 2.5, total: 250 },
      { id: "2", batteryType: "AA", quantity: 50, price: 3.0, total: 150 }
    ],
    subtotal: 400,
    discount: 20,
    tax: 57,
    total: 437,
    paymentMethod: "آجل",
    status: "مكتملة"
  }
];

const paymentMethods = [
  { value: "آجل", label: "آجل", icon: DollarSign },
  { value: "نقدي", label: "نقدي", icon: DollarSign },
  { value: "تحويل بنكي", label: "تحويل بنكي", icon: DollarSign },
  { value: "شيك", label: "شيك", icon: DollarSign }
];

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: "",
    supplierName: "",
    items: [] as PurchaseItem[],
    discount: 0,
    paymentMethod: "آجل"
  });
  const [currentItem, setCurrentItem] = useState({
    batteryType: "",
    quantity: 0,
    price: 0
  });

  const filteredPurchases = purchases.filter(purchase =>
    purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateNextInvoiceNumber = () => {
    if (purchases.length === 0) return "P001";
    const lastNumber = purchases[purchases.length - 1].invoiceNumber;
    const number = parseInt(lastNumber.slice(1)) + 1;
    return `P${number.toString().padStart(3, '0')}`;
  };

  const handleSupplierSelect = (supplier: { id: string; name: string }) => {
    setSelectedSupplier(supplier);
    setNewPurchase(prev => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: supplier.name
    }));
    setShowSupplierDialog(false);
  };

  const addItemToPurchase = () => {
    if (!currentItem.batteryType || currentItem.quantity <= 0 || currentItem.price <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات الصنف",
        variant: "destructive"
      });
      return;
    }

    const item: PurchaseItem = {
      id: Date.now().toString(),
      batteryType: currentItem.batteryType,
      quantity: currentItem.quantity,
      price: currentItem.price,
      total: currentItem.quantity * currentItem.price
    };

    setNewPurchase(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setCurrentItem({
      batteryType: "",
      quantity: 0,
      price: 0
    });
  };

  const removeItem = (itemId: string) => {
    setNewPurchase(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const calculateTotals = () => {
    const subtotal = newPurchase.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * newPurchase.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.15; // 15% VAT
    const total = afterDiscount + tax;

    return { subtotal, discountAmount, tax, total };
  };

  const handleSavePurchase = () => {
    if (!selectedSupplier || newPurchase.items.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مورد وإضافة أصناف",
        variant: "destructive"
      });
      return;
    }

    const { subtotal, tax, total } = calculateTotals();
    
    const purchase: Purchase = {
      id: Date.now().toString(),
      invoiceNumber: generateNextInvoiceNumber(),
      date: newPurchase.date,
      supplierId: newPurchase.supplierId,
      supplierName: newPurchase.supplierName,
      items: newPurchase.items,
      subtotal,
      discount: newPurchase.discount,
      tax,
      total,
      paymentMethod: newPurchase.paymentMethod,
      status: "مكتملة"
    };

    setPurchases(prev => [...prev, purchase]);

    // Add to supplier account if payment is deferred
    if (newPurchase.paymentMethod === "آجل") {
      addTransactionToSupplier(newPurchase.supplierId, {
        date: purchase.date,
        type: "purchase",
        description: `فاتورة مشتريات رقم ${purchase.invoiceNumber}`,
        amount: total,
        invoiceNumber: purchase.invoiceNumber,
        vatAmount: tax
      });
    }

    // Reset form
    setNewPurchase({
      date: new Date().toISOString().split('T')[0],
      supplierId: "",
      supplierName: "",
      items: [],
      discount: 0,
      paymentMethod: "آجل"
    });
    setSelectedSupplier(null);

    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة فاتورة المشتريات بنجاح",
    });
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setShowEditDialog(true);
  };

  const handlePrintPurchase = (purchase: Purchase) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>فاتورة مشتريات - ${purchase.invoiceNumber}</title>
          <style>
            body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .details { margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            .items-table th { background-color: #f5f5f5; }
            .totals { margin-top: 20px; text-align: right; }
            .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .final-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>فاتورة مشتريات</h1>
            <h2>رقم الفاتورة: ${purchase.invoiceNumber}</h2>
          </div>
          
          <div class="details">
            <p><strong>التاريخ:</strong> ${purchase.date}</p>
            <p><strong>المورد:</strong> ${purchase.supplierName}</p>
            <p><strong>طريقة الدفع:</strong> ${purchase.paymentMethod}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>نوع البطارية</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items.map(item => `
                <tr>
                  <td>${item.batteryType}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)} ريال</td>
                  <td>${item.total.toFixed(2)} ريال</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-line">
              <span>المجموع الفرعي:</span>
              <span>${purchase.subtotal.toFixed(2)} ريال</span>
            </div>
            <div class="total-line">
              <span>الخصم:</span>
              <span>${((purchase.subtotal * purchase.discount) / 100).toFixed(2)} ريال</span>
            </div>
            <div class="total-line">
              <span>الضريبة (15%):</span>
              <span>${purchase.tax.toFixed(2)} ريال</span>
            </div>
            <div class="total-line final-total">
              <span>المجموع النهائي:</span>
              <span>${purchase.total.toFixed(2)} ريال</span>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const handleDeletePurchase = (purchase: Purchase) => {
    // Remove from purchases list
    setPurchases(prev => prev.filter(p => p.id !== purchase.id));
    
    // Remove from supplier account if it was deferred
    if (purchase.paymentMethod === "آجل") {
      removeSupplierTransactionByInvoice(purchase.supplierId, purchase.invoiceNumber);
    }

    toast({
      title: "تم الحذف",
      description: "تم حذف فاتورة المشتريات وتحديث حساب المورد",
    });
  };

  const totals = calculateTotals();

const SupplierSearchDialog = ({ open, onClose, onSupplierSelect }: { open: boolean; onClose: () => void; onSupplierSelect: (supplier: { id: string; name: string }) => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const mockSuppliers = [
    { id: "S001", name: "مورد البطاريات الرئيسي", balance: 5000 },
    { id: "S002", name: "شركة البطاريات الحديثة", balance: -2000 },
    { id: "S003", name: "مورد البطاريات السريعة", balance: 0 },
  ];

  const filteredSuppliers = mockSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            اختيار المورد
          </DialogTitle>
        </DialogHeader>
        
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
                  onSupplierSelect({ id: supplier.id, name: supplier.name });
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
      </DialogContent>
    </Dialog>
  );
};
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            إدارة المشتريات
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن فاتورة مشتريات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-sm"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>
          </div>

          {/* Add New Purchase Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إضافة فاتورة مشتريات جديدة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="date" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</Label>
                <Input
                  type="date"
                  id="date"
                  value={newPurchase.date}
                  onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })}
                />
              </div>
              
                            <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSupplierDialog(true)}
                  className="w-full flex items-center justify-between"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <span>{selectedSupplier ? selectedSupplier.name : "اختر المورد"}</span>
                  <Search className="w-4 h-4" />
                </Button>
                {selectedSupplier && (
                  <p className={`text-sm font-bold ${selectedSupplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    الرصيد: {selectedSupplier.balance.toLocaleString()} ريال
                  </p>
                )}
              
                <SupplierSearchDialog
                  open={showSupplierDialog}
                  onClose={() => setShowSupplierDialog(false)}
                  onSupplierSelect={(supplier) => {
                    setSelectedSupplier(supplier);
                    setShowSupplierDialog(false);
                  }}
                />
              </div>

                                                        <div>
                              <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                {paymentMethods.map(method => {
                                  const Icon = method.icon;
                                  return (
                                    <Button
                                      key={method.value}
                                      variant={newPurchase.paymentMethod === method.value ? "default" : "outline"}
                                      onClick={() => setNewPurchase({ ...newPurchase, paymentMethod: method.value })}
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
            </div>

            {/* Add Items */}
                       <div>
              <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>أصناف الفاتورة</Label>
              <div className="space-y-3 mt-2">
                {newPurchase.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <BatteryTypeSelector
                        value={item.batteryType}
                        onChange={(value) => {
                          const updatedItems = [...newPurchase.items];
                          updatedItems[index].batteryType = value;
                          setNewPurchase({ ...newPurchase, items: updatedItems });
                        }}
                        placeholder="اختر نوع البطارية"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="الكمية"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const updatedItems = [...newPurchase.items];
                          updatedItems[index].quantity = Number(e.target.value) || 0;
                          updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
                          setNewPurchase({ ...newPurchase, items: updatedItems });
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="السعر"
                        value={item.price || ''}
                        onChange={(e) => {
                          const updatedItems = [...newPurchase.items];
                          updatedItems[index].price = Number(e.target.value) || 0;
                          updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
                          setNewPurchase({ ...newPurchase, items: updatedItems });
                        }}
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
                        onClick={() => {
                          const updatedItems = newPurchase.items.filter((_, i) => i !== index);
                          setNewPurchase({ ...newPurchase, items: updatedItems });
                        }}
                        disabled={newPurchase.items.length === 1}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  const newItem: PurchaseItem = {
                    id: Date.now().toString(),
                    batteryType: "",
                    quantity: 0,
                    price: 0,
                    total: 0,
                  };
                  setNewPurchase({ ...newPurchase, items: [...newPurchase.items, newItem] });
                }}
                variant="outline"
                className="mt-3 w-full flex items-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Plus className="w-4 h-4" />
                إضافة صنف
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{purchases.length}</p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي المشتريات
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">
                  {purchases.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي القيمة
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">
                  {purchases.reduce((sum, p) => sum + p.tax, 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي الضريبة
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>قائمة المشتريات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الفاتورة</th>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>المورد</th>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع</th>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</th>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الحالة</th>
                  <th className="p-3 text-right font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{purchase.invoiceNumber}</td>
                    <td className="p-3">{purchase.date}</td>
                    <td className="p-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>{purchase.supplierName}</td>
                    <td className="p-3 font-bold text-green-600">{purchase.total.toFixed(2)} ريال</td>
                    <td className="p-3">
                      <Badge variant={purchase.paymentMethod === "آجل" ? "secondary" : "default"}>{purchase.paymentMethod}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="default">{purchase.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPurchase(purchase)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePrintPurchase(purchase)}
                        >
                          <Printer className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePurchase(purchase)}
                        >
                          <Trash2 className="w-3 h-3" />
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

      <SupplierSearchDialog
        open={showSupplierDialog}
        onClose={() => setShowSupplierDialog(false)}
        onSupplierSelect={handleSupplierSelect}
      />

      {/* Edit Purchase Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
              تعديل فاتورة المشتريات - {editingPurchase?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {editingPurchase && (
            <div className="space-y-4">
              <p className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                سيتم إضافة ميزة التعديل قريباً 
              </p>
              <Button onClick={() => setShowEditDialog(false)}>
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
