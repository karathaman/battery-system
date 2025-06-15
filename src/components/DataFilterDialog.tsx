import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Trash2, AlertTriangle, DollarSign, Package, FileText, StickyNote, CheckSquare, Battery, ShoppingCart } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCustomers } from "@/hooks/useCustomers";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useBatteryTypes } from "@/hooks/useBatteryTypes";

interface DataFilterDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FilterOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresDateRange?: boolean;
  requiresEntitySelection?: 'customers' | 'suppliers' | 'battery-types';
}

export const DataFilterDialog = ({ open, onClose }: DataFilterDialogProps) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: ""
  });
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { suppliers } = useSuppliers();
  const { customers } = useCustomers();
  const { batteryTypes } = useBatteryTypes();

  const filterOptions: FilterOption[] = [
    // المبيعات اليومية
    {
      id: "daily-sales-all",
      label: "جميع المبيعات اليومية",
      description: "حذف جميع بيانات المبيعات اليومية",
      icon: <ShoppingCart className="w-5 h-5 text-green-600" />
    },
    {
      id: "daily-sales-date-range",
      label: "المبيعات اليومية خلال فترة",
      description: "حذف المبيعات اليومية في فترة زمنية محددة",
      icon: <Calendar className="w-5 h-5 text-green-600" />,
      requiresDateRange: true
    },
    // فواتير المبيعات
    {
      id: "sales-invoices-all",
      label: "جميع فواتير المبيعات",
      description: "حذف جميع فواتير المبيعات",
      icon: <FileText className="w-5 h-5 text-emerald-600" />
    },
    {
      id: "sales-invoices-date-range",
      label: "فواتير المبيعات خلال فترة",
      description: "حذف فواتير المبيعات في فترة زمنية محددة",
      icon: <Calendar className="w-5 h-5 text-emerald-600" />,
      requiresDateRange: true
    },
    // المشتريات اليومية
    {
      id: "daily-purchases-all",
      label: "جميع المشتريات اليومية",
      description: "حذف جميع بيانات المشتريات اليومية",
      icon: <Package className="w-5 h-5 text-blue-600" />
    },
    {
      id: "daily-purchases-date-range",
      label: "المشتريات اليومية خلال فترة",
      description: "حذف المشتريات اليومية في فترة زمنية محددة",
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      requiresDateRange: true
    },
    // فواتير المشتريات
    {
      id: "purchase-invoices-all",
      label: "جميع فواتير المشتريات",
      description: "حذف جميع فواتير المشتريات",
      icon: <FileText className="w-5 h-5 text-indigo-600" />
    },
    {
      id: "purchase-invoices-date-range",
      label: "فواتير المشتريات خلال فترة",
      description: "حذف فواتير المشتريات في فترة زمنية محددة",
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      requiresDateRange: true
    },
    // أرصدة الموردين
    {
      id: "suppliers-balances-all",
      label: "تصفير أرصدة جميع الموردين",
      description: "تصفير الأرصدة والكميات لجميع الموردين",
      icon: <DollarSign className="w-5 h-5 text-purple-600" />
    },
    {
      id: "suppliers-balances-selected",
      label: "تصفير أرصدة موردين محددين",
      description: "تصفير الأرصدة والكميات لموردين محددين",
      icon: <DollarSign className="w-5 h-5 text-purple-600" />,
      requiresEntitySelection: 'suppliers'
    },
    // أرصدة العملاء
    {
      id: "customers-balances-all",
      label: "تصفير أرصدة جميع العملاء",
      description: "تصفير الأرصدة والكميات لجميع العملاء",
      icon: <DollarSign className="w-5 h-5 text-orange-600" />
    },
    {
      id: "customers-balances-selected",
      label: "تصفير أرصدة عملاء محددين",
      description: "تصفير الأرصدة والكميات لعملاء محددين",
      icon: <DollarSign className="w-5 h-5 text-orange-600" />,
      requiresEntitySelection: 'customers'
    },
    // السندات
    {
      id: "receipt-vouchers-all",
      label: "جميع سندات القبض",
      description: "حذف جميع سندات القبض",
      icon: <FileText className="w-5 h-5 text-green-700" />
    },
    {
      id: "payment-vouchers-all",
      label: "جميع سندات الصرف",
      description: "حذف جميع سندات الصرف",
      icon: <FileText className="w-5 h-5 text-red-700" />
    },
    {
      id: "receipt-vouchers-entity",
      label: "سندات قبض لعميل/مورد محدد",
      description: "حذف سندات القبض لعميل أو مورد محدد",
      icon: <FileText className="w-5 h-5 text-green-700" />,
      requiresEntitySelection: 'customers'
    },
    {
      id: "payment-vouchers-entity",
      label: "سندات صرف لعميل/مورد محدد",
      description: "حذف سندات الصرف لعميل أو مورد محدد",
      icon: <FileText className="w-5 h-5 text-red-700" />,
      requiresEntitySelection: 'suppliers'
    },
    // الملاحظات والمهام
    {
      id: "notes-all",
      label: "جميع الملاحظات",
      description: "حذف جميع الملاحظات اللاصقة",
      icon: <StickyNote className="w-5 h-5 text-yellow-600" />
    },
    {
      id: "tasks-all",
      label: "جميع قوائم المهام",
      description: "حذف جميع قوائم المهام",
      icon: <CheckSquare className="w-5 h-5 text-indigo-600" />
    },
    // أنواع البطاريات
    {
      id: "battery-types-all",
      label: "تصفير جميع أنواع البطاريات",
      description: "تصفير الكميات لجميع أنواع البطاريات",
      icon: <Battery className="w-5 h-5 text-emerald-600" />
    },
    {
      id: "battery-types-selected",
      label: "تصفير أنواع بطاريات محددة",
      description: "تصفير الكميات لأنواع بطاريات محددة",
      icon: <Battery className="w-5 h-5 text-emerald-600" />,
      requiresEntitySelection: 'battery-types'
    }
  ];

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const getEntitiesForSelection = () => {
    const selectedOption = filterOptions.find(option => 
      selectedFilters.includes(option.id) && option.requiresEntitySelection
    );
    
    if (!selectedOption) return [];

    switch (selectedOption.requiresEntitySelection) {
      case 'customers':
        return customers?.map(customer => ({
          id: customer.id,
          name: customer.name,
          code: customer.customerCode
        })) || [];
      case 'suppliers':
        return suppliers?.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          code: supplier.supplierCode
        })) || [];
      case 'battery-types':
        return batteryTypes?.map(batteryType => ({
          id: batteryType.id,
          name: batteryType.name,
          code: batteryType.name
        })) || [];
      default:
        return [];
    }
  };

  const handleApplyFilters = () => {
    if (selectedFilters.length === 0) return;
    setShowConfirmDialog(true);
  };

  const executeFilters = async () => {
    // هنا سيتم تنفيذ عمليات الحذف والتصفير
    console.log("Selected filters:", selectedFilters);
    console.log("Date range:", dateRange);
    console.log("Selected entities:", selectedEntities);
    
    // TODO: تنفيذ عمليات الحذف والتصفير بناءً على الخيارات المحددة
    
    setShowConfirmDialog(false);
    onClose();
  };

  const needsDateRange = selectedFilters.some(filterId => 
    filterOptions.find(option => option.id === filterId)?.requiresDateRange
  );

  const needsEntitySelection = selectedFilters.some(filterId => 
    filterOptions.find(option => option.id === filterId)?.requiresEntitySelection
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-center bg-red-50 py-2 rounded-md" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="w-6 h-6 text-red-600" />
                تصفية وحذف البيانات
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sales" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبيعات</TabsTrigger>
                <TabsTrigger value="purchases" style={{ fontFamily: 'Tajawal, sans-serif' }}>المشتريات</TabsTrigger>
                <TabsTrigger value="balances" style={{ fontFamily: 'Tajawal, sans-serif' }}>الأرصدة</TabsTrigger>
                <TabsTrigger value="vouchers" style={{ fontFamily: 'Tajawal, sans-serif' }}>السندات</TabsTrigger>
                <TabsTrigger value="others" style={{ fontFamily: 'Tajawal, sans-serif' }}>أخرى</TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      بيانات المبيعات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filterOptions
                      .filter(option => option.id.includes('sales') || option.id.includes('daily-sales'))
                      .map(option => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={option.id}
                            checked={selectedFilters.includes(option.id)}
                            onCheckedChange={() => handleFilterToggle(option.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {option.icon}
                            <div>
                              <label htmlFor={option.id} className="font-medium cursor-pointer" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.label}
                              </label>
                              <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="purchases" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      بيانات المشتريات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filterOptions
                      .filter(option => option.id.includes('purchase') || option.id.includes('daily-purchases'))
                      .map(option => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={option.id}
                            checked={selectedFilters.includes(option.id)}
                            onCheckedChange={() => handleFilterToggle(option.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {option.icon}
                            <div>
                              <label htmlFor={option.id} className="font-medium cursor-pointer" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.label}
                              </label>
                              <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="balances" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      تصفير الأرصدة والكميات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filterOptions
                      .filter(option => option.id.includes('balances') || option.id.includes('battery-types'))
                      .map(option => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={option.id}
                            checked={selectedFilters.includes(option.id)}
                            onCheckedChange={() => handleFilterToggle(option.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {option.icon}
                            <div>
                              <label htmlFor={option.id} className="font-medium cursor-pointer" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.label}
                              </label>
                              <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vouchers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      سندات القبض والصرف
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filterOptions
                      .filter(option => option.id.includes('vouchers'))
                      .map(option => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={option.id}
                            checked={selectedFilters.includes(option.id)}
                            onCheckedChange={() => handleFilterToggle(option.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {option.icon}
                            <div>
                              <label htmlFor={option.id} className="font-medium cursor-pointer" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.label}
                              </label>
                              <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="others" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الملاحظات والمهام
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filterOptions
                      .filter(option => option.id.includes('notes') || option.id.includes('tasks'))
                      .map(option => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={option.id}
                            checked={selectedFilters.includes(option.id)}
                            onCheckedChange={() => handleFilterToggle(option.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {option.icon}
                            <div>
                              <label htmlFor={option.id} className="font-medium cursor-pointer" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.label}
                              </label>
                              <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* فلاتر التاريخ */}
            {needsDateRange && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    تحديد الفترة الزمنية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        من تاريخ
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        إلى تاريخ
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* اختيار الكيانات */}
            {needsEntitySelection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    اختيار العناصر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {getEntitiesForSelection().map(entity => (
                      <div key={entity.id} className="flex items-center space-x-2 space-x-reverse p-2 border rounded hover:bg-gray-50">
                        <Checkbox
                          id={entity.id}
                          checked={selectedEntities.includes(entity.id)}
                          onCheckedChange={() => handleEntityToggle(entity.id)}
                        />
                        <label htmlFor={entity.id} className="text-sm cursor-pointer" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {entity.name} ({entity.code})
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* أزرار التحكم */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClose}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleApplyFilters}
                disabled={selectedFilters.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                تطبيق التصفية ({selectedFilters.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* دايلوج التأكيد */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <AlertTriangle className="w-6 h-6" />
              تأكيد عملية الحذف
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Tajawal, sans-serif' }}>
              أنت على وشك حذف أو تصفير البيانات المحددة. هذه العملية لا يمكن التراجع عنها.
              هل أنت متأكد من المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeFilters}
              className="bg-red-600 hover:bg-red-700"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
