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
import { supabase } from "@/integrations/supabase/client";

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

  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false);
  const [addSupplierInitialName, setAddSupplierInitialName] = useState(""); // For carrying over search term
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

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

  const { total, discountAmount, finalTotal } = calculateTotals();

  // Display supplier info box if selectedSupplier exists
  const SupplierInfo = () => {
    if (!selectedSupplier) return null;
    return (
      <div className="bg-blue-50 rounded-md p-3 mb-2 flex flex-col md:flex-row md:items-center md:gap-6" dir="rtl">
        <span className="font-bold text-blue-900 flex items-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          المورد: <span className="mx-2">{selectedSupplier.name}</span>
          <span className="px-2">الرصيد : {selectedSupplier.balance ?? 0}</span>
        </span>
        {selectedSupplier.lastPurchase && (
          <div className="text-gray-700 text-sm mt-2 md:mt-0 flex flex-wrap gap-4">
            {Object.entries(selectedSupplier.lastPurchase).map(([batteryType, data]: any, idx) => (
              <span key={idx}>
                آخر توريد ({batteryType}): {data.date} | كمية: {data.quantity} | سعر: {data.price_per_kg} | منذ: {data.daysAgo} يوم
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const fetchSupplierDetails = async (supplierCode: string) => {
    if (!supplierCode) return null;
    // جلب بيانات الرصيد
    const { data: sData } = await supabase
      .from('suppliers')
      .select('id,balance')
      .eq('supplier_code', supplierCode)
      .maybeSingle();

    // جلب آخر توريد بحسب الأنواع
    const { data } = await supabase
      .from('daily_purchases')
      .select('battery_type, date, quantity, price_per_kg')
      .eq('supplier_code', supplierCode)
      .order('date', { ascending: false })
      .limit(20);

    // ترتيب بأحدث لكل نوع بطارية
    const lastPurchase: Record<string, any> = {};
    if (data) {
      for (const purchase of data) {
        if (!lastPurchase[purchase.battery_type]) {
          // احسب منذ كم يوم
          const daysAgo = Math.floor((new Date().getTime() - new Date(purchase.date).getTime()) / (1000 * 60 * 60 * 24));
          lastPurchase[purchase.battery_type] = { ...purchase, daysAgo };
        }
      }
    }

    return {
      balance: sData?.balance ?? 0,
      lastPurchase
    };
  };

  // handler for selecting supplier
  const handleSupplierSelect = async (supplier: any) => {
    setNewPurchase({
      ...newPurchase,
      supplierName: supplier.name,
      supplierCode: supplier.supplierCode,
      supplierPhone: supplier.phone
    });
    // fetch supplier balance and last purchase
    const details = await fetchSupplierDetails(supplier.supplierCode);
    setSelectedSupplier({
      ...supplier,
      ...details
    });
  };

  // handler Add supplier dialog
  const handleAddSupplier = (initialName: string) => {
    setAddSupplierDialogOpen(true);
    setAddSupplierInitialName(initialName);
    setSupplierSearchOpen(false);
  };

  // after supplier added
  const handleSupplierAdded = async (supplier: any) => {
    setAddSupplierDialogOpen(false);
    // fetch supplier record again
    setTimeout(() => setSupplierSearchOpen(true), 400);
  };

  return (
    <div className="space-y-6">
      {/* إضافة دايلاوج بحث المورد */}
      <SupplierSearchDialog
        open={supplierSearchOpen}
        onClose={() => setSupplierSearchOpen(false)}
        searchTerm={newPurchase.supplierName}
        onSupplierSelect={handleSupplierSelect}
        language="ar"
        onAddSupplier={handleAddSupplier}
      />
      <AddSupplierDialog
        open={addSupplierDialogOpen}
        onClose={() => setAddSupplierDialogOpen(false)}
        onSupplierAdded={handleSupplierAdded}
        language="ar"
        nextSupplierCode={null}
      />

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

      {/* Supplier info box before the purchase form */}
      <SupplierInfo />

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
              <Input
                id="supplierName"
                value={newPurchase.supplierName}
                onChange={(e) => setNewPurchase({ ...newPurchase, supplierName: e.target.value })}
                placeholder="أدخل اسم المورد"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                onFocus={() => setSupplierSearchOpen(true)}
                readOnly
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
