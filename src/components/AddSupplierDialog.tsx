import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { SupplierFormData } from "@/types";

interface AddSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  onSupplierAdded: (supplier: SupplierFormData) => void;
  nextSupplierCode?: string;
  language?: string;
  initialName?: string; // اسم المورد المبدئي من البحث
}

export const AddSupplierDialog = ({ 
  open, 
  onClose, 
  onSupplierAdded,
  nextSupplierCode,
  language = "ar",
  initialName = ""
}: AddSupplierDialogProps) => {
  // نوفر قيم ابتدائية للاسم إذا وُجدت
  const [formData, setFormData] = useState<SupplierFormData>({
    name: initialName || "",
    phone: "",
    description: "",
    notes: ""
  });

  // عند فتح الدايلاوج من جديد، إذا كان هناك اسم، نعيد قيمته
  useEffect(() => {
    if (open) {
      setFormData({
        name: initialName || "",
        phone: "",
        description: "",
        notes: ""
      });
    }
  }, [open, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    onSupplierAdded({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      description: formData.description?.trim(),
      notes: formData.notes?.trim()
    });
    
    setFormData({
      name: "",
      phone: "",
      description: "",
      notes: ""
    });
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إضافة مورد جديد
            {nextSupplierCode && (
              <span className="text-sm text-gray-500 mr-2">({nextSupplierCode})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              اسم المورد *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم المورد"
              required
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>

          <div>
            <Label htmlFor="phone" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              رقم الجوال *
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              required
            />
          </div> 
          <div>
            <Label htmlFor="description" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الوصف
            </Label>
            <select
              id="description"
              value={formData.description || "عميل عادي"}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded px-3 py-2 mt-1"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <option value="عميل عادي">عميل عادي</option>
              <option value="عميل مميز">عميل مميز</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ملاحظات
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أضف ملاحظات..."
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit">
              إضافة المورد
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
