export const APP_CONFIG = {
  name: 'نظام إدارة البطاريات',
  version: '1.0.0',
  description: 'نظام متكامل لإدارة البطاريات والعملاء',
  author: 'Your Company',
  contact: {
    email: 'support@yourcompany.com',
    phone: '0500000000'
  }
} as const;

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000
} as const;

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100]
} as const;

export const NOTE_COLORS = [
  { name: "أصفر", value: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", header: "from-yellow-400 to-yellow-500" },
  { name: "أزرق", value: "blue", bg: "bg-blue-50", border: "border-blue-200", header: "from-blue-400 to-blue-500" },
  { name: "أخضر", value: "green", bg: "bg-green-50", border: "border-green-200", header: "from-green-400 to-green-500" },
  { name: "أحمر", value: "red", bg: "bg-red-50", border: "border-red-200", header: "from-red-400 to-red-500" },
  { name: "بنفسجي", value: "purple", bg: "bg-purple-50", border: "border-purple-200", header: "from-purple-400 to-purple-500" },
  { name: "وردي", value: "pink", bg: "bg-pink-50", border: "border-pink-200", header: "from-pink-400 to-pink-500" }
] as const;

export const DATE_FORMAT = {
  display: 'DD/MM/YYYY',
  api: 'YYYY-MM-DD',
  time: 'HH:mm:ss',
  datetime: 'YYYY-MM-DD HH:mm:ss'
} as const;

export const CURRENCY_CONFIG = {
  code: 'SAR',
  symbol: 'ر.س',
  locale: 'ar-SA'
} as const;

export const ERROR_MESSAGES = {
  required: 'هذا الحقل مطلوب',
  invalidPhone: 'رقم الهاتف غير صحيح',
  invalidEmail: 'البريد الإلكتروني غير صحيح',
  invalidCustomerCode: 'كود العميل يجب أن يكون بالصيغة CXXX',
  networkError: 'حدث خطأ في الاتصال بالشبكة',
  serverError: 'حدث خطأ في الخادم',
  unauthorized: 'غير مصرح لك بالوصول',
  forbidden: 'غير مسموح لك بهذا الإجراء',
  notFound: 'لم يتم العثور على البيانات المطلوبة',
  validationError: 'البيانات المدخلة غير صحيحة'
} as const;

export const SUCCESS_MESSAGES = {
  created: 'تم الإنشاء بنجاح',
  updated: 'تم التحديث بنجاح',
  deleted: 'تم الحذف بنجاح',
  saved: 'تم الحفظ بنجاح',
  blocked: 'تم الحظر بنجاح',
  unblocked: 'تم إلغاء الحظر بنجاح'
} as const;

export const QUERY_KEYS = {
  customers: 'customers',
  customer: 'customer',
  notes: 'notes',
  note: 'note',
  batteryTypes: 'batteryTypes',
  batteryType: 'batteryType',
  suppliers: 'suppliers',
  supplier: 'supplier',
  purchases: 'purchases',
  purchase: 'purchase'
} as const; 