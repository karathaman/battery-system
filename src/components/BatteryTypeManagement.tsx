
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Battery, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBatteryTypes } from "@/hooks/useBatteryTypes";

interface BatteryType {
  id: string;
  name: string;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

interface EditBatteryTypeDialogProps {
  open: boolean;
  onClose: () => void;
  batteryType: BatteryType | null;
  onSave: (id: string, data: { name: string; unit_price: number }) => void;
}

const EditBatteryTypeDialog = ({ open, onClose, batteryType, onSave }: EditBatteryTypeDialogProps) => {
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);

  // تحديث البيانات عند فتح الدايلوج
  useState(() => {
    if (batteryType) {
      setName(batteryType.name);
      setUnitPrice(batteryType.unit_price);
    }
  }, [batteryType]);

  const handleSave = () => {
    if (!batteryType) return;
    
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم نوع البطارية",
        variant: "destructive",
      });
      return;
    }

    if (unitPrice <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive",
      });
      return;
    }

    onSave(batteryType.id, { name: name.trim(), unit_price: unitPrice });
    onClose();
  };

  // إعادة تعيين البيانات عند إغلاق الدايلوج
  const handleClose = () => {
    if (batteryType) {
      setName(batteryType.name);
      setUnitPrice(batteryType.unit_price);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            تعديل نوع البطارية
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              اسم نوع البطارية
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم نوع البطارية"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-price" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              السعر (ريال)
            </Label>
            <Input
              id="edit-price"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              placeholder="أدخل السعر"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            حفظ التغييرات
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BatteryTypeManagement = () => {
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [editingBatteryType, setEditingBatteryType] = useState<BatteryType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { 
    batteryTypes, 
    createBatteryType, 
    updateBatteryType, 
    deleteBatteryType,
    isCreating,
    isUpdating,
    isDeleting
  } = useBatteryTypes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم نوع البطارية",
        variant: "destructive",
      });
      return;
    }

    if (!unitPrice || Number(unitPrice) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive",
      });
      return;
    }

    createBatteryType({
      name: name.trim(),
      unit_price: Number(unitPrice)
    });

    setName("");
    setUnitPrice("");
  };

  const handleEdit = (batteryType: BatteryType) => {
    setEditingBatteryType(batteryType);
    setShowEditDialog(true);
  };

  const handleUpdateBatteryType = (id: string, data: { name: string; unit_price: number }) => {
    updateBatteryType({ id, data });
    setShowEditDialog(false);
    setEditingBatteryType(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا النوع؟")) {
      deleteBatteryType(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Battery className="w-5 h-5" />
            إدارة أنواع البطاريات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  اسم نوع البطارية
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم نوع البطارية"
                />
              </div>
              <div>
                <Label htmlFor="price" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  السعر (ريال)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="أدخل السعر"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {isCreating ? "جاري الإضافة..." : "إضافة نوع جديد"}
                </Button>
              </div>
            </div>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontFamily: 'Tajawal, sans-serif' }}>اسم النوع</TableHead>
                  <TableHead style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر</TableHead>
                  <TableHead style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ الإنشاء</TableHead>
                  <TableHead style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batteryTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell style={{ fontFamily: 'Tajawal, sans-serif' }}>{type.name}</TableCell>
                    <TableCell>{type.unit_price} ريال</TableCell>
                    <TableCell>
                      {new Date(type.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          disabled={isUpdating}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditBatteryTypeDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingBatteryType(null);
        }}
        batteryType={editingBatteryType}
        onSave={handleUpdateBatteryType}
      />
    </div>
  );
};

export default BatteryTypeManagement;
