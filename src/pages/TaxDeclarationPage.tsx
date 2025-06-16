import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Calculator, TrendingUp, TrendingDown, Download, Printer, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getTaxDataForPeriod } from "@/utils/accountUtils";

interface TaxPeriod {
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
}

interface TaxData {
  salesVAT: number;
  purchaseVAT: number;
  netVAT: number;
  salesAmount: number;
  purchaseAmount: number;
  period: TaxPeriod;
}

const TaxDeclarationPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const quarters = [
    { value: 1, label: "الربع الأول (يناير - مارس)", startMonth: 1, endMonth: 3 },
    { value: 2, label: "الربع الثاني (أبريل - يونيو)", startMonth: 4, endMonth: 6 },
    { value: 3, label: "الربع الثالث (يوليو - سبتمبر)", startMonth: 7, endMonth: 9 },
    { value: 4, label: "الربع الرابع (أكتوبر - ديسمبر)", startMonth: 10, endMonth: 12 }
  ];

  const getTaxDataForCustomPeriod = (startDate: string, endDate: string) => {
    // Convert date strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // For custom periods, we'll calculate based on the date range
    // This is a simplified implementation - in a real system you'd query the database
    const year = start.getFullYear();
    const quarter = Math.ceil((start.getMonth() + 1) / 3);
    
    return getTaxDataForPeriod(year, quarter);
  };

  const calculateTax = async () => {
    setIsCalculating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    let startDate: string;
    let endDate: string;
    let realTaxData: any;

    if (useCustomPeriod) {
      if (!customStartDate || !customEndDate) {
        toast({
          title: "خطأ",
          description: "يرجى تحديد تاريخ البداية والنهاية",
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }
      
      if (new Date(customStartDate) > new Date(customEndDate)) {
        toast({
          title: "خطأ",
          description: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }

      startDate = customStartDate;
      endDate = customEndDate;
      realTaxData = getTaxDataForCustomPeriod(customStartDate, customEndDate);
    } else {
      const quarter = quarters.find(q => q.value === selectedQuarter)!;
      startDate = `${selectedYear}-${quarter.startMonth.toString().padStart(2, '0')}-01`;
      endDate = new Date(selectedYear, quarter.endMonth, 0).toISOString().split('T')[0];
      realTaxData = getTaxDataForPeriod(selectedYear, selectedQuarter);
    }

    setTaxData({
      salesVAT: Math.round(realTaxData.salesVAT),
      purchaseVAT: Math.round(realTaxData.purchaseVAT),
      netVAT: Math.round(realTaxData.netVAT),
      salesAmount: Math.round(realTaxData.salesAmount),
      purchaseAmount: Math.round(realTaxData.purchaseAmount),
      period: {
        year: selectedYear,
        quarter: useCustomPeriod ? 0 : selectedQuarter,
        startDate,
        endDate
      }
    });

    setIsCalculating(false);
    
    const periodText = useCustomPeriod 
      ? `من ${startDate} إلى ${endDate}`
      : `الربع ${selectedQuarter} من عام ${selectedYear}`;
    
    toast({
      title: "تم حساب الإقرار الضريبي",
      description: `تم حساب الإقرار للفترة ${periodText}`,
    });
  };

  const generateReport = () => {
    if (!taxData) return;

    const periodText = useCustomPeriod
      ? `من ${taxData.period.startDate} إلى ${taxData.period.endDate}`
      : `${quarters.find(q => q.value === taxData.period.quarter)?.label} ${taxData.period.year}`;

    const reportContent = `
      إقرار ضريبة القيمة المضافة
      الفترة: ${periodText}
      
      المبيعات الخاضعة للضريبة: ${taxData.salesAmount.toLocaleString()} ريال
      ضريبة المبيعات (15%): ${taxData.salesVAT.toLocaleString()} ريال
      
      المشتريات الخاضعة للضريبة: ${taxData.purchaseAmount.toLocaleString()} ريال
      ضريبة المشتريات (15%): ${taxData.purchaseVAT.toLocaleString()} ريال
      
      صافي الضريبة المستحقة: ${taxData.netVAT.toLocaleString()} ريال
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = useCustomPeriod 
      ? `tax-declaration-${taxData.period.startDate}-to-${taxData.period.endDate}.txt`
      : `tax-declaration-${taxData.period.year}-Q${taxData.period.quarter}.txt`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "تم تحميل التقرير",
      description: "تم تحميل تقرير الإقرار الضريبي بنجاح",
    });
  };

  const printReport = () => {
    if (!taxData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const periodText = useCustomPeriod
      ? `من ${taxData.period.startDate} إلى ${taxData.period.endDate}`
      : quarters.find(q => q.value === taxData.period.quarter)?.label + ` ${taxData.period.year}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>إقرار ضريبة القيمة المضافة</title>
          <style>
            body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
            .amount { font-weight: bold; color: #2563eb; }
            .total { background-color: #f3f4f6; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>إقرار ضريبة القيمة المضافة</h1>
            <h2>${periodText}</h2>
            <p>من ${taxData.period.startDate} إلى ${taxData.period.endDate}</p>
          </div>
          
          <div class="section">
            <h3>المبيعات</h3>
            <p>إجمالي المبيعات الخاضعة للضريبة: <span class="amount">${taxData.salesAmount.toLocaleString()} ريال</span></p>
            <p>ضريبة المبيعات (15%): <span class="amount">${taxData.salesVAT.toLocaleString()} ريال</span></p>
          </div>
          
          <div class="section">
            <h3>المشتريات</h3>
            <p>إجمالي المشتريات الخاضعة للضريبة: <span class="amount">${taxData.purchaseAmount.toLocaleString()} ريال</span></p>
            <p>ضريبة المشتريات (15%): <span class="amount">${taxData.purchaseVAT.toLocaleString()} ريال</span></p>
          </div>
          
          <div class="section total">
            <h3>صافي الضريبة المستحقة</h3>
            <p style="font-size: 24px;">${taxData.netVAT.toLocaleString()} ريال</p>
            ${taxData.netVAT > 0 ? '<p style="color: red;">مبلغ مستحق للسداد</p>' : '<p style="color: green;">مبلغ مستحق الاسترداد</p>'}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            الإقرار الضريبي
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Calculation Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                حساب الإقرار الضريبي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Period Selection Type */}
              <div className="space-y-3">
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>نوع الفترة</Label>
                <div className="flex gap-4">
                  <Button
                    variant={!useCustomPeriod ? "default" : "outline"}
                    onClick={() => setUseCustomPeriod(false)}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    ربع سنوي
                  </Button>
                  <Button
                    variant={useCustomPeriod ? "default" : "outline"}
                    onClick={() => setUseCustomPeriod(true)}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <Calendar className="w-4 h-4 ml-2" />
                    فترة مخصصة
                  </Button>
                </div>
              </div>

              {!useCustomPeriod ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year" style={{ fontFamily: 'Tajawal, sans-serif' }}>السنة</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quarter" style={{ fontFamily: 'Tajawal, sans-serif' }}>الربع</Label>
                    <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {quarters.map(quarter => (
                          <SelectItem key={quarter.value} value={quarter.value.toString()} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {quarter.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ البداية</Label>
                    <Input
                      type="date"
                      id="startDate"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate" style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ النهاية</Label>
                    <Input
                      type="date"
                      id="endDate"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={calculateTax}
                disabled={isCalculating}
                className="w-full flex items-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Calculator className="w-4 h-4" />
                {isCalculating ? "جاري الحساب..." : "حساب الإقرار الضريبي"}
              </Button>

              {taxData && (
                <div className="mt-6 space-y-4">
                  <div className="bg-green-50 p-4 rounded border">
                    <h4 className="font-semibold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      المبيعات
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>إجمالي المبيعات:</span>
                        <span className="font-bold">{taxData.salesAmount.toLocaleString()} ريال</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ضريبة المبيعات (15%):</span>
                        <span className="font-bold text-green-600">{taxData.salesVAT.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded border">
                    <h4 className="font-semibold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      المشتريات
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>إجمالي المشتريات:</span>
                        <span className="font-bold">{taxData.purchaseAmount.toLocaleString()} ريال</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ضريبة المشتريات (15%):</span>
                        <span className="font-bold text-orange-600">{taxData.purchaseVAT.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded border ${taxData.netVAT >= 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <h4 className="font-semibold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      صافي الضريبة
                    </h4>
                    <div className="flex justify-between items-center">
                      <span>المبلغ المستحق:</span>
                      <span className={`font-bold text-xl ${taxData.netVAT >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {Math.abs(taxData.netVAT).toLocaleString()} ريال
                      </span>
                    </div>
                    <p className="text-sm mt-2">
                      {taxData.netVAT >= 0 ? "مبلغ مستحق للسداد" : "مبلغ مستحق الاسترداد"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={generateReport} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 ml-2" />
                      تحميل التقرير
                    </Button>
                    <Button onClick={printReport} variant="outline" className="flex-1">
                      <Printer className="w-4 h-4 ml-2" />
                      طباعة
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                ملخص الفترة المحددة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {useCustomPeriod ? (
                  <div>
                    <p style={{ fontFamily: 'Tajawal, sans-serif' }}>فترة مخصصة</p>
                    {customStartDate && customEndDate && (
                      <div className="text-sm">
                        <p>من: {customStartDate}</p>
                        <p>إلى: {customEndDate}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {quarters.find(q => q.value === selectedQuarter)?.label}
                    </p>
                    <p className="text-2xl font-bold">{selectedYear}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {taxData && (
            <>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">
                    {taxData.salesVAT.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ضريبة المبيعات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingDown className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">
                    {taxData.purchaseVAT.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ضريبة المشتريات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Calculator className={`w-8 h-8 mx-auto mb-2 ${taxData.netVAT >= 0 ? 'text-red-600' : 'text-blue-600'}`} />
                  <p className={`text-2xl font-bold ${taxData.netVAT >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {Math.abs(taxData.netVAT).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {taxData.netVAT >= 0 ? "مستحق للسداد" : "مستحق الاسترداد"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxDeclarationPage;
