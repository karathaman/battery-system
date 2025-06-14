import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
interface DateNavigationProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onClearData: () => void;
  language?: string;
}
export const DateNavigation = ({
  currentDate,
  onDateChange,
  onClearData,
  language = "ar"
}: DateNavigationProps) => {
  const isRTL = language === "ar";
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDateObj = new Date(currentDate);
    const newDate = new Date(currentDateObj);
    if (direction === 'prev') {
      newDate.setDate(currentDateObj.getDate() - 1);
    } else {
      newDate.setDate(currentDateObj.getDate() + 1);
    }
    onDateChange(newDate.toISOString().split('T')[0]);
  };
  const handleClearData = () => {
    if (window.confirm(language === "ar" ? "هل أنت متأكد من مسح جميع البيانات؟" : "Are you sure you want to clear all data?")) {
      onClearData();
      toast({
        title: language === "ar" ? "تم مسح البيانات" : "Data Cleared",
        description: language === "ar" ? "تم مسح جميع البيانات بنجاح" : "All data has been cleared successfully"
      });
    }
  };
  return <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <Button onClick={() => navigateDate('next')} variant="outline" size="sm" className="flex items-center gap-1">
          {language === "ar" ? "التالي" : "Next"}
          {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}> 
          <input type="date" value={currentDate} onChange={e => onDateChange(e.target.value)} style={{
          fontFamily: 'Tajawal, sans-serif'
        }} className="text-md   border rounded-lg px-2 py-1 bg-blue-50" />
        </div>
        
        <Button onClick={() => navigateDate('prev')} variant="outline" size="sm" className="flex items-center gap-1">
          {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {language === "ar" ? "السابق" : "Previous"}
        </Button>
        
      </div>

      <Button onClick={handleClearData} variant="destructive" size="sm" className="flex items-center gap-2">
        <Trash2 className="w-4 h-4" />
        {language === "ar" ? "تصفية البيانات" : "Clear Data"}
      </Button>
    </div>;
};