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

interface Purchase {
  id: string;
  date: string;
  batteryType: string;
  quantity: number;
  pricePerKg: number;
  total: number;
  discount: number;
  finalTotal: number;
}

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  phone: string;
  description?: string;
  lastPurchase?: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  purchases: Purchase[];
  notes?: string;
  isBlocked?: boolean;
  blockReason?: string;
  balance: number;
  messageSent?: boolean;
  lastMessageSent?: string;
  last2Quantities?: number[];
  last2Prices?: number[];
  last2BatteryTypes?: string[];
}

// Mock data - سيتم استبدالها ببيانات Supabase
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    supplierCode: "S001",
    name: "مورد البطاريات الذهبية",
    phone: "0501234567",
    description: "مورد موثوق للبطاريات عالية الجودة",
    lastPurchase: "2024-01-15",
    totalPurchases: 15,
    totalAmount: 4500,
    averagePrice: 300,
    balance: -1200,
    notes: "مورد مميز، توريدات منتظمة كل شهر",
    messageSent: true,
    lastMessageSent: "2024-01-10",
    last2Quantities: [12, 8],
    last2Prices: [25, 30],
    last2BatteryTypes: ["بطاريات عادية", "بطاريات جافة"],
    purchases: [
      {
        id: "p1",
        date: "2024-01-15",
        batteryType: "بطاريات عادية",
        quantity: 12,
        pricePerKg: 25,
        total: 300,
        discount: 0,
        finalTotal: 300
      },
      {
        id: "p2",
        date: "2024-01-10",
        batteryType: "بطاريات جافة",
        quantity: 8,
        pricePerKg: 30,
        total: 240,
        discount: 0,
        finalTotal: 240
      }
    ]
  },
  {
    id: "2",
    supplierCode: "S002",
    name: "شركة البطاريات المتطورة",
    phone: "0507654321",
    description: "متخصص في البطاريات اليابانية",
    lastPurchase: "2024-01-10",
    totalPurchases: 8,
    totalAmount: 2400,
    averagePrice: 300,
    balance: 800,
    notes: "يوفر البطاريات اليابانية عالية الجودة",
    messageSent: false,
    last2Quantities: [10, 6],
    last2Prices: [28, 32],
    last2BatteryTypes: ["بطاريات زجاج", "بطاريات تعبئة"],
    purchases: []
  }
];

