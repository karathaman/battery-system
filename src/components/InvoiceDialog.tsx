
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SaleItem = {
  batteryType?: string;
  quantity: number;
  price: number;
  total: number;
};
type PurchaseItem = {
  batteryType?: string;
  quantity: number;
  price: number;
  total: number;
};

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: any; // sale or purchase
  type: "sale" | "purchase";
}

export function InvoiceDialog({ open, onClose, invoice, type }: InvoiceDialogProps) {
  if (!invoice) return null;

  const items = (invoice.items || invoice.purchase_items || []).map((item: any) => ({
    batteryType: item.batteryType || item.battery_types?.name || "غير معروف",
    quantity: item.quantity,
    price: item.price_per_kg || item.price || 0,
    total: item.total,
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {type === "sale" ? "تفاصيل الفاتورة" : "تفاصيل فاتورة الشراء"}
          </DialogTitle>
          <DialogDescription>
            <span className="text-sm font-semibold">
              رقم الفاتورة: {invoice.invoiceNumber || invoice.invoice_number || ""}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex gap-3 text-xs text-gray-500" dir="rtl">
            <div><b>التاريخ:</b> {invoice.date ? new Date(invoice.date).toLocaleDateString('ar-SA') : ""}</div>
            <div>
              <b>{type === 'sale' ? "العميل:" : "المورد:"}</b> {invoice.customerName || invoice.suppliers?.name || "غير معروف"}
            </div>
            <div>
              <Badge variant={invoice.paymentMethod === "credit" || invoice.payment_method === "check" ? "destructive" : "default"}>
                {type === "sale"
                  ? (invoice.paymentMethod === "credit" ? "آجل" : "نقداً")
                  : (invoice.payment_method === "check" ? "آجل" : "نقداً")
                }
              </Badge>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-xs border rounded bg-gray-50" dir="rtl">
            <thead>
              <tr>
                <th className="p-2">الصنف</th>
                <th className="p-2">الكمية</th>
                <th className="p-2">السعر</th>
                <th className="p-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td className="p-2">{i.batteryType}</td>
                  <td className="p-2">{i.quantity}</td>
                  <td className="p-2">{i.price.toLocaleString()}</td>
                  <td className="p-2">{i.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-2 mt-3 text-sm" dir="rtl">
            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{(invoice.subtotal ?? 0).toLocaleString()} ريال</span></div>
            {invoice.tax > 0 && (
              <div className="flex justify-between"><span>ضريبة القيمة المضافة:</span><span>{invoice.tax.toLocaleString()} ريال</span></div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between"><span>الخصم:</span><span>-{invoice.discount.toLocaleString()} ريال</span></div>
            )}
            <div className="flex justify-between font-bold"><span>الإجمالي:</span><span className="text-green-600">{invoice.total.toLocaleString()} ريال</span></div>
          </div>
        </div>
        <DialogClose asChild>
          <Button className="mt-4 w-full" variant="outline">إغلاق</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
