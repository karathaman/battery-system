import { z } from 'zod';

// Types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Phone number validation regex for Saudi Arabia
const SAUDI_PHONE_REGEX = /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;

// Common validation schemas
export const phoneSchema = z.string()
  .regex(SAUDI_PHONE_REGEX, 'رقم الجوال غير صحيح')
  .min(10, 'رقم الجوال يجب أن يكون 10 أرقام')
  .max(10, 'رقم الجوال يجب أن يكون 10 أرقام');

export const nameSchema = z.string()
  .min(2, 'الاسم يجب أن يكون على الأقل حرفين')
  .max(100, 'الاسم يجب أن لا يتجاوز 100 حرف')
  .regex(/^[\u0600-\u06FF\s]+$/, 'الاسم يجب أن يكون باللغة العربية');

export const priceSchema = z.number()
  .positive('السعر يجب أن يكون أكبر من صفر')
  .max(1000000, 'السعر يجب أن لا يتجاوز 1,000,000');

export const quantitySchema = z.number()
  .int('الكمية يجب أن تكون رقماً صحيحاً')
  .min(0, 'الكمية يجب أن تكون صفر أو أكثر')
  .max(10000, 'الكمية يجب أن لا تتجاوز 10,000');

// Customer validation schema
export const customerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Supplier validation schema
export const supplierSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Battery type validation schema
export const batteryTypeSchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  unite_price: priceSchema,
  currentQty: quantitySchema,
  averageBuyingPrice: priceSchema,
  lastPrice: priceSchema,
});

// Validation functions
export const validatePhone = (phone: string): boolean => {
  return SAUDI_PHONE_REGEX.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100;
};

export const validatePrice = (price: number): boolean => {
  return price > 0 && price <= 1000000;
};

export const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity >= 0 && quantity <= 10000;
};

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: z.ZodType<T>
): ValidationResult => {
  try {
    schema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path[0]] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { _form: 'حدث خطأ في التحقق من البيانات' } };
  }
};

// Sanitization functions
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

export const sanitizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

export const sanitizePrice = (price: number): number => {
  return Math.round(price * 100) / 100;
};

export const sanitizeQuantity = (quantity: number): number => {
  return Math.floor(quantity);
}; 