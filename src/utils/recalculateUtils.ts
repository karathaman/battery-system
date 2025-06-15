
import { supabase } from '@/integrations/supabase/client';

export async function recalculateAllBalancesAndQuantities() {
  // حساب أرصدة العملاء
  const { data: customers } = await supabase.from('customers').select('id');
  if (customers) {
    for (const cust of customers) {
      // جميع فواتير وسندات العميل
      const { data: sales } = await supabase.from('sales')
        .select('total, payment_method')
        .eq('customer_id', cust.id);
      const { data: receipts } = await supabase.from('vouchers')
        .select('amount, type, entity_type')
        .eq('entity_type', 'customer')
        .eq('entity_id', cust.id);

      let balance = 0;
      if (sales) {
        for (const s of sales) {
          // افترض أن المبيعات الآجلة/cash لا تؤثر
          if (s.payment_method === 'check' || s.payment_method === 'bank_transfer') {
            balance += s.total;
          }
        }
      }
      if (receipts) {
        for (const v of receipts) {
          if (v.type === 'receipt') {
            balance -= v.amount; // سند قبض يقلل الرصيد
          } else if (v.type === 'payment') {
            balance += v.amount; // سند صرف يزيد الرصيد
          }
        }
      }
      await supabase.from('customers').update({ balance }).eq('id', cust.id);
    }
  }

  // حساب أرصدة الموردين
  const { data: suppliers } = await supabase.from('suppliers').select('id');
  if (suppliers) {
    for (const sup of suppliers) {
      const { data: purchases } = await supabase.from('purchases')
        .select('total, payment_method')
        .eq('supplier_id', sup.id);
      const { data: vouchers } = await supabase.from('vouchers')
        .select('amount, type, entity_type')
        .eq('entity_type', 'supplier')
        .eq('entity_id', sup.id);

      let balance = 0;
      if (purchases) {
        for (const p of purchases) {
          if (p.payment_method === 'check' || p.payment_method === 'bank_transfer') {
            balance += p.total;
          }
        }
      }
      if (vouchers) {
        for (const v of vouchers) {
          if (v.type === 'payment') {
            balance -= v.amount; // سند صرف يقلل الرصيد
          } else if (v.type === 'receipt') {
            balance += v.amount; // سند قبض يزيد الرصيد (له حالات نادرة)
          }
        }
      }
      await supabase.from('suppliers').update({ balance }).eq('id', sup.id);
    }
  }

  // حساب كميات البطاريات
  const { data: batteryTypes } = await supabase.from('battery_types').select('id');
  if (batteryTypes) {
    for (const bat of batteryTypes) {
      let qty = 0;
      // جميع عمليات شراء البطارية
      const { data: purchaseItems } = await supabase
        .from('purchase_items')
        .select('battery_type_id, quantity')
        .eq('battery_type_id', bat.id);
      if (purchaseItems) {
        for (const pi of purchaseItems) {
          qty += pi.quantity;
        }
      }
      // جميع مبيعات البطارية
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('battery_type_id, quantity')
        .eq('battery_type_id', bat.id);
      if (saleItems) {
        for (const si of saleItems) {
          qty -= si.quantity;
        }
      }
      await supabase.from('battery_types').update({ currentQty: Math.max(0, qty) }).eq('id', bat.id);
    }
  }
}
