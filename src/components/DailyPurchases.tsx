import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus, Trash2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateNavigation } from "./DateNavigation";
import { useDailyPurchases, DailyPurchase } from "@/hooks/useDailyPurchases";

const batteryTypes = [
  "بطاريات عادية",
  "بطاريات جافة", 
  "بطاريات زجاج",
  "بطاريات تعبئة",
  "رصاص"
];

// Mock supplier data for testing direct selection
const mockSuppliers = [
  {
    id: "1",
    supplierCode: "S001",
    name: "مورد البطاريات الذهبية",
    phone: "0501234567",
    lastPurchase: "2024-01-15"
  },
  {
    id: "2",
    supplierCode: "S002", 
    name: "شركة البطاريات المتطورة",
    phone: "0507654321",
    lastPurchase: "2024-01-10"
  }
];

interface DailyPurchasesProps {
  language?: string;
}

export const DailyPurchases = ({ language = "ar" }: DailyPurchasesProps) => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [localPurchases, setLocalPurchases] = useState<DailyPurchase[]>([]);
  const [focusedCell, setFocusedCell] = useState<{row: number, col: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize local purchases when db data loads
  useEffect(() => {
    if (dbPurchases.length > 0) {
      setLocalPurchases(dbPurchases);
    } else {
      // If no saved data, start with one empty row
      setLocalPurchases([{
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
      }]);
    }
  }, [dbPurchases, currentDate]);

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

  const findSupplierBySearch = (searchTerm: string) => {
    const term = searchTerm.toLowerCase().trim();
    return mockSuppliers.find(supplier => 
      supplier.phone === term || 
      supplier.supplierCode.toLowerCase() === term ||
      supplier.name.toLowerCase().includes(term)
    );
  };

  const addRow = () => {
    const newPurchase: DailyPurchase = {
      id: `temp-${Date.now()}`,
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
    };
    setLocalPurchases(prev => [...prev, newPurchase]);
  };

  const deleteRow = (index: number) => {
    const purchase = localPurchases[index];
    
    if (localPurchases.length > 1) {
      if (purchase.isSaved && !purchase.id.startsWith('temp-')) {
        // Delete from database
        deletePurchase(purchase.id);
      }
      
      // Remove from local state
      setLocalPurchases(prev => prev.filter((_, i) => i !== index));
      
      if (!purchase.isSaved) {
        toast({
          title: language === "ar" ? "تم حذف السطر" : "Row Deleted",
          description: language === "ar" ? "تم حذف السطر بنجاح" : "Row deleted successfully",
          duration: 2000,
        });
      }
    }
  };

  const savePurchaseRow = (index: number) => {
    const purchase = localPurchases[index];
    
    // Validate required fields
    if (!purchase.supplierName || !purchase.quantity || !purchase.pricePerKg) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Save to database
    savePurchase({
      date: currentDate,
      supplierName: purchase.supplierName,
      supplierCode: purchase.supplierCode,
      supplierPhone: purchase.supplierPhone,
      batteryType: purchase.batteryType,
      quantity: purchase.quantity,
      pricePerKg: purchase.pricePerKg,
      total: purchase.total,
      discount: purchase.discount,
      finalTotal: purchase.finalTotal
    });

    // Mark as saved locally
    updateLocalPurchase(index, 'isSaved', true);

    // Add new row and focus on it
    addRow();
    setTimeout(() => {
      setFocusedCell({ row: localPurchases.length, col: 'supplierName' });
    }, 100);
  };

  const clearAllData = () => {
    clearDay();
    setLocalPurchases([{
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
    const foundSupplier = findSupplierBySearch(value);
    
    if (foundSupplier) {
      updateLocalPurchase(rowIndex, 'supplierName', foundSupplier.name);
      updateLocalPurchase(rowIndex, 'supplierCode', foundSupplier.supplierCode);
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
      updateLocalPurchase(rowIndex, 'supplierName', value);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation and Total */}
      <div className={`flex justify-between items-center bg-white rounded-lg shadow-lg p-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <DateNavigation 
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onClearData={clearAllData}
          language={language}
        />
        
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "إجمالي مشتريات اليوم" : "Daily Total"}
          </p>
          <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {totalDailyAmount.toLocaleString()} {language === "ar" ? "ريال" : "SAR"}
          </p>
        </div>
      </div>

      {/* Daily Purchases Table - Full Width */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <CalendarDays className="w-5 h-5" />
            {language === "ar" ? "المشتريات من الموردين" : "Supplier Purchases"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "المورد" : "Supplier"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "نوع البطارية" : "Battery Type"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "الكمية" : "Quantity"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "السعر" : "Price"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "الإجمالي" : "Total"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "الخصم" : "Discount"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "الإجمالي النهائي" : "Final Total"}
                  </th>
                  <th className={`p-3 font-semibold ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              
              <tbody>
                {localPurchases.map((purchase, index) => (
                  <tr key={purchase.id} className={`border-b hover:bg-gray-50 ${purchase.isSaved ? 'bg-green-50' : ''}`}>
                    <td className="p-2">
                      <Input
                        id={`${index}-supplierName`}
                        value={purchase.supplierName}
                        onChange={(e) => handleSupplierInput(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'supplierName')}
                        onFocus={() => setFocusedCell({row: index, col: 'supplierName'})}
                        placeholder={language === "ar" ? "ابحث: اسم/جوال/رمز..." : "Search: name/phone/code..."}
                        className={isRTL ? 'text-right' : 'text-left'}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      />
                    </td>
                    
                    <td className="p-2">
                      <Select
                        value={purchase.batteryType}
                        onValueChange={(value) => updateLocalPurchase(index, 'batteryType', value)}
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
                            <SelectItem key={type} value={type} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {type}
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
                        onFocus={() => setFocusedCell({row: index, col: 'quantity'})}
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
                        onFocus={() => setFocusedCell({row: index, col: 'pricePerKg'})}
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
                        onFocus={() => setFocusedCell({row: index, col: 'discount'})}
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
                          onClick={() => savePurchaseRow(index)}
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
