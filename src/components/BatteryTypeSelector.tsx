import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BatteryTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const BatteryTypeSelector = ({ value, onChange, placeholder = "اختر نوع البطارية" }: BatteryTypeSelectorProps) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customType, setCustomType] = useState("");
  const [batteryTypes, setBatteryTypes] = useState<string[]>([]); // حالة لتخزين أنواع البطاريات

  // جلب بيانات أنواع البطاريات من قاعدة البيانات
  useEffect(() => {
    const fetchBatteryTypes = async () => {
      const { data, error } = await supabase
        .from("battery_types") // اسم الجدول في قاعدة البيانات
        .select("name"); // جلب أسماء الأنواع فقط

      if (error) {
        console.error("Error fetching battery types:", error);
      } else {
        setBatteryTypes(data.map((item) => item.name)); // تخزين أسماء الأنواع في الحالة
      }
    };

    fetchBatteryTypes();
  }, []);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onChange(selectedValue);
    }
  };

  const handleCustomSubmit = () => {
    if (customType.trim()) {
      onChange(customType.trim());
      setCustomType("");
      setIsCustom(false);
    }
  };

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="أدخل نوع البطارية"
          value={customType}
          onChange={(e) => setCustomType(e.target.value)}
          style={{ fontFamily: "Tajawal, sans-serif" }}
          onKeyPress={(e) => e.key === "Enter" && handleCustomSubmit()}
        />
        <Button onClick={handleCustomSubmit} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
        <Button onClick={() => setIsCustom(false)} variant="outline" size="sm">
          إلغاء
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {batteryTypes.map((type) => (
          <SelectItem key={type} value={type} style={{ fontFamily: "Tajawal, sans-serif" }}>
            {type}
          </SelectItem>
        ))}
        <SelectItem value="custom" style={{ fontFamily: "Tajawal, sans-serif" }}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة نوع جديد
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};