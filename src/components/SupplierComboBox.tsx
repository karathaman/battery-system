
import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Supplier = {
  name: string;
  supplierCode?: string;
  phone?: string;
  totalQuantity?: number;
};

interface SupplierComboBoxProps {
  suppliers: Supplier[];
  value: string;
  onChange: (name: string, supplier?: Supplier) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const SupplierComboBox: React.FC<SupplierComboBoxProps> = ({
  suppliers,
  value,
  onChange,
  placeholder,
  readOnly,
}) => {
  const [inputValue, setInputValue] = React.useState(value);

  // Nominalize input and match in list
  const filteredSuppliers = useMemo(() => {
    if (!inputValue) return suppliers;
    const lower = inputValue.toLowerCase();
    return suppliers.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(lower)) ||
        (s.supplierCode && s.supplierCode.toLowerCase().includes(lower)) ||
        (s.phone && s.phone.includes(inputValue))
    );
  }, [inputValue, suppliers]);

  // Only top 10 by quantity, descending
  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort(
      (a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0)
    ).slice(0, 10);
  }, [filteredSuppliers]);

  return (
    <div className="relative w-full">
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        disabled={readOnly}
        className="mb-1"
        style={{ fontFamily: 'Tajawal, sans-serif' }}
        autoComplete="off"
        autoCorrect="off"
      />
      {!readOnly && sortedSuppliers.length > 0 && (
        <Select
          value={""}
          onValueChange={val => {
            const s = sortedSuppliers.find(sup => sup.name === val);
            setInputValue(val);
            if (s) {
              onChange(s.name, s);
            } else {
              onChange(val);
            }
          }}
        >
          <SelectTrigger className="bg-white absolute top-9 left-0 right-0 border z-30 rounded-b overflow-y-auto max-h-48 text-right" style={{direction: "rtl"}}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-40 bg-white">
            {sortedSuppliers.map((supplier) => (
              <SelectItem key={supplier.name} value={supplier.name}>
                <div className="flex flex-col items-end">
                  <span className="font-bold">{supplier.name}</span>
                  <span className="text-xs text-gray-500">
                    {supplier.supplierCode && <>كود: {supplier.supplierCode}{" "}</>}
                    كمية: <span className="font-bold">{supplier.totalQuantity ?? 0}</span>
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
