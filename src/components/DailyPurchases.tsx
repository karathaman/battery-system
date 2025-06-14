import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus, Trash2, Check, Minus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateNavigation } from "./DateNavigation";
import { useDailyPurchases, DailyPurchase } from "@/hooks/useDailyPurchases";
import { supabase } from "@/integrations/supabase/client";
import { fetchBatteryTypes } from "@/services/batteryTypeService";
import { fetchSuppliers } from "@/services/supplierService";


interface DailyPurchasesProps {
  id: string;
  date: string;
  supplierName: string;
  supplierCode: string;
  supplierPhone: string;
  batteryType: string;
  batteryTypeId: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
  isSaved: boolean;
  language?: string;
}

export const DailyPurchases = ({ language, id, date, supplierName, supplierCode, supplierPhone, batteryType, quantity, pricePerKg, total, discount, finalTotal, isSaved }: DailyPurchasesProps) => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [localPurchases, setLocalPurchases] = useState<DailyPurchase[]>([]);
  const [focusedCell, setFocusedCell] = useState<{ row: number, col: string } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [suppliers, setSuppliers] = useState([]);
  const [batteryTypes, setBatteryTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الموردين وأنواع البطاريات معًا
        const [suppliersData, batteryTypesData] = await Promise.all([
          fetchSuppliers(),
          fetchBatteryTypes(),
        ]);
        setSuppliers(suppliersData);
        setBatteryTypes(batteryTypesData);
      } catch (err) {
        setError(language === "ar" ? "فشل في جلب البيانات" : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const findSupplierBySearch = (searchTerm: string) => {
    const term = searchTerm.toLowerCase().trim();
    console.log("Searching for:", term);
    console.log("Suppliers:", suppliers);

    return suppliers.find((supplier) => {
      console.log("Checking supplier:", supplier); // طباعة المورد للتحقق
      return (
        (supplier.name && supplier.name.toLowerCase().includes(term)) ||
        (supplier.phone && supplier.phone.includes(term)) ||
        (supplier.supplier_code && supplier.supplier_code.toLowerCase() === term)
      );
    });
  };

  // Removed useEffect that referenced undefined 'value' variable

  const isRTL = language === "ar";

  const {
    purchases: dbPurchases,
    isLoading,
    savePurchase,
    deletePurchase,
    clearDay,
    isSaving,
    isDeleting
  } = useDailyPurchases(currentDate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب البيانات من قاعدة البيانات
        const { data, error } = await supabase
          .from("daily_purchases")
          .select("*")
          .eq("date", currentDate);  // جلب البيانات للـ date الحالي فقط (يمكن تعديل هذا الشرط حسب الحاجة)

        if (error) {
          console.error("Error fetching purchases:", error);
        } else {
          // تحديث بيانات المحلي بمشتريات اليوم
          setLocalPurchases(
            (data || []).map((item: any) => ({
              id: item.id,
              date: item.date,
              supplierName: item.supplier_name,
              supplierCode: item.supplier_code,
              supplierPhone: item.supplier_phone,
              batteryType: item.battery_type,
              batteryTypeId: item.batteryTypeId, // Add this line
              quantity: item.quantity,
              pricePerKg: item.price_per_kg,
              total: item.total,
              discount: item.discount,
              finalTotal: item.final_total,
              isSaved: item.is_saved,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [currentDate]);

  // Initialize local purchases when db data loads
  /*   useEffect(() => {
      const initialPurchases = dbPurchases.length > 0 ? dbPurchases : [{
        id: "temp-1",
        date: currentDate,
        supplierName: "",
        supplierCode: "",
        supplierPhone: "",
        batteryType: "بطاريات عادية",
        quantity: 0,
        pricePerKg: 0,
        total: 0,
        discount: 0,
        finalTotal: 0,
        isSaved: false
      }];
      setLocalPurchases(initialPurchases);
    }, [dbPurchases, currentDate]);
     */

  const calculateTotals = (purchase: DailyPurchase): DailyPurchase => {
    const total = Math.round(purchase.quantity * purchase.pricePerKg);
    const finalTotal = total - purchase.discount;
    return { ...purchase, total, finalTotal };
  };

  const updateLocalPurchase = (index: number, field: keyof DailyPurchase, value: any) => {
    setLocalPurchases(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index] = calculateTotals(updated[index]);
      return updated;
    });
  };

  const updateBatteryTypeQuantity = async (batteryTypeId: string, quantityChange: number) => {
    try {
      console.log('Updating battery type quantity:', { batteryTypeId, quantityChange });
      
      const { data, error } = await supabase
        .from("battery_types")
        .select("currentQty")
        .eq("id", batteryTypeId)
        .single();

      if (error) {
        console.error("Error fetching battery type:", error);
        return;
      }

      const updatedQty = (data?.currentQty || 0) + quantityChange;

      const { error: updateError } = await supabase
        .from("battery_types")
        .update({ currentQty: Math.max(0, updatedQty) })
        .eq("id", batteryTypeId);

      if (updateError) {
        console.error("Error updating battery type quantity:", updateError);
      } else {
        console.log("Battery type quantity updated successfully:", { 
          batteryTypeId, 
          previousQty: data?.currentQty || 0, 
          change: quantityChange, 
          newQty: updatedQty 
        });
      }
    } catch (err) {
      console.error("Unexpected error updating battery type quantity:", err);
    }
  };

  const updateSupplierStats = async (supplierCode: string, purchase: DailyPurchase) => {
    try {
      console.log('Updating supplier stats for:', supplierCode, purchase);
      
      // Get supplier by code
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .select("id, total_purchases, total_amount, balance")
        .eq("supplier_code", supplierCode)
        .single();

      if (supplierError || !supplier) {
        console.error("Error fetching supplier:", supplierError);
        return;
      }

      // Calculate new totals
      const newTotalPurchases = (supplier.total_purchases || 0) + purchase.quantity;
      const newTotalAmount = (supplier.total_amount || 0) + purchase.finalTotal;
      const newAveragePrice = newTotalPurchases > 0 ? newTotalAmount / newTotalPurchases : 0;
      
      // Update balance for credit purchases
      const newBalance = (supplier.balance || 0) + purchase.finalTotal;

      console.log('Calculated supplier stats:', {
        oldStats: supplier,
        newTotalPurchases,
        newTotalAmount,
        newAveragePrice,
        newBalance
      });

      const { error: updateError } = await supabase
        .from("suppliers")
        .update({
          last_purchase: purchase.date,
          total_purchases: newTotalPurchases,
          total_amount: newTotalAmount,
          average_price: newAveragePrice,
          balance: newBalance
        })
        .eq("supplier_code", supplierCode);

      if (updateError) {
        console.error("Error updating supplier stats:", updateError);
      } else {
        console.log("Supplier stats updated successfully");
      }
    } catch (err) {
      console.error("Unexpected error updating supplier stats:", err);
    }
  };

  const revertSupplierStats = async (supplierCode: string, purchase: DailyPurchase) => {
    try {
      console.log('Reverting supplier stats for:', supplierCode, purchase);
      
      // Get supplier by code
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .select("id, total_purchases, total_amount, balance")
        .eq("supplier_code", supplierCode)
        .single();

      if (supplierError || !supplier) {
        console.error("Error fetching supplier:", supplierError);
        return;
      }

      // Calculate reverted totals
      const newTotalPurchases = Math.max(0, (supplier.total_purchases || 0) - purchase.quantity);
      const newTotalAmount = Math.max(0, (supplier.total_amount || 0) - purchase.finalTotal);
      const newAveragePrice = newTotalPurchases > 0 ? newTotalAmount / newTotalPurchases : 0;
      const newBalance = Math.max(0, (supplier.balance || 0) - purchase.finalTotal);

      console.log('Calculated reverted supplier stats:', {
        oldStats: supplier,
        newTotalPurchases,
        newTotalAmount,
        newAveragePrice,
        newBalance
      });

      const { error: updateError } = await supabase
        .from("suppliers")
        .update({
          total_purchases: newTotalPurchases,
          total_amount: newTotalAmount,
          average_price: newAveragePrice,
          balance: newBalance
        })
        .eq("supplier_code", supplierCode);

      if (updateError) {
        console.error("Error reverting supplier stats:", updateError);
      } else {
        console.log("Supplier stats reverted successfully");
      }
    } catch (err) {
      console.error("Unexpected error reverting supplier stats:", err);
    }
  };

  const addRow = () => {
    // تحديد النوع الافتراضي
    const defaultBatteryType = batteryTypes[0] || { id: "", name: "بطاريات عادية" }; // النوع الأول أو نوع افتراضي

    const newPurchase: DailyPurchase = {
      id: `temp-${Date.now()}`,
      date: currentDate,
      supplierName: "",
      supplierCode: "",
      supplierPhone: "",
      batteryType: defaultBatteryType.name, // تعيين الاسم الافتراضي
      batteryTypeId: defaultBatteryType.id, // تعيين المعرف الافتراضي
      quantity: 0,
      pricePerKg: 0,
      total: 0,
      discount: 0,
      finalTotal: 0,
      isSaved: false,
    };

    setLocalPurchases((prev) => [...prev, newPurchase]);
  };

  const deleteRow = async (index: number) => {
    const purchase = localPurchases[index];

    if (!purchase) {
      console.error("Purchase not found at index:", index);
      return;
    }

    try {
      if (!purchase.id.startsWith("temp-")) {
        const { error } = await supabase
          .from("daily_purchases")
          .delete()
          .eq("id", purchase.id);

        if (error) {
          console.error("Error deleting purchase from database:", error);
          toast({
            title: language === "ar" ? "خطأ" : "Error",
            description: language === "ar" ? "فشل في حذف الصف" : "Failed to delete row",
            variant: "destructive",
            duration: 2000,
          });
          return;
        }

        console.log("Purchase deleted successfully from database.");
        
        // Revert battery type quantity
        if (purchase.batteryTypeId) {
          await updateBatteryTypeQuantity(purchase.batteryTypeId, -purchase.quantity);
        }
        
        // Revert supplier stats
        if (purchase.supplierCode) {
          await revertSupplierStats(purchase.supplierCode, purchase);
        }

        toast({
          title: language === "ar" ? "تم الحذف" : "Deleted",
          description: language === "ar" ? "تم حذف السطر بنجاح وتحديث بيانات المورد" : "Row deleted successfully and supplier data updated",
          duration: 2000,
        });
      }

      setLocalPurchases((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error in deleteRow:", error);
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "حدث خطأ أثناء الحذف" : "An error occurred while deleting",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const savePurchaseRow = async (index: number) => {
    const purchase = localPurchases[index];

    if (!purchase.supplierName || !purchase.quantity || !purchase.pricePerKg) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    try {
      if (purchase.id && !purchase.id.startsWith("temp-")) {
        // Update existing purchase
        const { error } = await supabase
          .from("daily_purchases")
          .update({
            supplier_name: purchase.supplierName,
            supplier_code: purchase.supplierCode,
            supplier_phone: purchase.supplierPhone,
            battery_type: purchase.batteryType,
            batteryTypeId: purchase.batteryTypeId,
            quantity: purchase.quantity,
            price_per_kg: purchase.pricePerKg,
            total: purchase.total,
            discount: purchase.discount,
            final_total: purchase.finalTotal,
          })
          .eq("id", purchase.id);

        if (error) {
          console.error("Error updating purchase:", error);
          toast({
            title: language === "ar" ? "خطأ" : "Error",
            description: language === "ar" ? "فشل في تحديث البيانات" : "Failed to update data",
            variant: "destructive",
            duration: 2000,
          });
          return;
        }

        console.log("Purchase updated successfully:", purchase);
      } else {
        // Create new purchase
        const { data, error } = await supabase
          .from("daily_purchases")
          .insert([
            {
              date: currentDate,
              supplier_name: purchase.supplierName,
              supplier_code: purchase.supplierCode,
              supplier_phone: purchase.supplierPhone,
              battery_type: purchase.batteryType,
              batteryTypeId: purchase.batteryTypeId,
              quantity: purchase.quantity,
              price_per_kg: purchase.pricePerKg,
              total: purchase.total,
              discount: purchase.discount,
              final_total: purchase.finalTotal,
            },
          ])
          .select();

        if (error) {
          console.error("Error saving purchase:", error);
          toast({
            title: language === "ar" ? "خطأ" : "Error",
            description: language === "ar" ? "فشل في حفظ البيانات" : "Failed to save data",
            variant: "destructive",
            duration: 2000,
          });
          return;
        }

        console.log("Purchase saved successfully:", data);
        if (data && data.length > 0) {
          updateLocalPurchase(index, "isSaved", true);
          updateLocalPurchase(index, "id", data[0].id);
        }
      }

      // Update battery type quantity
      if (purchase.batteryTypeId) {
        await updateBatteryTypeQuantity(purchase.batteryTypeId, purchase.quantity);
      }
      
      // Update supplier stats
      if (purchase.supplierCode) {
        await updateSupplierStats(purchase.supplierCode, purchase);
      }

      toast({
        title: language === "ar" ? "تم الحفظ" : "Saved",
        description: language === "ar" ? "تم حفظ البيانات وتحديث بيانات المورد بنجاح" : "Data saved and supplier information updated successfully",
        duration: 2000,
      });

    } catch (error) {
      console.error("Error in savePurchaseRow:", error);
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const clearAllData = () => {
    clearDay();
    setLocalPurchases([{
      id: "temp-1",
      date: currentDate,
      supplierName: "",
      supplierCode: "",
      supplierPhone: "",
      batteryType: "",
      quantity: 0,
      pricePerKg: 0,
      total: 0,
      discount: 0,
      finalTotal: 0,
      isSaved: false,
      batteryTypeId: undefined
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    const totalRows = localPurchases.length;
    const fields = ['supplierName', 'batteryType', 'quantity', 'pricePerKg', 'discount', 'save'];
    const currentFieldIndex = fields.indexOf(field);

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();

      if (field === 'discount') {
        setFocusedCell({ row: rowIndex, col: 'save' });
      } else if (field === 'save') {
        savePurchaseRow(rowIndex);
      } else if (currentFieldIndex < fields.length - 2) {
        setFocusedCell({ row: rowIndex, col: fields[currentFieldIndex + 1] });
      } else if (rowIndex < totalRows - 1) {
        setFocusedCell({ row: rowIndex + 1, col: fields[0] });
      } else {
        addRow();
        setTimeout(() => {
          setFocusedCell({ row: totalRows, col: fields[0] });
        }, 100);
      }
    } else if (e.key === 'ArrowDown' && rowIndex < totalRows - 1) {
      e.preventDefault();
      setFocusedCell({ row: rowIndex + 1, col: field });
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      setFocusedCell({ row: rowIndex - 1, col: field });
    } else if (e.key === 'ArrowRight' && currentFieldIndex > 0) {
      e.preventDefault();
      setFocusedCell({ row: rowIndex, col: fields[currentFieldIndex - 1] });
    } else if (e.key === 'ArrowLeft' && currentFieldIndex < fields.length - 1) {
      e.preventDefault();
      setFocusedCell({ row: rowIndex, col: fields[currentFieldIndex + 1] });
    }
  };

  const handleSupplierInput = (value: string, rowIndex: number) => {
    console.log("Input value:", value);
    const foundSupplier = findSupplierBySearch(value);

    if (foundSupplier) {
      console.log("Found supplier:", foundSupplier); // طباعة الكائن بالكامل
      console.log("Supplier code is:", foundSupplier.supplier_code); // طباعة كود المورد بالاسم الصحيح

      updateLocalPurchase(rowIndex, 'supplierName', foundSupplier.name);
      updateLocalPurchase(rowIndex, 'supplierCode', foundSupplier.supplier_code); // التأكد من الحقل الصحيح
      updateLocalPurchase(rowIndex, 'supplierPhone', foundSupplier.phone);

      toast({
        title: language === "ar" ? "تم العثور على المورد" : "Supplier Found",
        description: language === "ar" ? `تم اختيار ${foundSupplier.name}` : `Selected ${foundSupplier.name}`,
        duration: 2000,
      });

      setTimeout(() => {
        setFocusedCell({ row: rowIndex, col: 'batteryType' });
      }, 100);
    } else {
      console.log("Supplier not found");
      updateLocalPurchase(rowIndex, 'supplierName', value);
      updateLocalPurchase(rowIndex, 'supplierCode', ""); // تعيين كود المورد كقيمة فارغة
      updateLocalPurchase(rowIndex, 'supplierPhone', "");
    }
  };

  const totalDailyAmount = localPurchases.reduce((sum, purchase) => sum + purchase.finalTotal, 0);

  useEffect(() => {
    if (focusedCell) {
      if (focusedCell.col === 'save') {
        const button = document.getElementById(`save-${focusedCell.row}`);
        if (button) {
          button.focus();
        }
      } else {
        const input = document.getElementById(`${focusedCell.row}-${focusedCell.col}`);
        if (input) {
          input.focus();
        }
      }
    }
  }, [focusedCell]);

  const fetchBatteryTypes = async () => {
    const { data, error } = await supabase
      .from("battery_types")
      .select("id, name"); // جلب id و name

    if (error) {
      console.error("Error fetching battery types:", error);
      return [];
    }

    return data || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const batteryTypesData = await fetchBatteryTypes();
        setBatteryTypes(batteryTypesData); // تخزين الكائنات كاملة (id و name)
      } catch (err) {
        setError(language === "ar" ? "فشل في جلب البيانات" : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [lastSupplies, setLastSupplies] = useState<{ [supplierCode: string]: { [batteryType: string]: any } }>({});
  const fetchLastSupplies = async (supplierCode: string) => {
    try {
      const { data, error } = await supabase
        .from("daily_purchases")
        .select("battery_type, date, quantity, price_per_kg")
        .eq("supplier_code", supplierCode)
        .lt("date", currentDate) // جلب التوريدات قبل اليوم الحالي فقط
        .order("date", { ascending: false }); // ترتيب التواريخ تنازليًا

      if (error) {
        console.error("Error fetching last supplies:", error);
        return {};
      }

      // تنظيم البيانات حسب نوع البطارية
      const lastSupplies: { [batteryType: string]: any } = {};
      for (const purchase of data || []) {
        if (!lastSupplies[purchase.battery_type]) {
          lastSupplies[purchase.battery_type] = purchase;
        }
      }

      return lastSupplies;
    } catch (err) {
      console.error("Unexpected error fetching last supplies:", err);
      return {};
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      const supplierCodes = [...new Set(localPurchases.map(p => p.supplierCode).filter(Boolean))];

      const newLastSupplies: { [supplierCode: string]: { [batteryType: string]: any } } = {};
      for (const supplierCode of supplierCodes) {
        const supplies = await fetchLastSupplies(supplierCode);
        newLastSupplies[supplierCode] = supplies;
      }

      setLastSupplies(newLastSupplies);
    };

    fetchData();
  }, [localPurchases]);

  const [selectedPurchase, setSelectedPurchase] = useState<DailyPurchase | null>(null);

  const handleRowClick = (purchase: DailyPurchase) => {
    setSelectedPurchase(purchase); // تحديث الصف المحدد عند الضغط
  };

  const handleOutsideClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const isInsideTable = target.closest("table"); // تحقق إذا كان النقر داخل الجدول
    if (!isInsideTable) {
      setSelectedPurchase(null); // إعادة تعيين الصف المحدد
    }
  };

  useEffect(() => {
    // إزالة أي تأثير يقوم بتعيين `selectedPurchase` عند تغيير التاريخ أو إعادة تحميل الصفحة
  }, [currentDate]);

  const updateSupplierBalance = async (supplierCode: string, amount: number) => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("supplier_code", supplierCode)
        .single();

      if (error) {
        console.error("Error fetching supplier balance:", error);
        return;
      }

      const updatedBalance = (data?.balance || 0) + amount;

      const { error: updateError } = await supabase
        .from("suppliers")
        .update({ balance: updatedBalance })
        .eq("supplier_code", supplierCode);

      if (updateError) {
        console.error("Error updating supplier balance:", updateError);
      } else {
        console.log("Supplier balance updated successfully.");
        toast({
          title: language === "ar" ? "تم تحديث الرصيد" : "Balance Updated",
          description: language === "ar" ? `تم تعديل رصيد المورد بنجاح` : `Supplier balance updated successfully`,
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("Unexpected error updating supplier balance:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={handleOutsideClick}>
      {/* Header with Date Navigation and Total */}
      <div className={`flex justify-between items-center bg-white rounded-lg shadow-lg p-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <DateNavigation
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onClearData={clearAllData}
          language={language}
        />

        <div className={isRTL ? 'text-right' : 'text-left'}>
          <p className="text-sm text-gray-600 " style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "إجمالي مشتريات اليوم" : "Daily Total"}
          </p>
          <div className="flex items-center gap-2 bg-green-50">
            <span className="text-2xl font-bold text-green-600 " style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {totalDailyAmount.toLocaleString()}
            </span>
            <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Daily Purchases Table - Full Width */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-end items-center">
          <CardTitle
            className={`flex items-center gap-2 justify-start ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ fontFamily: 'Tajawal, sans-serif', width: '100%', textAlign: 'right' }}
          >
            {selectedPurchase && (
              <div
                className="flex flex-row gap-4 bg-white rounded px-3 py-1 shadow border items-center"
                style={{
                  fontFamily: 'Tajawal, sans-serif',
                  marginBottom: 8,
                  minHeight: 36,
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <span
                  className="text-blue-700 text-xs break-words"
                  style={{ maxWidth: 120, display: "inline-block", wordBreak: "break-word" }}
                >
                  {language === "ar" ? "المورد:" : "Supplier:"} {selectedPurchase.supplierName}
                </span>
                <div className="flex flex-row gap-3 flex-wrap items-center">
                  {Object.entries(lastSupplies[selectedPurchase.supplierCode] || {}).length === 0 && (
                    <span className="text-gray-700 text-xs">
                      {language === "ar" ? "لا يوجد توريد سابق" : "No previous supply"}
                    </span>
                  )}
                  {Object.entries(lastSupplies[selectedPurchase.supplierCode] || {}).map(([batteryType, purchase]) => {
                    const daysSinceLastSupply = Math.floor(
                      (new Date().getTime() - new Date(purchase.date).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysSinceLastSupply > 15;

                    return (
                      <span
                        key={batteryType}
                        className={`text-xs whitespace-nowrap ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}
                      >
                        {language === "ar"
                          ? `آخر توريد (${batteryType}): `
                          : `Last Supply (${batteryType}): `}
                        <span className="font-bold">{purchase.date || "-"}</span>
                        {" | "} 
                        {language === "ar" ? "كمية:" : "Qty:"}{" "}
                        <span className="font-bold">{purchase.quantity ?? "-"}</span>
                        {" | "}
                        {language === "ar" ? "سعر:" : "Price:"}{" "}
                        <span className="font-bold">{purchase.price_per_kg ?? "-"}</span>
                        {" | "}
                        {language === "ar" ? "منذ:" : "Since:"}{" "}
                        <span className="font-bold">{daysSinceLastSupply} {language === "ar" ? "يوم" : "days"}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex-1 text-right flex items-center gap-2">
              {language === "ar" ? "المشتريات من الموردين" : "Supplier Purchases"}
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                <tr>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 180, // المورد
                    minWidth: 120,
                    maxWidth: 220,
                  }}
                  >
                  {language === "ar" ? "المورد" : "Supplier"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 140, // نوع البطارية
                    minWidth: 100,
                    maxWidth: 180,
                  }}
                  >
                  {language === "ar" ? "نوع البطارية" : "Battery Type"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 90, // الكمية
                    minWidth: 70,
                    maxWidth: 110,
                  }}
                  >
                  {language === "ar" ? "الكمية" : "Quantity"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 90, // السعر
                    minWidth: 70,
                    maxWidth: 110,
                  }}
                  >
                  {language === "ar" ? "السعر" : "Price"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 110, // الإجمالي
                    minWidth: 90,
                    maxWidth: 130,
                  }}
                  >
                  {language === "ar" ? "الإجمالي" : "Total"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 90, // الخصم
                    minWidth: 70,
                    maxWidth: 110,
                  }}
                  >
                  {language === "ar" ? "الخصم" : "Discount"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 120, // الإجمالي النهائي
                    minWidth: 100,
                    maxWidth: 150,
                  }}
                  >
                  {language === "ar" ? "الإجمالي النهائي" : "Final Total"}
                  </th>
                  <th
                  className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{
                    fontFamily: 'Tajawal, sans-serif',
                    width: 120, // إجراءات
                    minWidth: 90,
                    maxWidth: 150,
                  }}
                  >
                  {language === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
                </thead>

              <tbody>
                {localPurchases.map((purchase, index) => (
                  <tr
                    key={purchase.id}
                    className={`border-b hover:bg-gray-50 ${purchase.isSaved ? 'bg-green-50' : ''}`}
                    onClick={() => handleRowClick(purchase)} // تحديث الصف المحدد عند الضغط
                  >
                    <td className="p-2">
                      <Input
                        id={`${index}-supplierName`}
                        value={purchase.supplierName}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            updateLocalPurchase(index, 'supplierName', "");
                            updateLocalPurchase(index, 'supplierCode', "");
                            updateLocalPurchase(index, 'supplierPhone', "");
                          } else {
                            updateLocalPurchase(index, 'supplierName', e.target.value);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== "") {
                            handleSupplierInput(e.target.value, index);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSupplierInput((e.target as HTMLInputElement).value, index);
                          }
                        }}
                        placeholder={language === "ar" ? "ابحث: اسم/جوال/رمز..." : "Search: name/phone/code..."}
                        className={isRTL ? 'text-right' : 'text-left'}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        readOnly={purchase.isSaved}
                        tabIndex={purchase.isSaved ? -1 : 0}
                      />
                    </td>

                    <td className="p-2">
                      <Select
                        value={purchase.batteryTypeId || ""}
                        onValueChange={(value) => {
                          const selectedType = batteryTypes.find((type) => type.id === value);
                          if (selectedType) {
                            updateLocalPurchase(index, "batteryType", selectedType.name);
                            updateLocalPurchase(index, "batteryTypeId", selectedType.id);
                          }
                        }}
                      >
                        <SelectTrigger
                          id={`${index}-batteryType`}
                          onKeyDown={(e) => handleKeyDown(e, index, 'batteryType')}
                          className={isRTL ? 'text-right' : 'text-left'}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {batteryTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="p-2">
                      <Input
                        id={`${index}-quantity`}
                        type="number"
                        value={purchase.quantity || ''}
                        onChange={(e) => updateLocalPurchase(index, 'quantity', Number(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                        onFocus={() => setFocusedCell({ row: index, col: 'quantity' })}
                        className="text-center"
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        id={`${index}-pricePerKg`}
                        type="number"
                        step="0.01"
                        value={purchase.pricePerKg || ''}
                        onChange={(e) => updateLocalPurchase(index, 'pricePerKg', Number(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'pricePerKg')}
                        onFocus={() => setFocusedCell({ row: index, col: 'pricePerKg' })}
                        className="text-center"
                      />
                    </td>

                    <td className="p-2 text-center font-semibold">
                      {purchase.total.toLocaleString()}
                    </td>

                    <td className="p-2">
                      <Input
                        id={`${index}-discount`}
                        type="number"
                        value={purchase.discount || ''}
                        onChange={(e) => updateLocalPurchase(index, 'discount', Number(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'discount')}
                        onFocus={() => setFocusedCell({ row: index, col: 'discount' })}
                        className="text-center"
                      />
                    </td>

                    <td className="p-2 text-center font-bold text-green-600">
                      {purchase.finalTotal.toLocaleString()}
                    </td>

                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          id={`save-${index}`}
                          onClick={async () => {
                            await savePurchaseRow(index);
                            await updateSupplierBalance(purchase.supplierCode, purchase.discount);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, index, 'save')}
                          variant="outline"
                          size="sm"
                          className={`text-green-600 hover:text-green-800 ${purchase.isSaved ? 'bg-green-100' : ''}`}
                          title={language === "ar" ? "حفظ" : "Save"}
                          disabled={isSaving}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteRow(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                       
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <Button
              onClick={addRow}
              variant="outline"
              className="w-full flex items-center gap-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              {language === "ar" ? "إضافة سطر جديد" : "Add New Row"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
