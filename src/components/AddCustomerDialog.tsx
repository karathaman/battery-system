import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { Customer } from "@/types";
import { UserPlus } from "lucide-react";

interface AddCustomerDialogProps {
  onCustomerAdded: (customer: Customer) => void;
  language: string;
}

export const AddCustomerDialog = ({ onCustomerAdded, language }: AddCustomerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Create new customer
    const newCustomer: Customer = {
      id: Date.now().toString(), // Temporary ID generation
      customerCode: `C${Date.now().toString().slice(-4)}`, // Temporary code generation
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      description: formData.description.trim(),
      lastSale: new Date().toISOString().split("T")[0],
      totalSales: 0,
      totalAmount: 0,
      averagePrice: 0,
      sales: [],
      lastPurchase: new Date().toISOString().split("T")[0],
      totalPurchases: 0,
      purchases: [],
      isBlocked: false,
      last2Quantities: [],
      last2Prices: [],
    };

    // Add customer and close dialog
    onCustomerAdded(newCustomer);
    setOpen(false);
    setFormData({ name: "", phone: "", description: "" });

    // Show success message
    toast({
      title: "تمت إضافة العميل",
      description: "تم إضافة العميل بنجاح",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <UserPlus className="w-4 h-4" />
          إضافة عميل جديد
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>إضافة عميل جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" style={{ fontFamily: 'Tajawal, sans-serif' }}>اسم العميل</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="أدخل اسم العميل"
              dir="rtl"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الجوال</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="أدخل رقم الجوال"
              dir="rtl"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" style={{ fontFamily: 'Tajawal, sans-serif' }}>وصف العميل</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="أدخل وصف العميل (اختياري)"
              dir="rtl"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              إلغاء
            </Button>
            <Button type="submit" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إضافة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
