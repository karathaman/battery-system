import { useState, useEffect } from "react";
import { DailyPurchases } from "@/components/DailyPurchases";
import { StickyNotes } from "@/components/StickyNotes";
import { StatisticsPage } from "@/components/StatisticsPage";
import { Navigation } from "@/components/Navigation"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  ShoppingCart,
  Truck,
  Users,
  Receipt,
  Banknote,
  FileText,
  StickyNote,
  BarChart
} from "@/components/ui/icons";
import SupplierFollowUp from "./SupplierFollowUp";
import CustomerFollowUp from "./CustomerFollowUp";
import SalesPage from "./SalesPage";
import PurchasesPage from "./PurchasesPage";
import VouchersPage from "./VouchersPage";
import TaxDeclarationPage from "./TaxDeclarationPage";
import NotesAndBatteriesPage from "./NotesAndBatteriesPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState("daily");
  const [language, setLanguage] = useState("ar");

  const isRTL = language === "ar";

  // Set initial document direction and language
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const getTabText = (key: string) => {
    const texts = {
      daily: { ar: "المشتريات اليومية", en: "Daily Purchases" },
      purchases: { ar: "إدارة المشتريات", en: "Purchase Management" },
      suppliers: { ar: " الموردين", en: "Supplier Follow-up" },
      customers: { ar: " العملاء", en: "Customer Follow-up" },
      sales: { ar: "المبيعات", en: "Sales" },
      vouchers: { ar: "السندات", en: "Vouchers" },
      tax: { ar: "الإقرار الضريبي", en: "Tax Declaration" },
      notes: { ar: "الملاحظات والمهام", en: "Notes & Tasks" },
      statistics: { ar: "الإحصائيات", en: "Statistics" }
    };
    return texts[key as keyof typeof texts][language as keyof typeof texts.daily];
  };

  const getMainTitle = () => {
    return language === "ar" ? "نظام إدارة متجر البطاريات" : "Battery Store Management System";
  };

  const getMainDescription = () => {
    return language === "ar" ? "إدارة شاملة للمشتريات والمبيعات والموردين والعملاء" : "Comprehensive management for purchases, sales, suppliers and customers";
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50`} dir={isRTL ? "rtl" : "ltr"}>
      <Navigation onLanguageChange={handleLanguageChange} />
      
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      
        
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {getMainTitle()}
          </h1>
          <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {getMainDescription()}
          </p>
        </div>

        <div className="w-full">
        <Tabs
  value={activeTab}
  onValueChange={setActiveTab}
  className="w-full"
  dir={isRTL ? "rtl" : "ltr"}
>
  {/* TabsList: Scrollable on mobile, grid on desktop */}
  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded-lg mb-4 sm:mb-6">
    <TabsList
      className="
        flex sm:grid sm:grid-cols-4 lg:grid-cols-9 
        w-max sm:w-full
        min-w-full
        bg-white shadow-lg
        gap-1 sm:gap-0
        px-1 sm:px-0
      "
    >
      {/* Daily Tab */}
            <TabsTrigger
        value="daily"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("daily")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="purchases"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("purchases")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="suppliers"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("suppliers")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="customers"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-1 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("customers")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="sales"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("sales")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="vouchers"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("vouchers")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="tax"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("tax")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="notes"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("notes")}</span>
        </div>
      </TabsTrigger>
      
      <TabsTrigger
        value="statistics"
        className={`flex items-center gap-2 text-xs sm:text-sm py-1 px-2 flex-shrink-0`}
        style={{
          fontFamily: 'Tajawal, sans-serif',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        <div className="flex items-center gap-2">
          <BarChart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getTabText("statistics")}</span>
        </div>
      </TabsTrigger>
    </TabsList>
  </div>

  <div className="mt-2">
    {/* Content for each tab */}
    <TabsContent value="daily" className="space-y-4 sm:space-y-6">
      <StickyNotes compact={true} language={language} />
       <DailyPurchases  
        language={language}
        id="unique-id" // استبدل بـ ID مناسب إذا كان لديك
        date="2023-06-11" // استبدل بالتاريخ المناسب
        supplierName="Supplier Name" // استبدل باسم المورد
        supplierCode="SUP123" // استبدل بالكود المناسب
        supplierPhone="123456789" // استبدل برقم الهاتف
        batteryType="Battery Type" // استبدل بنوع البطارية
        batteryTypeId="Battery Type" // استبدل بنوع البطارية
        quantity={10} // استبدل بالكمية المناسبة
        pricePerKg={50} // استبدل بالسعر المناسب
        total={500} // استبدل بالإجمالي المناسب
        discount={50} // استبدل بالخصم المناسب
        finalTotal={450} // استبدل بالإجمالي النهائي المناسب
        isSaved={false} // استبدل بالحالة المناسبة
      />
    </TabsContent>
    <TabsContent value="purchases" className="space-y-4 sm:space-y-6">
      <PurchasesPage />
    </TabsContent>
    <TabsContent value="suppliers" className="space-y-4 sm:space-y-6">
      <SupplierFollowUp />
    </TabsContent>
    <TabsContent value="customers" className="space-y-4 sm:space-y-6">
      <CustomerFollowUp />
    </TabsContent>
    <TabsContent value="sales" className="space-y-4 sm:space-y-6">
      <SalesPage />
    </TabsContent>
    <TabsContent value="vouchers" className="space-y-4 sm:space-y-6">
      <VouchersPage />
    </TabsContent>
    <TabsContent value="tax" className="space-y-4 sm:space-y-6">
      <TaxDeclarationPage />
    </TabsContent>
    <TabsContent value="notes" className="space-y-4 sm:space-y-6">
      <NotesAndBatteriesPage />
    </TabsContent>
    <TabsContent value="statistics" className="space-y-4 sm:space-y-6">
      <StatisticsPage language={language} />
    </TabsContent>
  </div>
</Tabs>

        </div>
      </div>
    </div>
  );
};

export default Index;
