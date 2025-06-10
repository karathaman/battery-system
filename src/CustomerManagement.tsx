
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, Calendar, TrendingUp, User, Package, DollarSign, Edit3, Save, X, Ban, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast"; 

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

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  description?: string;
  lastPurchase: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  purchases: Purchase[];
  notes?: string;
  isBlocked?: boolean;
  blockReason?: string;
}

// Mock data - سيتم استبدالها ببيانات Supabase
const mockCustomers: Customer[] = [
  {
    id: "1",
    customerCode: "C001",
    name: "أحمد محمد",
    phone: "0501234567",
    description: "عميل مميز وموثوق",
    lastPurchase: "2024-01-15",
    totalPurchases: 15,
    totalAmount: 4500,
    averagePrice: 300,
    notes: "عميل مميز، يشتري بانتظام كل شهر",
    purchases: [
      {
        id: "p1",
        date: "2024-01-15",
        batteryType: "بطاريات عادية",
        quantity: 10,
        pricePerKg: 25,
        total: 250,
        discount: 0,
        finalTotal: 250
      },
      {
        id: "p2",
        date: "2024-01-10",
        batteryType: "بطاريات جافة",
        quantity: 15,
        pricePerKg: 30,
        total: 450,
        discount: 50,
        finalTotal: 400
      }
    ]
  },
  {
    id: "2", 
    customerCode: "C002",
    name: "فاطمة علي",
    phone: "0507654321",
    description: "تتعامل مع البطاريات اليابانية فقط",
    lastPurchase: "2024-01-10",
    totalPurchases: 8,
    totalAmount: 2400,
    averagePrice: 300,
    notes: "تفضل البطاريات اليابانية",
    purchases: [
      {
        id: "p3",
        date: "2024-01-10",
        batteryType: "بطاريات زجاج",
        quantity: 20,
        pricePerKg: 35,
        total: 700,
        discount: 100,
        finalTotal: 600
      }
    ]
  },
  {
    id: "3",
    customerCode: "C003",
    name: "خالد أحمد", 
    phone: "0501111111",
    lastPurchase: "2024-01-05",
    totalPurchases: 22,
    totalAmount: 6600,
    averagePrice: 300,
    isBlocked: true,
    blockReason: "مشاكل في الدفع",
    purchases: []
  }
];

