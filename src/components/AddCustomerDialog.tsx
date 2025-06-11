
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CustomerFormData } from "@/types";

interface AddCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: CustomerFormData) => void;
}

export const AddCustomerDialog = ({ open, onClose, onCustomerAdded }: AddCustomerDialogProps) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    description: "",
    notes: ""
  });

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

    onCustomerAdded({
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
            إضافة عميل جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              اسم العميل *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم العميل"
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
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف العميل"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
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
              إضافة العميل
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
