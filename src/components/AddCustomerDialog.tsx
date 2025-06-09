
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  description?: string;
  lastPurchase?: string;
}

interface AddCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
  initialName?: string;
  language?: string;
  nextCustomerCode?: string;
}

export const AddCustomerDialog = ({ 
  open, 
  onClose, 
  onCustomerAdded, 
  initialName = "",
  language = "ar",
  nextCustomerCode = "C001"
}: AddCustomerDialogProps) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const isRTL = language === "ar";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast({
        title: language === "ar" ? "خطأ في البيانات" : "Data Error",
        description: language === "ar" ? "يرجى إدخال الاسم ورقم الجوال" : "Please enter name and phone number",
        variant: "destructive",
      });
      return;
    }

    const newCustomer: Customer = {
      id: Date.now().toString(),
      customerCode: nextCustomerCode,
      name: name.trim(),
      phone: phone.trim(),
      description: description.trim() || undefined,
    };

    onCustomerAdded(newCustomer);
    
    toast({
      title: language === "ar" ? "تم إضافة العميل" : "Customer Added",
      description: language === "ar" ? `تم إضافة العميل ${name} برمز ${nextCustomerCode}` : `Customer ${name} added with code ${nextCustomerCode}`,
    });

    // Reset form
    setName("");
    setPhone("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "إضافة عميل جديد" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerCode" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "رمز العميل" : "Customer Code"}
            </Label>
            <Input
              id="customerCode"
              value={nextCustomerCode}
              disabled
              className="mt-1 bg-gray-100"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>

          <div>
            <Label htmlFor="customerName" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "اسم العميل" : "Customer Name"}
            </Label>
            <Input
              id="customerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ar" ? "أدخل اسم العميل" : "Enter customer name"}
              className="mt-1"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="customerPhone" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "رقم الجوال" : "Phone Number"}
            </Label>
            <Input
              id="customerPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="mt-1"
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="customerDescription" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "وصف العميل" : "Customer Description"}
            </Label>
            <Textarea
              id="customerDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === "ar" ? "أدخل وصف للعميل (اختياري)" : "Enter customer description (optional)"}
              className="mt-1 text-right"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              rows={3}
            />
          </div>

          <div className={`flex gap-2 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button type="submit" className="flex-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "إضافة العميل" : "Add Customer"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
