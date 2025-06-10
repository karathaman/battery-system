
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus, Trash2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DateNavigation } from "./DateNavigation";

interface DailyPurchase {
  id: string;
  supplierName: string;
  supplierCode: string;
  supplierPhone: string;
  batteryType: string;
  quantity: number;
  price: number;
  total: number;
  discount: number;
  finalTotal: number;
  saved: boolean;
}

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
  const [purchases, setPurchases] = useState<DailyPurchase[]>([
    {
      id: "1",
      supplierName: "",
      supplierCode: "",
      supplierPhone: "",
      batteryType: "بطاريات عادية",
      quantity: 0,
      price: 0,
      total: 0,
      discount: 0,
      finalTotal: 0,
      saved: false
    }
  ]);
  
  const [focusedCell, setFocusedCell] = useState<{row: number, col: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  const isRTL = language === "ar";

  const calculateTotals = (purchase: DailyPurchase): DailyPurchase => {
    const total = Math.round(purchase.quantity * purchase.price);
    const finalTotal = total - purchase.discount;
    return { ...purchase, total, finalTotal };
  };

  const updatePurchase = (index: number, field: keyof DailyPurchase, value: any) => {
    setPurchases(prev => {
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
      id: Date.now().toString(),
      supplierName: "",
      supplierCode: "",
      supplierPhone: "",
      batteryType: "بطاريات عادية",
      quantity: 0,
      price: 0,
      total: 0,
      discount: 0,
      finalTotal: 0,
      saved: false
    };
    setPurchases(prev => [...prev, newPurchase]);
  };

  const deleteRow = (index: number) => {
    if (purchases.length > 1) {
      setPurchases(prev => prev.filter((_, i) => i !== index));
      toast({
        title: language === "ar" ? "تم حذف السطر" : "Row Deleted",
        description: language === "ar" ? "تم حذف السطر بنجاح" : "Row deleted successfully",
        duration: 2000,
      });
    }
  };

  const savePurchase = (index: number) => {
    const purchase = purchases[index];
    
    // Validate required fields
    if (!purchase.supplierName || !purchase.quantity || !purchase.price) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Mark as saved
    updatePurchase(index, 'saved', true);
    
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ البيانات بنجاح" : "Data saved successfully",
      duration: 2000,
    });

    // Add new row and focus on it
    addRow();
    setTimeout(() => {
      setFocusedCell({ row: purchases.length, col: 'supplierName' });
    }, 100);
  };

  const clearAllData = () => {
    setPurchases([{
      id: "1",
      supplierName: "",
      supplierCode: "",
      supplierPhone: "",
      batteryType: "بطاريات عادية",
      quantity: 0,
      price: 0,
      total: 0,
      discount: 0,
      finalTotal: 0,
      saved: false
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    const totalRows = purchases.length;
    const fields = ['supplierName', 'batteryType', 'quantity', 'price', 'discount', 'save'];
    const currentFieldIndex = fields.indexOf(field);

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      if (field === 'discount') {
        // Move to save button
        setFocusedCell({ row: rowIndex, col: 'save' });
      } else if (field === 'save') {
        // Save and create new row
        savePurchase(rowIndex);
      } else if (currentFieldIndex < fields.length - 2) { // -2 to skip save button in normal navigation
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
    // Check for exact match first
    const foundSupplier = findSupplierBySearch(value);
    
    if (foundSupplier) {
      // Direct selection - supplier found, no dialog needed
      updatePurchase(rowIndex, 'supplierName', foundSupplier.name);
      updatePurchase(rowIndex, 'supplierCode', foundSupplier.supplierCode);
      updatePurchase(rowIndex, 'supplierPhone', foundSupplier.phone);
      
      toast({
        title: language === "ar" ? "تم العثور على المورد" : "Supplier Found",
        description: language === "ar" ? `تم اختيار ${foundSupplier.name}` : `Selected ${foundSupplier.name}`,
        duration: 2000,
      });
      
      // Move to next field
      setTimeout(() => {
        setFocusedCell({ row: rowIndex, col: 'batteryType' });
      }, 100);
    } else {
      // Update supplier name for manual entry
      updatePurchase(rowIndex, 'supplierName', value);
    }
  };

  const totalDailyAmount = purchases.reduce((sum, purchase) => sum + purchase.finalTotal, 0);

  // Focus management
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
                {purchases.map((purchase, index) => (
                  <tr key={purchase.id} className={`border-b hover:bg-gray-50 ${purchase.saved ? 'bg-green-50' : ''}`}>
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
                        onValueChange={(value) => updatePurchase(index, 'batteryType', value)}
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
                        onChange={(e) => updatePurchase(index, 'quantity', Number(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                        onFocus={() => setFocusedCell({row: index, col: 'quantity'})}
                        className="text-center"
                      />
                    </td>
                    
                    <td className="p-2">
                      <Input
                        id={`${index}-price`}
                        type="number"
                        step="0.01"
                        value={purchase.price || ''}
                        onChange={(e) => updatePurchase(index, 'price', Number(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'price')}
                        onFocus={() => setFocusedCell({row: index, col: 'price'})}
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
                        onChange={(e) => updatePurchase(index, 'discount', Number(e.target.value) || 0)}
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
                          onClick={() => savePurchase(index)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'save')}
                          variant="outline"
                          size="sm"
                          className={`text-green-600 hover:text-green-800 ${purchase.saved ? 'bg-green-100' : ''}`}
                          title={language === "ar" ? "حفظ" : "Save"}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteRow(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
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
