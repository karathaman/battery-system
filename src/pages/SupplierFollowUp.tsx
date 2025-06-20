import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Search, Calendar, TrendingUp, User, Package, DollarSign, Edit3, Save, X, Ban, UserPlus, FileDown, RefreshCw, FileText, MessageCircle, CheckCircle, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AddSupplierDialog } from "@/components/AddSupplierDialog";
import { SupplierDetailsDialog } from "@/components/SupplierDetailsDialog";
import { EditSupplierDialog } from "@/components/EditSupplierDialog";
import { useSuppliers } from "@/hooks/useSuppliers";
import { supabase } from "@/integrations/supabase/client"; // تأكد من أن المسار صحيح حسب مشروعك
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupplierLastPurchases } from "@/hooks/useSupplierLastPurchases";
import { SupplierCard } from "@/components/SupplierCard";

const SupplierFollowUp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [supplierNotes, setSupplierNotes] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSupplierData, setEditingSupplierData] = useState<any>(null);

  const {
    suppliers,
    pagination,
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    blockSupplier,
    unblockSupplier,
    isCreating,
    isUpdating,
    isDeleting
  } = useSuppliers(1, 50, { searchTerm });

  const [sortField, setSortField] = useState("balance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const generateNextSupplierCode = () => {
    if (suppliers.length === 0) return "S001";

    const maxCode = suppliers.reduce((max, supplier) => {
      const codeNumber = parseInt(supplier.supplierCode.replace('S', ''));
      return codeNumber > max ? codeNumber : max;
    }, 0);

    return `S${String(maxCode + 1).padStart(3, '0')}`;
  };
  const exportToExcel = () => {
    // إعداد رؤوس الأعمدة
    const headers = [
      "كود المورد",
      "الاسم",
      "الجوال",
      "الوصف",
      "الرصيد",
      "آخر توريد",
      "أيام منذ آخر توريد",
      "آخر رسالة",
      "أيام منذ آخر رسالة",
      "ملاحظات"
    ];
  
    // إعداد الصفوف
    const rows = sortedSuppliers.map(supplier => [
      supplier.supplierCode,
      supplier.name,
      supplier.phone,
      supplier.description || "",
      supplier.balance,
      supplier.lastPurchase || "",
      supplier.lastPurchase ? getDaysSinceLastPurchase(supplier.lastPurchase) : "",
      supplier.lastMessageSent || "",
      supplier.lastMessageSent ? getDaysSinceLastMessage(supplier.lastMessageSent) : "",
      supplier.notes || ""
    ]);
  
    // إضافة BOM لضمان عرض النصوص العربية بشكل صحيح
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map(row => row.join(",")) // تأكد من أن كل خلية مفصولة بفاصلة
        .join("\n");
  
    // إنشاء رابط لتنزيل الملف
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "suppliers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    // عرض رسالة نجاح
    toast({
      title: "تم التصدير",
      description: "تم تصدير بيانات الموردين إلى Excel بنجاح",
      duration: 2000,
    });
  };
  
  

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDescription("");
    setFilterLastMessageDays(null);
    setFilterLastPurchaseDays(null);
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين جميع الفلاتر",
      duration: 2000,
    });
  };

  const generateSupplierStatement = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setShowDetailsDialog(true);
    }
  };

  const saveNotes = (supplierId: string) => {
    updateSupplier({
      id: supplierId,
      data: { notes: supplierNotes }
    });

    setEditingSupplier(null);
    setSupplierNotes("");
  };

  const getDaysSinceLastPurchase = (lastPurchase?: string) => {
    if (!lastPurchase) return 999;
    const today = new Date();
    const purchaseDate = new Date(lastPurchase);
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSinceLastMessage = (lastMessage?: string) => {
    if (!lastMessage) return 999;
    const today = new Date();
    const messageDate = new Date(lastMessage);
    const diffTime = Math.abs(today.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const sendWhatsAppMessage = (supplier: any) => {
    const message = `مرحباً ${supplier.name}، نود التواصل معكم بخصوص التوريدات.`;
    const whatsappUrl = `https://wa.me/${supplier.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    updateSupplier({
      id: supplier.id,
      data: {
        messageSent: true,
        lastMessageSent: new Date().toISOString().split('T')[0]
      }
    });

    toast({
      title: "تم فتح واتساب",
      description: `تم فتح محادثة واتساب مع المورد: ${supplier.name}`,
      duration: 2000,
    });
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplierData(supplier); // تعيين بيانات المورد إلى الحالة
    setShowEditDialog(true); // فتح الديالوج
  };

  const handleSupplierUpdated = (updatedSupplier: any) => {
    updateSupplier({
      id: updatedSupplier.id,
      data: {
        name: updatedSupplier.name,
        phone: updatedSupplier.phone,
        description: updatedSupplier.description,
        notes: updatedSupplier.notes
      }
    });
  };

  const handleSupplierAdded = (supplierData: any) => {
    createSupplier(supplierData);
    setShowAddDialog(false);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteSupplier(supplierId);
    }
  };

  const handleBlockSupplier = (supplierId: string) => {
    const reason = prompt('يرجى إدخال سبب الحظر:');
    if (reason) {
      blockSupplier({ id: supplierId, reason });
    }
  };

  const handleUnblockSupplier = (supplierId: string) => {
    if (confirm('هل أنت متأكد من إلغاء حظر هذا المورد؟')) {
      unblockSupplier(supplierId);
    }
  };

  const [filterDescription, setFilterDescription] = useState<string>(""); // فلتر الوصف
  const [filterLastMessageDays, setFilterLastMessageDays] = useState<number | "never" | null>(null); // فلتر آخر رسالة
  const [filterLastPurchaseDays, setFilterLastPurchaseDays] = useState<number | null>(null); // فلتر آخر توريد

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearchTerm =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDescription =
      filterDescription === "" || supplier.description?.includes(filterDescription);

    const matchesLastMessage =
      filterLastMessageDays === null ||
      (filterLastMessageDays === "never"
        ? !supplier.lastMessageSent
        : supplier.lastMessageSent &&
          getDaysSinceLastMessage(supplier.lastMessageSent) <= filterLastMessageDays);

    const matchesLastPurchase =
      filterLastPurchaseDays === null ||
      (supplier.lastPurchase &&
        getDaysSinceLastPurchase(supplier.lastPurchase) >= filterLastPurchaseDays); // تعديل الشرط ليشمل الموردين الذين مر على آخر توريد لهم عدد الأيام المحدد

    return matchesSearchTerm && matchesDescription && matchesLastMessage && matchesLastPurchase;
  });

  // فرز الموردين حسب الفلتر المختار
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a] ?? 0;
    let bValue: any = b[sortField as keyof typeof b] ?? 0;
    if (sortField === "lastPurchase") {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }
    if (sortDirection === "asc") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const resetBalance = async (supplierId) => {
    try {
      // تأكد من أن لديك طريقة لتحديث الرصيد في قاعدة البيانات
      const { error } = await supabase
        .from("suppliers")
        .update({ balance: 0 })
        .eq("id", supplierId);

      if (error) {
        console.error("Error resetting balance:", error);
        toast({
          title: "خطأ",
          description: "فشل في تصفير الرصيد",
          variant: "destructive",
          duration: 2000,
        });
      } else {
        toast({
          title: "تم تصفير الرصيد",
          description: "تم تصفير رصيد المورد بنجاح",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error resetting balance:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تصفير الرصيد",
        variant: "destructive",
        duration: 2000,
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-[#eff6ff] to-orange-700 text-white">
          <CardTitle
            className="flex items-center gap-2 flex-row-reverse text-[#2a4ed8] text-lg sm:text-xl justify-center"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إدارة الموردين [ {sortedSuppliers.length} ]
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-1 gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث عن مورد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-sm"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  />
                </div>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="flex items-center gap-2 flex-row-reverse bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <UserPlus className="w-4 h-4" />
                  إضافة مورد جديد
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-orange-100 to-orange-50 border-0 shadow-md">
              <CardContent className="p-3 sm:p-4 text-center">
                <Truck className="w-7 h-7 sm:w-9 sm:h-9 mx-auto mb-2 text-orange-600" />
                <p className="text-xl sm:text-3xl font-bold text-orange-700">{suppliers.length}</p>
                <p className="text-xs sm:text-sm text-orange-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي الموردين
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-100 to-green-50 border-0 shadow-md">
              <CardContent className="p-3 sm:p-4 text-center">
                <TrendingUp className="w-7 h-7 sm:w-9 sm:h-9 mx-auto mb-2 text-green-600" />
                <p className="text-xl sm:text-3xl font-bold text-green-700">
                  {suppliers.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-green-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي التوريدات
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-0 shadow-md">
              <CardContent className="p-3 sm:p-4 text-center">
                <Package className="w-7 h-7 sm:w-9 sm:h-9 mx-auto mb-2 text-yellow-700" />
                <p className="text-xl sm:text-3xl font-bold text-yellow-700">
                  {suppliers.reduce((sum, s) => sum + s.totalPurchases, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-yellow-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي الكميات الموردة
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-0 shadow-md">
              <CardContent className="p-3 sm:p-4 text-center">
                <img src="/assets/icons/SaudiRG.svg" alt="Custom Icon" className="w-9 h-9 mx-auto mb-2" />
                <p className="text-xl sm:text-3xl font-bold text-blue-700">
                  {suppliers.reduce((sum, s) => sum + s.balance, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-blue-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي الأرصدة
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2 w-full justify-between items-center">
            <div className="flex gap-4 flex-wrap w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[180px] max-w-[220px]">
                <label className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  نوع العميل
                </label>
                <select
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  className="border rounded px-2 py-2 text-sm w-full h-10"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <option value="">كل العملاء</option>
                  <option value="عميل عادي">عميل عادي</option>
                  <option value="عميل مميز">عميل مميز</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[180px] max-w-[220px]">
                <label className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  آخر رسالة
                </label>
                <select
                  value={filterLastMessageDays === null ? "" : filterLastMessageDays === "never" ? "never" : filterLastMessageDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") setFilterLastMessageDays(null);
                    else if (value === "never") setFilterLastMessageDays("never");
                    else setFilterLastMessageDays(parseInt(value));
                  }}
                  className="border rounded px-2 py-2 text-sm w-full h-10"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <option value="">إظهار الكل</option>
                  <option value="7">آخر 7 أيام</option>
                  <option value="30">آخر 30 يوما</option>
                  <option value="60">آخر 60 يومًا</option>
                  <option value="never">لم ترسل</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[180px] max-w-[220px]">
                <label className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  أكثر من
                </label>
                <select
                  value={filterLastPurchaseDays || ""}
                  onChange={(e) => setFilterLastPurchaseDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="border rounded px-2 py-2 text-sm w-full h-10"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <option value="">كل التوريدات</option>
                  <option value="7">أكثر من 7 أيام</option>
                  <option value="30">أكثر من 30 يومًا</option>
                  <option value="60">أكثر من 60 يومًا</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[180px] max-w-[220px]">
                <label className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  ترتيب حسب
                </label>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="text-right w-32" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance">الرصيد</SelectItem>
                      <SelectItem value="lastPurchase">آخر توريد</SelectItem>
                      <SelectItem value="totalPurchases">مجموع الكميات</SelectItem>
                      <SelectItem value="totalAmount">إجمالي المبالغ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortDirection} onValueChange={val => setSortDirection(val as "asc" | "desc")}>
                    <SelectTrigger className="text-right w-24" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">تصاعدي</SelectItem>
                      <SelectItem value="desc">تنازلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[180px] max-w-[220px]">
                <label className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إعادة تعيين الفلاتر
                </label>
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="flex items-center gap-2 w-full h-10"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة تعيين  
                </Button>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[180px] max-w-[220px]">
                <label className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  تصدير إلى Excel
                </label>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="flex items-center gap-2 w-full h-10"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <FileDown className="w-4 h-4" />
                  تصدير  
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedSuppliers.map(supplier => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            resetBalance={resetBalance}
            getDaysSinceLastPurchase={getDaysSinceLastPurchase}
            getDaysSinceLastMessage={getDaysSinceLastMessage}
            sendWhatsAppMessage={sendWhatsAppMessage}
            handleEditSupplier={handleEditSupplier}
            handleDeleteSupplier={handleDeleteSupplier}
            handleBlockSupplier={handleBlockSupplier}
            handleUnblockSupplier={handleUnblockSupplier}
            saveNotes={saveNotes}
            editingSupplier={editingSupplier}
            setEditingSupplier={setEditingSupplier}
            supplierNotes={supplierNotes}
            setSupplierNotes={setSupplierNotes}
            generateSupplierStatement={generateSupplierStatement}
          />
        ))}
      </div>

      <AddSupplierDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSupplierAdded={handleSupplierAdded}
        nextSupplierCode={generateNextSupplierCode()}
      />

      <SupplierDetailsDialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        supplier={selectedSupplier}
      />

            <EditSupplierDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        supplier={editingSupplierData} // تمرير بيانات المورد إلى الديالوج
        onSupplierUpdated={handleSupplierUpdated}
      />
    </div>
  );
};

export default SupplierFollowUp;