export const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysSinceLastPurchase = (lastPurchase: string) => {
    const today = new Date();
    const purchaseDate = new Date(lastPurchase);
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const generateNextCustomerCode = () => {
    if (customers.length === 0) return "C001";
    
    const maxCode = customers.reduce((max, customer) => {
      const codeNumber = parseInt(customer.customerCode.replace('C', ''));
      return codeNumber > max ? codeNumber : max;
    }, 0);
    
    return `C${String(maxCode + 1).padStart(3, '0')}`;
  };

  const updateCustomerNotes = (customerId: string, notes: string) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, notes } : c
    ));
    setEditingCustomer(null);
    toast({
      title: "تم حفظ الملاحظة",
      description: "تم حفظ ملاحظة العميل بنجاح",
    });
  };

  const toggleCustomerBlock = (customerId: string, blockReason?: string) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { 
        ...c, 
        isBlocked: !c.isBlocked, 
        blockReason: !c.isBlocked ? blockReason : undefined 
      } : c
    ));
    
    const customer = customers.find(c => c.id === customerId);
    toast({
      title: customer?.isBlocked ? "تم إلغاء حظر العميل" : "تم حظر العميل",
      description: customer?.isBlocked ? "تم إلغاء حظر العميل بنجاح" : "تم حظر العميل بنجاح",
    });
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    const customerWithDefaults = {
      ...newCustomer,
      lastPurchase: new Date().toISOString().split('T')[0],
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: []
    };
    setCustomers(prev => [...prev, customerWithDefaults]);
    setShowAddDialog(false);
  };

  const CustomerDetailsDialog = ({ customer }: { customer: Customer }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
          عرض التفاصيل
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات العميل: {customer.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      عدد المشتريات
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">{customer.totalPurchases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      إجمالي المبلغ
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {customer.totalAmount.toLocaleString()} ريال
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      آخر شراء
                    </p>
                    <p className="text-sm font-semibold">{customer.lastPurchase}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      متوسط الشراء
                    </p>
                    <p className="text-sm font-semibold">
                      {customer.totalPurchases > 0 ? Math.round(customer.totalAmount / customer.totalPurchases).toLocaleString() : 0} ريال
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Info */}
          {customer.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <User className="w-5 h-5 text-blue-600" />
                  وصف العميل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {customer.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Customer Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <User className="w-5 h-5 text-yellow-600" />
                ملاحظات العميل
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingCustomer === customer.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="أضف ملاحظة عن العميل..."
                    rows={4}
                    className="text-right"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  />
                  <div className="flex gap-2 flex-row-reverse">
                    <Button
                      onClick={() => updateCustomerNotes(customer.id, customerNotes)}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      حفظ الملاحظة
                    </Button>
                    <Button
                      onClick={() => setEditingCustomer(null)}
                      variant="outline"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-gray-700 text-right flex-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {customer.notes || "لا توجد ملاحظات عن هذا العميل"}
                  </p>
                  <Button
                    onClick={() => {
                      setEditingCustomer(customer.id);
                      setCustomerNotes(customer.notes || "");
                    }}
                    variant="outline"
                    size="sm"
                    className="mr-4"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تاريخ المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        التاريخ
                      </th>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        نوع البطارية
                      </th>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        الكمية
                      </th>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        سعر الكيلو
                      </th>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        الإجمالي
                      </th>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        الخصم
                      </th>
                      <th className="p-2 sm:p-3 font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        المبلغ النهائي
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.purchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{purchase.date}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{purchase.batteryType}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{purchase.quantity}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{purchase.pricePerKg}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{purchase.total.toLocaleString()}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{purchase.discount.toLocaleString()}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm font-bold text-green-600">{purchase.finalTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            إدارة العملاء
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 !block">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن عميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-sm"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2 flex-row-reverse bg-blue-600 hover:bg-blue-700"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <UserPlus className="w-4 h-4" />
                إضافة عميل جديد
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center !block">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-lg sm:text-2xl font-bold">{customers.length}</p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي العملاء
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4 text-center !block">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
                <p className="text-lg sm:text-2xl font-bold">
                  {customers.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  إجمالي المبيعات
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4 text-center !block">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-lg sm:text-2xl font-bold">
                  {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.averagePrice, 0) / customers.length) : 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  متوسط سعر الكيلو
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredCustomers.map(customer => {
          const daysSinceLastPurchase = getDaysSinceLastPurchase(customer.lastPurchase);
          
          return (
            <Card key={customer.id} className={`shadow-md hover:shadow-lg transition-shadow ${customer.isBlocked ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-row-reverse">
                        <Badge variant="secondary" className="text-xs">
                          {customer.customerCode}
                        </Badge>
                        {customer.isBlocked && (
                          <Badge variant="destructive" className="text-xs">
                            محظور
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-600">{customer.phone}</p>
                    {customer.description && (
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {customer.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      آخر شراء: {customer.lastPurchase}
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      منذ {daysSinceLastPurchase} يوم
                    </p>
                  </div>

                  {/* Customer Notes Preview */}
                  {customer.notes && (
                    <div className="bg-yellow-50 rounded p-2">
                      <p className="text-xs text-gray-600 text-right truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        📝 {customer.notes}
                      </p>
                    </div>
                  )}

                  {/* Block Reason */}
                  {customer.isBlocked && customer.blockReason && (
                    <div className="bg-red-100 rounded p-2">
                      <p className="text-xs text-red-600 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        ⚠️ {customer.blockReason}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>المشتريات</p>
                      <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.totalPurchases}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</p>
                      <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>متوسط</p>
                      <p className="font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{customer.averagePrice}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <CustomerDetailsDialog customer={customer} />
                    
                    {/* Block/Unblock Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant={customer.isBlocked ? "outline" : "destructive"}
                          size="sm"
                          className="w-full flex items-center gap-2 flex-row-reverse text-xs"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          <Ban className="w-3 h-3" />
                          {customer.isBlocked ? "إلغاء الحظر" : "حظر العميل"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {customer.isBlocked ? "إلغاء حظر العميل" : "حظر العميل"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {!customer.isBlocked && (
                            <div>
                              <label className="text-sm font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                سبب الحظر
                              </label>
                              <Textarea
                                placeholder="اكتب سبب حظر العميل..."
                                className="text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                              />
                            </div>
                          )}
                          <div className="flex gap-2 flex-row-reverse">
                            <Button
                              onClick={() => toggleCustomerBlock(customer.id, customer.isBlocked ? undefined : customerNotes)}
                              variant={customer.isBlocked ? "outline" : "destructive"}
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                              {customer.isBlocked ? "إلغاء الحظر" : "حظر العميل"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredCustomers.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="p-8 sm:p-12 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm sm:text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا توجد عملاء مطابقين للبحث
            </p>
          </CardContent>
        </Card>
      )}
 
    </div>
  );
};
