
import { Customer, CustomerFormData, PaginatedResponse } from '@/types';
import { toast } from '@/hooks/use-toast';

// Mock API implementation - replace with actual API calls
const mockApi = {
  get: async <T>(url: string, options?: { params?: Record<string, any> }): Promise<{ data: T }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: {} as T };
  },
  post: async <T>(url: string, data?: any): Promise<{ data: T }> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: {} as T };
  },
  put: async <T>(url: string, data?: any): Promise<{ data: T }> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: {} as T };
  },
  delete: async (url: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

class CustomerService {
  private readonly baseUrl = '/customers';

  async getCustomers(page = 1, limit = 10): Promise<PaginatedResponse<Customer>> {
    try {
      // Mock implementation
      const mockCustomers: Customer[] = [
        {
          id: "1",
          customerCode: "C001",
          name: "أحمد محمد",
          phone: "0501234567",
          description: "عميل مميز",
          notes: "عميل منتظم",
          lastPurchase: "2024-01-20",
          totalPurchases: 150,
          totalAmount: 45000,
          averagePrice: 300,
          purchases: [],
          last2Quantities: [25, 20],
          last2Prices: [280, 290],
          last2BatteryTypes: ["بطاريات عادية", "بطاريات جافة"],
          isBlocked: false,
          messageSent: false
        }
      ];

      return {
        data: mockCustomers,
        pagination: {
          page,
          limit,
          total: mockCustomers.length,
          totalPages: Math.ceil(mockCustomers.length / limit)
        }
      };
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب بيانات العملاء',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer> {
    try {
      const response = await mockApi.get<Customer>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب بيانات العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async createCustomer(data: CustomerFormData): Promise<Customer> {
    try {
      const response = await mockApi.post<Customer>(this.baseUrl, data);
      toast({
        title: 'نجاح',
        description: 'تم إضافة العميل بنجاح'
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async updateCustomer(id: string, data: Partial<CustomerFormData>): Promise<Customer> {
    try {
      const response = await mockApi.put<Customer>(`${this.baseUrl}/${id}`, data);
      toast({
        title: 'نجاح',
        description: 'تم تحديث بيانات العميل بنجاح'
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث بيانات العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await mockApi.delete(`${this.baseUrl}/${id}`);
      toast({
        title: 'نجاح',
        description: 'تم حذف العميل بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async blockCustomer(id: string, reason: string): Promise<Customer> {
    try {
      const response = await mockApi.post<Customer>(`${this.baseUrl}/${id}/block`, { reason });
      toast({
        title: 'نجاح',
        description: 'تم حظر العميل بنجاح'
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حظر العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async unblockCustomer(id: string): Promise<Customer> {
    try {
      const response = await mockApi.post<Customer>(`${this.baseUrl}/${id}/unblock`);
      toast({
        title: 'نجاح',
        description: 'تم إلغاء حظر العميل بنجاح'
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إلغاء حظر العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async updateCustomerNotes(id: string, notes: string): Promise<Customer> {
    try {
      const response = await mockApi.put<Customer>(`${this.baseUrl}/${id}/notes`, { notes });
      toast({
        title: 'نجاح',
        description: 'تم تحديث ملاحظات العميل بنجاح'
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث ملاحظات العميل',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const response = await mockApi.get<Customer[]>(`${this.baseUrl}/search`, { 
        params: { query } 
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء البحث عن العملاء',
        variant: 'destructive'
      });
      throw error;
    }
  }
}

export const customerService = new CustomerService();