const SupplierFollowUp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [supplierNotes, setSupplierNotes] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSupplierData, setEditingSupplierData] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateNextSupplierCode = () => {
    if (suppliers.length === 0) return "S001";

    const maxCode = suppliers.reduce((max, supplier) => {
      const codeNumber = parseInt(supplier.supplierCode.replace('S', ''));
      return codeNumber > max ? codeNumber : max;
    }, 0);

    return `S${String(maxCode + 1).padStart(3, '0')}`;
  };

  const exportToExcel = () => {
    toast({
      title: "تم التصدير",
      description: "تم تصدير بيانات الموردين إلى Excel بنجاح",
      duration: 2000,
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
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

  const sendMessageToSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.map(supplier =>
      supplier.id === supplierId
        ? {
          ...supplier,
          messageSent: true,
          lastMessageSent: new Date().toISOString().split('T')[0]
        }
        : supplier
    ));

    const supplier = suppliers.find(s => s.id === supplierId);
    toast({
      title: "تم إرسال الرسالة",
      description: `تم إرسال رسالة للمورد: ${supplier?.name}`,
      duration: 2000,
    });
  };

  const blockSupplier = (supplierId: string) => {
    const reason = prompt("سبب حظر المورد:");
    if (reason) {
      setSuppliers(prev => prev.map(supplier =>
        supplier.id === supplierId
          ? { ...supplier, isBlocked: true, blockReason: reason }
          : supplier
      ));

      toast({
        title: "تم حظر المورد",
        description: "تم حظر المورد بنجاح",
        duration: 2000,
      });
    }
  };

  const unblockSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.map(supplier =>
      supplier.id === supplierId
        ? { ...supplier, isBlocked: false, blockReason: undefined }
        : supplier
    ));

    toast({
      title: "تم إلغاء حظر المورد",
      description: "تم إلغاء حظر المورد بنجاح",
      duration: 2000,
    });
  };

  const saveNotes = (supplierId: string) => {
    setSuppliers(prev => prev.map(supplier =>
      supplier.id === supplierId
        ? { ...supplier, notes: supplierNotes }
        : supplier
    ));

    setEditingSupplier(null);
    setSupplierNotes("");

    toast({
      title: "تم حفظ الملاحظات",
      description: "تم حفظ ملاحظات المورد بنجاح",
      duration: 2000,
    });
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

  const sendWhatsAppMessage = (supplier: Supplier) => {
    const message = `مرحباً ${supplier.name}، نود التواصل معكم بخصوص التوريدات.`;
    const whatsappUrl = `https://wa.me/${supplier.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setSuppliers(prev => prev.map(s =>
      s.id === supplier.id
        ? {
          ...s,
          messageSent: true,
          lastMessageSent: new Date().toISOString().split('T')[0]
        }
        : s
    ));

    toast({
      title: "تم فتح واتساب",
      description: `تم فتح محادثة واتساب مع المورد: ${supplier.name}`,
      duration: 2000,
    });
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplierData(supplier);
    setShowEditDialog(true);
  };

  const handleSupplierUpdated = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s =>
      s.id === updatedSupplier.id ? updatedSupplier : s
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-[#eff6ff] to-orange-700 text-white">
          <CardTitle
            className="flex items-center gap-2 flex-row-reverse text-[#2a4ed8] text-lg sm:text-xl justify-center"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إدارة الموردين [ {filteredSuppliers.length} ]
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
                {/* Add New Supplier Button */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-lg sm:text-2xl font-bold">{suppliers.length}</p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي الموردين
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
                <p className="text-lg sm:text-2xl font-bold">
                  {suppliers.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي التوريدات
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-lg sm:text-2xl font-bold">
                  {suppliers.reduce((sum, s) => sum + s.balance, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي الأرصدة
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-between items-center">
            {/* فلتر حسب آخر رسالة */}
            <div className="flex gap-4 flex-wrap w-full">
              {/* Filter by Last Message */}
              <select
                className="border rounded px-2 py-1 text-xs flex-1 min-w-[180px]"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                onChange={e => {
                  const value = e.target.value;
                  if (value === "") {
                    setSuppliers(mockSuppliers);
                  } else if (value === "never") {
                    setSuppliers(mockSuppliers.filter(s => !s.lastMessageSent));
                  } else if (value === "7") {
                    setSuppliers(mockSuppliers.filter(s => getDaysSinceLastMessage(s.lastMessageSent) > 7));
                  } else if (value === "30") {
                    setSuppliers(mockSuppliers.filter(s => getDaysSinceLastMessage(s.lastMessageSent) > 30));
                  }
                }}
                defaultValue=""
              >
                <option value="">كل الرسائل</option>
                <option value="never">لم ترسل له رسالة</option>
                <option value="7">لم ترسل له رسالة منذ أكثر من 7 أيام</option>
                <option value="30">لم ترسل له رسالة منذ أكثر من 30 يوم</option>
              </select>

              {/* Reset Filters Button */}
              <Button
                onClick={resetFilters}
                variant="outline"
                className="flex items-center gap-2 flex-1 min-w-[180px]"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تعيين الفلاتر
              </Button>

              {/* Export to Excel Button */}
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center gap-2 flex-1 min-w-[180px]"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <FileDown className="w-4 h-4" />
                تصدير Excel
              </Button>
            </div>
 
          </div>

        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredSuppliers.map(supplier => (
          <Card key={supplier.id} className={`shadow-md hover:shadow-lg transition-shadow ${supplier.isBlocked ? 'border-red-200 bg-red-50' : ''}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-semibold truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {supplier.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-row-reverse flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {supplier.supplierCode}
                      </Badge>
                      {supplier.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          محظور
                        </Badge>
                      )}
                      {supplier.messageSent && (
                        <Badge variant="outline" className="text-xs">
                          تم إرسال رسالة
                        </Badge>
                      )}
                      {getDaysSinceLastPurchase(supplier.lastPurchase) > 30 && (
                        <Badge variant="destructive" className="text-xs">
                          متأخر
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-gray-600">{supplier.phone}</p>
                  {supplier.description && (
                    <p className="text-xs text-gray-500 truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {supplier.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    آخر توريد: {supplier.lastPurchase || "لا يوجد"}
                    {supplier.lastPurchase && (
                      <span className={`ml-1 ${getDaysSinceLastPurchase(supplier.lastPurchase) > 30 ? 'text-red-600' : 'text-green-600'}`}>
                        ({getDaysSinceLastPurchase(supplier.lastPurchase)} يوم)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    آخر رسالة: {supplier.lastMessageSent || "لم ترسل"}
                    {supplier.lastMessageSent && (
                      <span className="ml-1 text-blue-600">
                        ({getDaysSinceLastMessage(supplier.lastMessageSent)} يوم)
                      </span>
                    )}
                  </p>
                  <p className={`text-xs font-semibold ${supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    الرصيد: {supplier.balance.toLocaleString()} ريال
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>التوريدات</p>
                    <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.totalPurchases}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</p>
                    <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{supplier.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Last 2 Purchases Comparison */}
                {supplier.last2Quantities && supplier.last2Quantities.length >= 2 && (
                  <table className="w-full text-xs bg-blue-50 rounded mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <thead>
                      <tr className="text-blue-700 font-semibold text-center"> 
                        <th className="p-1 border-b border-blue-200">الصنف</th>
                        <th className="p-1 border-b border-blue-200">الكمية</th>
                        <th className="p-1 border-b border-blue-200">السعر</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white text-center"> 
                        <td className="p-1 border-b border-blue-100">{supplier.last2BatteryTypes?.[0] || "غير محدد"}</td>
                        <td className="p-1 border-b border-blue-100">{supplier.last2Quantities[0]} كيلو</td>
                        <td className="p-1 border-b border-blue-100">{supplier.last2Prices?.[0]} ريال</td>
                      </tr>
                      <tr className="bg-white text-center"> 
                        <td className="p-1 border-b border-blue-100">{supplier.last2BatteryTypes?.[1] || "غير محدد"}</td>
                        <td className="p-1 border-b border-blue-100">{supplier.last2Quantities[1]} كيلو</td>
                        <td className="p-1 border-b border-blue-100">{supplier.last2Prices?.[1]} ريال</td>
                      </tr>
                      
                    </tbody>
                  </table>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={() => generateSupplierStatement(supplier.id)}
                    variant="default"
                    size="sm"
                    className="w-full flex items-center gap-2 flex-row-reverse text-xs"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <FileText className="w-3 h-3" />
                    عرض التفاصيل وكشف الحساب
                  </Button>

                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      onClick={() => sendWhatsAppMessage(supplier)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 flex-row-reverse text-xs bg-green-50 hover:bg-green-100"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                      disabled={supplier.messageSent && getDaysSinceLastMessage(supplier.lastMessageSent) < 7}
                    >
                      <MessageCircle className="w-3 h-3" />
                      واتساب
                    </Button>

                    <Button
                      onClick={() => handleEditSupplier(supplier)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 flex-row-reverse text-xs"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Edit className="w-3 h-3" />
                      تعديل
                    </Button>

                    {supplier.isBlocked ? (
                      <Button
                        onClick={() => unblockSupplier(supplier.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 flex-row-reverse text-xs text-green-600"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        إلغاء الحظر
                      </Button>
                    ) : (
                      <Button
                        onClick={() => blockSupplier(supplier.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 flex-row-reverse text-xs text-red-600"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <Ban className="w-3 h-3" />
                        حظر
                      </Button>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="mt-2">
                    {editingSupplier === supplier.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={supplierNotes}
                          onChange={(e) => setSupplierNotes(e.target.value)}
                          placeholder="أضف ملاحظات..."
                          className="text-xs"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <Button
                            onClick={() => saveNotes(supplier.id)}
                            size="sm"
                            className="flex-1 text-xs"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            حفظ
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingSupplier(null);
                              setSupplierNotes("");
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {supplier.notes && (
                          <p className="text-xs text-gray-600 mb-1 p-2 bg-yellow-50 rounded" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {supplier.notes}
                          </p>
                        )}
                        <Button
                          onClick={() => {
                            setEditingSupplier(supplier.id);
                            setSupplierNotes(supplier.notes || "");
                          }}
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs flex items-center gap-1"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          <Edit3 className="w-3 h-3" />
                          {supplier.notes ? "تعديل الملاحظات" : "إضافة ملاحظات"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddSupplierDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSupplierAdded={(supplier) => {
          setSuppliers(prev => [...prev, supplier]);
          setShowAddDialog(false);
        }}
        nextSupplierCode={generateNextSupplierCode()}
        language="ar"
      />

      <SupplierDetailsDialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        supplier={selectedSupplier}
      />

      <EditSupplierDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        supplier={editingSupplierData}
        onSupplierUpdated={handleSupplierUpdated}
      />
    </div>
  );
};

export default SupplierFollowUp;
