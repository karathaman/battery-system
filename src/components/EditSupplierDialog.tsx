
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  phone: string;
  description?: string;
  notes?: string;
  totalPurchases: number;
  totalAmount: number;
  averagePrice: number;
  balance: number;
  lastPurchase?: string;
  purchases: any[];
  isBlocked?: boolean;
  blockReason?: string;
  messageSent?: boolean;
  lastMessageSent?: string;
  last2Quantities?: number[];
  last2Prices?: number[];
  last2BatteryTypes?: string[];
}

interface EditSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSupplierUpdated: (supplier: Supplier) => void;
}

import { useEffect } from "react";

export const EditSupplierDialog = ({ open, onClose, supplier, onSupplierUpdated }: EditSupplierDialogProps) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    phone: supplier?.phone || "",
    description: supplier?.description || "",
    notes: supplier?.notes || "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        phone: supplier.phone || "",
        description: supplier.description || "",
        notes: supplier.notes || "",
      });
    }
  }, [supplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const updatedSupplier: Supplier = {
      ...supplier,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      description: formData.description.trim(),
      notes: formData.notes.trim()
    };

    onSupplierUpdated(updatedSupplier);
    
    toast({
      title: "تم التحديث",
      description: "تم تحديث بيانات المورد بنجاح",
    });
    
    onClose();
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            تعديل بيانات المورد
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

          <div className="mb-6">
  <Label
    htmlFor="description"
    className="block  font-medium  mb-2"
    style={{ fontFamily: 'Tajawal, sans-serif' }}
  >
    نوع العميل
  </Label>
  
  <select
    id="description"
    value={formData.description}
    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    style={{ fontFamily: 'Tajawal, sans-serif' }}
    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-sm  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    <option className="text-sm  " value="">
      اختر نوع العميل
    </option>
    <option value="عميل مميز">عميل مميز</option>
    <option value="عميل عادي">عميل عادي</option>
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
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
