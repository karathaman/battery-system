
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Plus, Eye, Edit, Trash2, TrendingUp, ShoppingCart, DollarSign, Calendar } from "lucide-react";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { CustomerSearchDialog } from "@/components/CustomerSearchDialog";
import { CustomerDetailsDialog } from "@/components/CustomerDetailsDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import { CustomerStatistics } from "@/components/CustomerStatistics";
import { toast } from "@/hooks/use-toast";
import { Customer } from "@/types";

const CustomerFollowUpPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "1",
      customerCode: "C001",
      name: "أحمد محمد",
      phone: "0501234567",
      description: "عميل دائم",
      notes: "يفضل البطاريات الأصلية",
      totalPurchases: 150,
      totalAmount: 15420,
      averagePrice: 102.8,
      lastPurchase: "2024-01-15",
      purchases: [],
      isBlocked: false,
      messageSent: false
    },
    {
      id: "2", 
      customerCode: "C002",
      name: "فاطمة علي",
      phone: "0509876543",
      description: "تاجرة جملة",
      notes: "تشتري بكميات كبيرة",
      totalPurchases: 280,
      totalAmount: 28760,
      averagePrice: 102.7,
      lastPurchase: "2024-01-18",
      purchases: [],
      isBlocked: false,
      messageSent: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleAddCustomer = (newCustomer: Omit<Customer, 'id' | 'totalPurchases' | 'totalAmount' | 'averagePrice' | 'purchases'>) => {
    const customer: Customer = {
      ...newCustomer,
      id: Date.now().toString(),
      totalPurchases: 0,
      totalAmount: 0,
      averagePrice: 0,
      purchases: [],
      isBlocked: false,
      messageSent: false
    };
    setCustomers(prev => [...prev, customer]);
    toast({
      title: "تمت الإضافة",
      description: "تم إضافة العميل بنجاح"
    });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
    setShowSearchDialog(false);
  };

  const handleEditCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === updatedCustomer.id ? updatedCustomer : customer
    ));
    setSelectedCustomer(updatedCustomer);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    toast({
      title: "تم الحذف",
      description: "تم حذف العميل بنجاح"
    });
  };

  const topCustomers = customers
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const recentSales = [
    {
      id: "1",
      customerName: "أحمد محمد",
      amount: 850,
      date: "2024-01-20",
      items: "بطارية سيارة 70 أمبير"
    },
    {
      id: "2", 
      customerName: "فاطمة علي",
      amount: 1200,
      date: "2024-01-19",
      items: "بطاريات متنوعة"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            متابعة العملاء
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            قائمة العملاء
          </TabsTrigger>
          <TabsTrigger value="top" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            أفضل العملاء
          </TabsTrigger>
          <TabsTrigger value="sales" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            آخر المبيعات
          </TabsTrigger>
        </TabsList>

        {/* قائمة العملاء */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="البحث عن عميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowSearchDialog(true)} variant="outline">
                <Search className="w-4 h-4 ml-2" />
                بحث متقدم
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة عميل
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {customer.name}
                        </h3>
                        <Badge variant="outline">{customer.customerCode}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>الجوال: {customer.phone}</p>
                        {customer.description && <p>الوصف: {customer.description}</p>}
                        <p>إجمالي المبيعات: {customer.totalAmount.toLocaleString()} ريال</p>
                        <p>إجمالي الكمية: {customer.totalPurchases} كيلو</p>
                        {customer.lastPurchase && (
                          <p>آخر مبيعة: {new Date(customer.lastPurchase).toLocaleDateString('ar-SA')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  لا توجد عملاء مطابقون لمعايير البحث
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* أفضل العملاء */}
        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <TrendingUp className="w-5 h-5" />
                أفضل 5 عملاء (حسب إجمالي المبيعات)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-600">{customer.customerCode}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-green-600">
                        {customer.totalAmount.toLocaleString()} ريال
                      </p>
                      <p className="text-sm text-gray-600">
                        {customer.totalPurchases} كيلو
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <CustomerStatistics customers={customers} />
        </TabsContent>

        {/* آخر المبيعات */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <ShoppingCart className="w-5 h-5" />
                آخر المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {sale.customerName}
                      </h4>
                      <Badge variant="outline">
                        <DollarSign className="w-3 h-3 ml-1" />
                        {sale.amount.toLocaleString()} ريال
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {sale.items}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(sale.date).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddCustomerDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onCustomerAdded={handleAddCustomer}
      />

      <CustomerSearchDialog
        open={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      {selectedCustomer && (
        <>
          <CustomerDetailsDialog
            open={showDetailsDialog}
            onClose={() => setShowDetailsDialog(false)}
            customer={selectedCustomer}
            onEditCustomer={(customer) => {
              setSelectedCustomer(customer);
              setShowEditDialog(true);
            }}
          />
          
          <EditCustomerDialog
            open={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            customer={selectedCustomer}
            onCustomerUpdated={handleEditCustomer}
          />
        </>
      )}
    </div>
  );
};

export default CustomerFollowUpPage;
