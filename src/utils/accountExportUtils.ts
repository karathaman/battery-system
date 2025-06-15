
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// columns: { title: string, key: string, format?: (x:any) => string }
export function exportAccountStatementToExcel({
  data,
  columns,
  filename,
}: {
  data: any[];
  columns: { title: string; key: string; format?: (v: any) => any }[];
  filename: string;
}) {
  const sheetData = [
    columns.map((col) => col.title),
    ...data.map((row) =>
      columns.map((col) =>
        col.format ? col.format(row[col.key]) : row[col.key] ?? ""
      )
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "كشف الحساب");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : filename + ".xlsx");
}

export function exportAccountStatementToPDF({
  data,
  columns,
  filename,
  title,
}: {
  data: any[];
  columns: { title: string; key: string; format?: (v: any) => any }[];
  filename: string;
  title: string;
}) {
  const doc = new jsPDF({ orientation: "landscape" });

  // إزالة setFont("tajawal", "normal")
  // doc.setFont("tajawal", "normal"); // خطأ، الخط غير موجود افتراضياً في jsPDF

  // إعداد النص من اليمين لليسار
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 14, { align: "right" });

  autoTable(doc, {
    head: [columns.map((col) => col.title)],
    body: data.map((row) =>
      columns.map((col) =>
        col.format ? col.format(row[col.key]) : row[col.key] ?? ""
      )
    ),
    styles: { halign: "right" }, // ضبط المحاذاة للعربية
    margin: { top: 24 },
    html: undefined,
  });
  doc.save(filename.endsWith(".pdf") ? filename : filename + ".pdf");
}

