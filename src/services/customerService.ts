import { Customer, CustomerFormData, PaginatedResponse } from '@/types';
import { api } from './api';
import { toast } from '@/hooks/use-toast';

class CustomerService {
  private readonly baseUrl = '/customers';

  async getCustomers(page = 1, limit = 10): Promise<PaginatedResponse<Customer>> {
    try {
      const response = await api.get<PaginatedResponse<Customer>>(`${this.baseUrl}`, {
        params: { page, limit }
      });
      return response.data;
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
      const response = await api.get<Customer>(`${this.baseUrl}/${id}`);
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
      const response = await api.post<Customer>(this.baseUrl, data);
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
      const response = await api.put<Customer>(`${this.baseUrl}/${id}`, data);
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
      await api.delete(`${this.baseUrl}/${id}`);
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
      const response = await api.post<Customer>(`${this.baseUrl}/${id}/block`, { reason });
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
      const response = await api.post<Customer>(`${this.baseUrl}/${id}/unblock`);
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
      const response = await api.put<Customer>(`${this.baseUrl}/${id}/notes`, { notes });
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
      const response = await api.get<Customer[]>(`${this.baseUrl}/search`, {
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