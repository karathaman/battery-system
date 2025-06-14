
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Search, Plus, Calendar, DollarSign, TrendingUp, Users, Edit, Printer, Trash2, Banknote, CreditCard, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SupplierSearchDialog } from "@/components/SupplierSearchDialog";
import { BatteryTypeSelector } from "@/components/BatteryTypeSelector";
import { Purchase, PurchaseItem } from "@/types/purchases";
import { addTransactionToSupplier, removeSupplierTransactionByInvoice } from "@/utils/accountUtils";
import { useEffect, useState } from "react"; 
import { supabase } from "@/integrations/supabase/client";
import { error } from "console";
      

const paymentMethodMap: Record<string, "cash" | "card" | "bank_transfer" | "check"> = {
  "نقداً": "cash",
  "بطاقة": "card",
  "تحويل": "bank_transfer",
  "آجل": "check"
};

const statusMap: Record<string, "pending" | "completed" | "cancelled"> = {
  "قيد الانتظار": "pending",
  "مكتملة": "completed",
  "ملغاة": "cancelled"
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
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

  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    name: string;
    balance: number;
    total_purchases: number;
    total_amount: number;
  } | null>(null);

  const filteredPurchases = purchases.filter(purchase =>
    purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  const handleSupplierSelect = (supplier: { id: string; name: string; balance: number; total_purchases: number; total_amount: number }) => {
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
    const tax = afterDiscount * 0.15; // ضريبة القيمة المضافة 15%
    const total = afterDiscount + tax;

    return { subtotal, discountAmount, tax, total };
  };

  const fetchBatteryTypeId = async (batteryTypeName: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("battery_types")
      .select("id")
      .eq("name", batteryTypeName)
      .single();

    if (error) {
      console.error("خطأ أثناء جلب معرف نوع البطارية:", error);
      return null;
    }

    return data?.id || null;
  };


  const generateNextInvoiceNumber = async () => {
    const { data: purchases, error } = await supabase
      .from("purchases")
      .select("invoice_number");

    if (error) {
      console.error("خطأ أثناء جلب أرقام الفواتير:", error);
      return "P001";
    }

    const existingNumbers = purchases.map(p => p.invoice_number);
    let nextNumber = 1;

    while (existingNumbers.includes(`P${nextNumber.toString().padStart(3, '0')}`)) {
      nextNumber++;
    }

    return `P${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleSavePurchase = async () => {
    try {
      console.log("بدء عملية حفظ الفاتورة...");
  
      if (!selectedSupplier || newPurchase.items.length === 0) {
        console.error("خطأ: لم يتم اختيار المورد أو إضافة أصناف.");
        toast({
          title: "خطأ",
          description: "يرجى اختيار مورد وإضافة أصناف",
          variant: "destructive"
        });
        return;
      }
  
      console.log("المورد المحدد:", selectedSupplier);
      console.log("الأصناف:", newPurchase.items);
  
      const { subtotal, tax, total } = calculateTotals();
      console.log("المجموع الفرعي:", subtotal, "الضريبة:", tax, "الإجمالي:", total);
  
      const invoiceNumber = await generateNextInvoiceNumber();
      console.log("رقم الفاتورة الجديد:", invoiceNumber);
  
      const purchase = {
        invoice_number: invoiceNumber,
        date: newPurchase.date,
        supplier_id: newPurchase.supplierId,
        subtotal,
        discount: newPurchase.discount,
        tax,
        total,
        payment_method: paymentMethodMap[newPurchase.paymentMethod] ?? "cash",
        status: statusMap["مكتملة"],
      };
  
      console.log("بيانات الفاتورة:", purchase);
  
      const { data: insertedPurchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert(purchase)
        .select("id")
        .single();
  
      if (purchaseError) {
        console.error("خطأ أثناء حفظ الفاتورة:", purchaseError);
        toast({
          title: "خطأ",
          description: purchaseError.message || "حدث خطأ أثناء حفظ الفاتورة",
          variant: "destructive"
        });
        return;
      }
  
      console.log("تم حفظ الفاتورة بنجاح:", insertedPurchase);
  
      const purchaseId = insertedPurchase.id;
  
      const purchaseItems = await Promise.all(
        newPurchase.items.map(async (item) => {
          const batteryTypeId = await fetchBatteryTypeId(item.batteryType);
          if (!batteryTypeId) {
            throw new Error(`نوع البطارية "${item.batteryType}" غير موجود`);
          }
  
          console.log("تم جلب معرف نوع البطارية:", batteryTypeId);
  
          return {
            purchase_id: purchaseId,
            battery_type_id: batteryTypeId,
            quantity: item.quantity,
            price_per_kg: item.price,
            total: item.total
          };
        })
      );
  
      console.log("بيانات أصناف الفاتورة:", purchaseItems);
  
      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems);
  
      if (itemsError) {
        console.error("خطأ أثناء حفظ أصناف الفاتورة:", itemsError);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حفظ أصناف الفاتورة",
          variant: "destructive"
        });
        return;
      }
  
      console.log("تم حفظ أصناف الفاتورة بنجاح.");
  
      setPurchases((prev) => [
        ...prev,
        {
          id: purchaseId,
          invoiceNumber: invoiceNumber,
          date: newPurchase.date,
          supplierId: newPurchase.supplierId,
          supplierName: selectedSupplier?.name || "",
          items: newPurchase.items,
          subtotal,
          discount: newPurchase.discount,
          tax,
          total,
          paymentMethod: newPurchase.paymentMethod,
          status: "مكتملة",
        },
      ]);
  
      console.log("تم تحديث حالة المشتريات في واجهة المستخدم.");
  
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة فاتورة المشتريات وتحديث بيانات المورد بنجاح",
      });
    } catch (err) {
      console.error("خطأ غير متوقع:", err);
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ غير متوقع أثناء حفظ الفاتورة",
        variant: "destructive"
      });
    }
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
 
  const handleDeletePurchase = async (purchase: Purchase) => {
    try {
      // حذف الفاتورة من قاعدة البيانات
      const { error: deletePurchaseError } = await supabase
        .from("purchases")
        .delete()
        .eq("id", purchase.id);
  
      if (deletePurchaseError) {
        throw new Error("حدث خطأ أثناء حذف الفاتورة من قاعدة البيانات");
      }
  
      // حذف الأصناف المرتبطة بالفاتورة من قاعدة البيانات
      const { error: deleteItemsError } = await supabase
        .from("purchase_items")
        .delete()
        .eq("purchase_id", purchase.id);
  
      if (deleteItemsError) {
        throw new Error("حدث خطأ أثناء حذف أصناف الفاتورة من قاعدة البيانات");
      }
  
      // تحديث حالة المورد إذا كانت طريقة الدفع "آجل"
      if (purchase.paymentMethod === "آجل") {
        const { data: supplierData, error: fetchSupplierError } = await supabase
          .from("suppliers")
          .select("balance, total_purchases, total_amount")
          .eq("id", purchase.supplierId)
          .single();
  
        if (fetchSupplierError) {
          throw new Error("حدث خطأ أثناء جلب بيانات المورد");
        }
  
        const updatedBalance = (supplierData?.balance || 0) - purchase.total;
        const updatedTotalPurchases = (supplierData?.total_purchases || 0) - purchase.items.reduce((sum, item) => sum + item.quantity, 0);
        const updatedTotalAmount = (supplierData?.total_amount || 0) - purchase.total;
  
        const { error: updateSupplierError } = await supabase
          .from("suppliers")
          .update({
            balance: updatedBalance,
            total_purchases: updatedTotalPurchases,
            total_amount: updatedTotalAmount,
          })
          .eq("id", purchase.supplierId);
  
        if (updateSupplierError) {
          throw new Error("حدث خطأ أثناء تحديث بيانات المورد");
        }
      }
  
      // إزالة الفاتورة من واجهة المستخدم
      setPurchases((prev) => prev.filter((p) => p.id !== purchase.id));
  
      toast({
        title: "تم الحذف",
        description: "تم حذف فاتورة المشتريات وتحديث حساب المورد بنجاح",
      });
    } catch (err) {
      console.error(err.message);
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ غير متوقع أثناء حذف الفاتورة",
        variant: "destructive",
      });
    }
  };

const fetchSuppliers = async () => {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, balance, total_purchases, total_amount");

  if (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }

  return data;
};

  const totals = calculateTotals();

  const LocalSupplierSearchDialog = ({ open, onClose, onSupplierSelect }: { open: boolean; onClose: () => void; onSupplierSelect: (supplier: { id: string; name: string; balance: number; total_purchases: number; total_amount: number }) => void }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState<{ id: string; name: string; balance: number; total_purchases: number; total_amount: number }[]>([]);
  
    useEffect(() => {
      fetchSuppliers().then(setSuppliers); // جلب قائمة الموردين من قاعدة البيانات
    }, []);
  
    const filteredSuppliers = suppliers.filter(supplier =>
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
                    onSupplierSelect(supplier); // تمرير UUID الخاص بالمورد
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


      const fetchPurchases = async () => {
        const { data: purchases, error: purchasesError } = await supabase
          .from("purchases")
          .select("id, invoice_number, date, supplier_id, subtotal, discount, tax, total, payment_method, status");
      
        if (purchasesError) {
          console.error("Error fetching purchases:", purchasesError);
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء جلب الفواتير",
            variant: "destructive"
          });
          return [];
        }
      
        const purchasesWithDetails = await Promise.all(
          purchases.map(async (purchase) => {
            // جلب اسم المورد
            const { data: supplier, error: supplierError } = await supabase
              .from("suppliers")
              .select("name")
              .eq("id", purchase.supplier_id)
              .single();
      
            if (supplierError) {
              console.error(`Error fetching supplier name for supplier_id ${purchase.supplier_id}:`, supplierError);
            }
      
            // جلب الأصناف المرتبطة بالفاتورة
            const { data: items, error: itemsError } = await supabase
              .from("purchase_items")
              .select("id, battery_type_id, quantity, price_per_kg, total")
              .eq("purchase_id", purchase.id);
      
            if (itemsError) {
              console.error(`Error fetching items for purchase_id ${purchase.id}:`, itemsError);
            }
      
            // تحويل بيانات الأصناف لجلب اسم نوع البطارية
            const itemsWithBatteryType = await Promise.all(
              items.map(async (item) => {
                const { data: batteryType, error: batteryTypeError } = await supabase
                  .from("battery_types")
                  .select("name")
                  .eq("id", item.battery_type_id)
                  .single();
      
                if (batteryTypeError) {
                  console.error(`Error fetching battery type for battery_type_id ${item.battery_type_id}:`, batteryTypeError);
                }
      
                return {
                  id: item.id,
                  batteryType: batteryType?.name || "غير معروف",
                  quantity: item.quantity,
                  price: item.price_per_kg,
                  total: item.total,
                };
              })
            );
      
            return {
              id: purchase.id,
              invoiceNumber: purchase.invoice_number,
              date: purchase.date,
              supplierId: purchase.supplier_id,
              supplierName: supplier?.name || "غير معروف",
              items: itemsWithBatteryType,
              subtotal: purchase.subtotal,
              discount: purchase.discount,
              tax: purchase.tax,
              total: purchase.total,
              paymentMethod: purchase.payment_method,
              status: purchase.status,
            };
          })
        );
      
        return purchasesWithDetails;
      };

     useEffect(() => {
      const loadPurchases = async () => {
        const data = await fetchPurchases();
        setPurchases(data);
      };
    
      loadPurchases();
    }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-[#eff6ff] text-gray-600">
          <div className="flex justify-center">
            <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إدارة المشتريات
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">


          {/* Add New Purchase Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إضافة فاتورة مشتريات جديدة
            </h3>

            <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
              {/* تاريخ الفاتورة */}
              <div className="flex-4">
                <Label htmlFor="date" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  التاريخ
                </Label>
                <Input
                  type="date"
                  id="date"
                  value={newPurchase.date}
                  onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })}
                />
              </div>

              {/* اختيار المورد */}
              <div className="flex-1 flex flex-col">
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  اختر المورد
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    onClick={() => setShowSupplierDialog(true)}
                    className="flex-1 flex items-center justify-between"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <span>
                      {selectedSupplier ? selectedSupplier.name : "اختر المورد"}
                    </span>
                    <Search className="w-4 h-4" />
                  </Button>
                  {selectedSupplier && (
                    <span
                      className={`text-sm font-bold whitespace-nowrap ${selectedSupplier.balance >= 0
                        ? "text-green-600 bg-green-100 py-2 px-6 rounded"
                        : "text-red-600 bg-red-100 py-2 px-6 rounded"
                        }`}
                    >
                      الرصيد: {selectedSupplier.balance.toLocaleString()} ريال
                    </span>
                  )}
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

            <div>
              <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {[
                    { value: "نقداً", label: "نقداً", icon: DollarSign },
                    { value: "بطاقة", label: "بطاقة", icon: CreditCard },
                    { value: "تحويل", label: "تحويل", icon: Banknote },
                    { value: "آجل", label: "آجل", icon: Smartphone }
                  ].map(method => {
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
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                ملخص الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع الفرعي:</span>
                <span className="font-bold">{totals.subtotal.toLocaleString()} ريال</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم:</span>
                <span className="font-bold text-red-600">-{totals.discountAmount.toLocaleString()} ريال</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>ضريبة القيمة المضافة (15%):</span>
                <span className="font-bold">{totals.tax.toLocaleString()} ريال</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي:</span>
                  <span className="font-bold text-green-600">{totals.total.toLocaleString()} ريال</span>
                </div>
              </div>
              {newPurchase.paymentMethod === 'credit' && (
                <div className="bg-yellow-50 p-3 rounded border">
                  <p className="text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ملاحظة: سيتم إضافة هذا المبلغ لرصيد المورد في حالة الشراء الآجل
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 ">
            <Button
              onClick={handleSavePurchase}
              className="flex-1 bg-green-600 "
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              إنشاء الفاتورة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <Card>
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-5 gap-4 mb-6">
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
              <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-8 h-8 mx-auto mb-2" />
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
        <div className="mb-6 px-5  ">
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

      <LocalSupplierSearchDialog
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
            <EditPurchaseForm
              purchase={editingPurchase}
              onSave={(updatedPurchase) => {
                setPurchases((prev) =>
                  prev.map((p) => (p.id === updatedPurchase.id ? updatedPurchase : p))
                );
                setShowEditDialog(false);
                toast({
                  title: "تم التعديل",
                  description: "تم تعديل فاتورة المشتريات بنجاح",
                });
              }}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Form Component */}
      {/* Place this outside the PurchasesPage component */}
      {/* --- */}
    </div>
  );
};

// EditPurchaseForm component definition
type EditPurchaseFormProps = {
  purchase: Purchase;
  onSave: (updatedPurchase: Purchase) => void;
  onCancel: () => void;
};

const EditPurchaseForm = ({ purchase, onSave, onCancel }: EditPurchaseFormProps) => {
  const [editedPurchase, setEditedPurchase] = useState<Purchase>({ ...purchase });

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...editedPurchase.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      total:
        field === "quantity" || field === "price"
          ? (field === "quantity" ? value : updatedItems[index].quantity) *
          (field === "price" ? value : updatedItems[index].price)
          : updatedItems[index].total,
    };
    setEditedPurchase({ ...editedPurchase, items: updatedItems });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = editedPurchase.items.filter((_, i) => i !== index);
    setEditedPurchase({ ...editedPurchase, items: updatedItems });
  };

  const handleSave = async () => {
    try {
      console.log("بدء عملية حفظ التعديلات...");
  
      // حساب الإجمالي الجديد
      const subtotal = editedPurchase.items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = (subtotal * editedPurchase.discount) / 100;
      const afterDiscount = subtotal - discountAmount;
      const tax = afterDiscount * 0.15;
      const total = afterDiscount + tax;
  
      console.log("الإجماليات المحسوبة:", { subtotal, discountAmount, tax, total });
  
      // حساب الفرق بين الإجمالي القديم والجديد
      const totalDifference = total - purchase.total;
      console.log("الفرق بين الإجمالي القديم والجديد:", totalDifference);
  
      // تحديث جدول الموردين إذا كانت طريقة الدفع "آجل"
      if (editedPurchase.paymentMethod === "آجل") {
        console.log("تحديث بيانات المورد...");
        const { data: supplierData, error: fetchError } = await supabase
          .from("suppliers")
          .select("balance, total_purchases, total_amount, last_purchase")
          .eq("id", editedPurchase.supplierId)
          .single();
  
        if (fetchError) {
          console.error("خطأ أثناء جلب بيانات المورد:", fetchError);
          throw new Error("حدث خطأ أثناء جلب بيانات المورد");
        }
  
        console.log("بيانات المورد الحالية:", supplierData);
  
        const updatedBalance = (supplierData?.balance || 0) + totalDifference;
        const updatedTotalPurchases = (supplierData?.total_purchases || 0) + editedPurchase.items.reduce((sum, item) => sum + item.quantity, 0) - purchase.items.reduce((sum, item) => sum + item.quantity, 0);
        const updatedTotalAmount = (supplierData?.total_amount || 0) + totalDifference;
        const updatedLastPurchase = editedPurchase.date;
  
        console.log("القيم المحدثة للمورد:", {
          updatedBalance,
          updatedTotalPurchases,
          updatedTotalAmount,
          updatedLastPurchase,
        });
  
        const { error: updateSupplierError } = await supabase
          .from("suppliers")
          .update({
            balance: updatedBalance,
            total_purchases: updatedTotalPurchases,
            total_amount: updatedTotalAmount,
            last_purchase: updatedLastPurchase,
          })
          .eq("id", editedPurchase.supplierId);
  
        if (updateSupplierError) {
          console.error("خطأ أثناء تحديث بيانات المورد:", updateSupplierError);
          throw new Error("حدث خطأ أثناء تحديث بيانات المورد");
        }
  
        console.log("تم تحديث بيانات المورد بنجاح.");
      }
  
      // تحديث الكميات في جدول أنواع البطاريات
      console.log("تحديث الكميات في جدول أنواع البطاريات...");
      await Promise.all(
        purchase.items.map(async (oldItem) => {
          const newItem = editedPurchase.items.find((item) => item.id === oldItem.id);
          if (!newItem) return;
  
          const quantityDifference = newItem.quantity - oldItem.quantity;
          console.log(`الفرق في الكمية لنوع البطارية "${newItem.batteryType}":`, quantityDifference);
  
          const { data: batteryData, error: fetchError } = await supabase
            .from("battery_types")
            .select("currentQty")
            .eq("name", newItem.batteryType)
            .single();
  
          if (fetchError) {
            console.error(`خطأ أثناء جلب الكمية لنوع البطارية "${newItem.batteryType}":`, fetchError);
            throw new Error(`حدث خطأ أثناء جلب الكمية لنوع البطارية "${newItem.batteryType}"`);
          }
  
          console.log(`الكمية الحالية لنوع البطارية "${newItem.batteryType}":`, batteryData?.currentQty);
  
          const updatedQty = (batteryData?.currentQty || 0) + quantityDifference;
  
          const { error: updateError } = await supabase
            .from("battery_types")
            .update({ currentQty: updatedQty })
            .eq("name", newItem.batteryType);
  
          if (updateError) {
            console.error(`خطأ أثناء تحديث الكمية لنوع البطارية "${newItem.batteryType}":`, updateError);
            throw new Error(`حدث خطأ أثناء تحديث الكمية لنوع البطارية "${newItem.batteryType}"`);
          }
  
          console.log(`تم تحديث الكمية لنوع البطارية "${newItem.batteryType}" بنجاح.`);
        })
      );
  
      // تحديث الفاتورة في قاعدة البيانات
      console.log("تحديث الفاتورة في قاعدة البيانات...");
      const { error: updatePurchaseError } = await supabase
        .from("purchases")
        .update({
          subtotal,
          discount: editedPurchase.discount,
          tax,
          total,
          payment_method: paymentMethodMap[editedPurchase.paymentMethod] ?? "cash",
          status: "completed",
        })
        .eq("id", editedPurchase.id);
  
      if (updatePurchaseError) {
        console.error("خطأ أثناء تحديث الفاتورة:", updatePurchaseError);
        throw new Error("حدث خطأ أثناء تحديث الفاتورة");
      }
  
      console.log("تم تحديث الفاتورة بنجاح.");
  
      // تحديث الحالة في واجهة المستخدم
      onSave({
        ...editedPurchase,
        subtotal,
        tax,
        total,
        status: "مكتملة",
      });
  
      toast({
        title: "تم التعديل",
        description: "تم تعديل الفاتورة وتحديث بيانات المورد بنجاح",
      });
    } catch (err) {
      console.error("خطأ غير متوقع:", err.message);
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ غير متوقع أثناء تعديل الفاتورة",
        variant: "destructive",
      });
    }
  };
  
 
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
        <div className="flex-4">
          <Label htmlFor="date" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      التاريخ
          </Label>
          <Input
            type="date"
            id="date"
            value={editedPurchase.date}
            onChange={(e) => setEditedPurchase({ ...editedPurchase, date: e.target.value })}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>
            اسم المورد
          </Label>
          <Input
            value={editedPurchase.supplierName}
            disabled
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          />
        </div>
      </div>
      <div>
        <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>أصناف الفاتورة</Label>
        <div className="space-y-3 mt-2">
          {editedPurchase.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <BatteryTypeSelector
                  value={item.batteryType}
                  onChange={(value) => handleItemChange(index, "batteryType", value)}
                  placeholder="اختر نوع البطارية"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="الكمية"
                  value={item.quantity || ''}
                  onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="السعر"
                  value={item.price || ''}
                  onChange={(e) => handleItemChange(index, "price", Number(e.target.value) || 0)}
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
                  onClick={() => handleRemoveItem(index)}
                  disabled={editedPurchase.items.length === 1}
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم (%)</Label>
        <Input
          type="number"
          value={editedPurchase.discount}
          onChange={(e) => setEditedPurchase({ ...editedPurchase, discount: Number(e.target.value) || 0 })}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button onClick={handleSave} className="bg-green-600">
          حفظ التعديلات
        </Button>
      </div>
    </div>
  );
};

export default PurchasesPage;
