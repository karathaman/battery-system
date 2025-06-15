import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingCart, Save, Edit, Trash2, AlertCircle } from "lucide-react";
import { DateNavigation } from "@/components/DateNavigation";
import { DailyPurchases } from "@/components/DailyPurchases";
import { DailyNotesAndTasks } from "@/components/DailyNotesAndTasks";
import { StickyNotes } from "@/components/StickyNotes";
import { TaskListWidget } from "@/components/TaskListWidget";
import { useDailyPurchases } from "@/hooks/useDailyPurchases";
import { BatteryTypeSelector } from "@/components/BatteryTypeSelector";
import { toast } from "@/hooks/use-toast";
import { SupplierSearchDialog } from "@/components/SupplierSearchDialog";
import { AddSupplierDialog } from "@/components/AddSupplierDialog";
import { SupplierComboBox } from "@/components/SupplierComboBox";

const DailyPurchasesPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { purchases, savePurchase, deletePurchase, clearDay, isSaving, isDeleting, isClearing } = useDailyPurchases(selectedDate);

  const [newPurchase, setNewPurchase] = useState({
    supplierName: "",
    supplierCode: "",
    supplierPhone: "",
    batteryType: "",
    quantity: 0,
    pricePerKg: 0,
    discount: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [pendingSupplierName, setPendingSupplierName] = useState("");

  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);

  React.useEffect(() => {
    async function fetchSuppliers() {
      // Fetch all suppliers
      const { data: suppliersData, error: sErr } = await supabase
        .from("suppliers")
        .select("name,supplier_code,phone,id");

      // Fetch sum of quantities per supplier from daily_purchases
      const { data: totalData, error: tErr } = await supabase
        .from("daily_purchases")
        .select("supplier_name, supplier_code, sum:quantity")
        .group("supplier_code,supplier_name");

      let merged: any[] = [];
      if (suppliersData && totalData) {
        merged = suppliersData.map((s) => {
          const stats = totalData.find(
            (d) => d.supplier_code === s.supplier_code
          );
          return {
            name: s.name,
            supplierCode: s.supplier_code,
            phone: s.phone,
            totalQuantity: stats ? stats.sum : 0,
          };
        });
      }
      // Sort descending
      merged = merged.sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0));
      setTopSuppliers(merged);
    }
    fetchSuppliers();
  }, []);

  const calculateTotals = () => {
    const total = newPurchase.quantity * newPurchase.pricePerKg;
    const discountAmount = (total * newPurchase.discount) / 100;
    const finalTotal = total - discountAmount;
    return { total, discountAmount, finalTotal };
  };

  const handleSave = () => {
    if (!newPurchase.supplierName.trim() || !newPurchase.batteryType || newPurchase.quantity <= 0 || newPurchase.pricePerKg <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const { total, finalTotal } = calculateTotals();

    savePurchase({
      date: selectedDate,
      supplierName: newPurchase.supplierName,
      supplierCode: newPurchase.supplierCode,
      supplierPhone: newPurchase.supplierPhone,
      batteryType: newPurchase.batteryType,
      quantity: newPurchase.quantity,
      pricePerKg: newPurchase.pricePerKg,
      total,
      discount: newPurchase.discount,
      finalTotal
    });

    // Reset form
    setNewPurchase({
      supplierName: "",
      supplierCode: "",
      supplierPhone: "",
      batteryType: "",
      quantity: 0,
      pricePerKg: 0,
      discount: 0
    });
  };

  const handleEdit = (purchase: any) => {
    setNewPurchase({
      supplierName: purchase.supplierName,
      supplierCode: purchase.supplierCode || "",
      supplierPhone: purchase.supplierPhone || "",
      batteryType: purchase.batteryType,
      quantity: purchase.quantity,
      pricePerKg: purchase.pricePerKg,
      discount: purchase.discount || 0
    });
    setEditingId(purchase.id);
  };

  const handleClearDay = () => {
    if (confirm("هل أنت متأكد من مسح جميع بيانات هذا اليوم؟")) {
      clearDay();
    }
  };

  const handleOpenSupplierSearch = () => setShowSupplierSearch(true);

  const handleAddSupplier = (initialName: string) => {
    setShowSupplierSearch(false);
    setPendingSupplierName(initialName);
    setShowAddSupplier(true);
  };

  const handleSupplierAdded = (supplier: any) => {
    // عند إضافة المورد يتم تعبئة اسمه في حقل اسم المورد مباشرة
    setNewPurchase(prev => ({
      ...prev,
      supplierName: supplier.name,
      supplierPhone: supplier.phone || "",
      supplierCode: "", // إذا كان لكود لا يتوفر مباشرة عند الإضافة
    }));
    setShowAddSupplier(false);
    setShowSupplierSearch(false);
  };

  const { total, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            المشتريات اليومية
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Date Navigation */}
      <DateNavigation 
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        onClearData={handleClearDay}
      />

      {/* Add New Purchase Form */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {editingId ? 'تعديل المشترى' : 'إضافة مشترى جديد'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="supplierName" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                اسم المورد *
              </Label>
              <SupplierComboBox
                suppliers={topSuppliers}
                value={newPurchase.supplierName}
                onChange={(name, supplier) => {
                  setNewPurchase((prev) => ({
                    ...prev,
                    supplierName: name,
                    supplierCode: supplier?.supplierCode ?? "",
                    supplierPhone: supplier?.phone ?? "",
                  }));
                }}
                placeholder="ابحث باسم أو كود المورد"
              />
            </div>

            <div>
              <Label htmlFor="supplierCode" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                كود المورد
              </Label>
              <Input
                id="supplierCode"
                value={newPurchase.supplierCode}
                onChange={(e) => setNewPurchase({ ...newPurchase, supplierCode: e.target.value })}
                placeholder="كود المورد"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>

            <div>
              <Label htmlFor="supplierPhone" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                رقم الهاتف
              </Label>
              <Input
                id="supplierPhone"
                value={newPurchase.supplierPhone}
                onChange={(e) => setNewPurchase({ ...newPurchase, supplierPhone: e.target.value })}
                placeholder="رقم الهاتف"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>
                نوع البطارية *
              </Label>
              <BatteryTypeSelector
                value={newPurchase.batteryType}
                onChange={(value) => setNewPurchase({ ...newPurchase, batteryType: value })}
                placeholder="اختر نوع البطارية"
              />
            </div>

            <div>
              <Label htmlFor="quantity" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                الكمية *
              </Label>
              <Input
                id="quantity"
                type="number"
                value={newPurchase.quantity || ''}
                onChange={(e) => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) || 0 })}
                placeholder="الكمية"
              />
            </div>

            <div>
              <Label htmlFor="pricePerKg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                السعر/كيلو *
              </Label>
              <Input
                id="pricePerKg"
                type="number"
                step="0.01"
                value={newPurchase.pricePerKg || ''}
                onChange={(e) => setNewPurchase({ ...newPurchase, pricePerKg: Number(e.target.value) || 0 })}
                placeholder="السعر لكل كيلو"
              />
            </div>

            <div>
              <Label htmlFor="discount" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                الخصم (%)
              </Label>
              <Input
                id="discount"
                type="number"
                value={newPurchase.discount || ''}
                onChange={(e) => setNewPurchase({ ...newPurchase, discount: Number(e.target.value) || 0 })}
                placeholder="نسبة الخصم"
              />
            </div>
          </div>

          {/* Totals Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع</p>
                <p className="font-bold text-lg">{total.toFixed(2)} ريال</p>
              </div>
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم</p>
                <p className="font-bold text-lg text-red-600">-{discountAmount.toFixed(2)} ريال</p>
              </div>
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع النهائي</p>
                <p className="font-bold text-lg text-green-600">{finalTotal.toFixed(2)} ريال</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Save className="w-4 h-4 ml-2" />
              {editingId ? 'تحديث' : 'حفظ'}
            </Button>
            {editingId && (
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setNewPurchase({
                    supplierName: "",
                    supplierCode: "",
                    supplierPhone: "",
                    batteryType: "",
                    quantity: 0,
                    pricePerKg: 0,
                    discount: 0
                  });
                }}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إلغاء
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs لإدارة بحث المورد وإضافته */}
      <SupplierSearchDialog
        open={showSupplierSearch}
        onClose={() => setShowSupplierSearch(false)}
        onSupplierSelect={supplier => {
          setNewPurchase(prev => ({
            ...prev,
            supplierName: supplier.name,
            supplierCode: supplier.supplierCode,
            supplierPhone: supplier.phone,
          }));
          setShowSupplierSearch(false);
        }}
        searchTerm={newPurchase.supplierName}
        language="ar"
        onAddSupplier={handleAddSupplier}
      />

      <AddSupplierDialog
        open={showAddSupplier}
        onClose={() => setShowAddSupplier(false)}
        onSupplierAdded={handleSupplierAdded}
        language="ar"
      />

      {/* Daily Purchases List */}
      {purchases.length > 0 && (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <DailyPurchases 
              key={purchase.id}
              id={purchase.id}
              date={purchase.date}
              supplierName={purchase.supplierName}
              supplierCode={purchase.supplierCode}
              supplierPhone={purchase.supplierPhone}
              batteryType={purchase.batteryType}
              batteryTypeId={purchase.batteryTypeId}
              quantity={purchase.quantity}
              pricePerKg={purchase.pricePerKg}
              total={purchase.total}
              discount={purchase.discount}
              finalTotal={purchase.finalTotal}
              isSaved={purchase.isSaved}
              language="ar"
            />
          ))}
        </div>
      )}

      {/* Sticky Notes - Compact View */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          الملاحظات السريعة
        </h3>
        <StickyNotes compact={true} language="ar" />
      </div>

      {/* Task List - Compact View */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          قوائم المهام
        </h3>
        <TaskListWidget />
      </div>

      {/* Daily Notes and Tasks */}
      <DailyNotesAndTasks date={selectedDate} />
    </div>
  );
};

export default DailyPurchasesPage;
