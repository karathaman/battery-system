import { toast } from '../components/ui/use-toast';

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiService {
  private config: Required<ApiConfig>;
  private defaultConfig: Required<ApiConfig> = {
    baseUrl: '/api',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  };

  constructor(config: ApiConfig) {
    this.config = { ...this.defaultConfig, ...config };
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount: number = this.config.retryCount
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const error: ApiError = new Error('API request failed');
        error.status = response.status;
        error.data = await response.json().catch(() => null);
        throw error;
      }

      return response;
    } catch (error) {
      if (retryCount > 0 && this.isRetryableError(error as Error)) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.fetchWithRetry(url, options, retryCount - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return true;
    }
    if ('status' in error) {
      const status = (error as ApiError).status;
      return status === 429 || status >= 500;
    }
    return false;
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        // Handle unauthorized
        toast({
          title: 'خطأ في المصادقة',
          description: 'يرجى تسجيل الدخول مرة أخرى',
          variant: 'destructive',
        });
      } else if (apiError.status === 403) {
        // Handle forbidden
        toast({
          title: 'غير مصرح',
          description: 'ليس لديك صلاحية للقيام بهذه العملية',
          variant: 'destructive',
        });
      } else if (apiError.status === 404) {
        // Handle not found
        toast({
          title: 'غير موجود',
          description: 'لم يتم العثور على البيانات المطلوبة',
          variant: 'destructive',
        });
      } else if (apiError.status === 422) {
        // Handle validation error
        const message = apiError.data?.message || 'بيانات غير صحيحة';
        toast({
          title: 'خطأ في البيانات',
          description: message,
          variant: 'destructive',
        });
      } else {
        // Handle other errors
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تنفيذ العملية',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
    throw error;
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}${endpoint}`,
        { ...options, method: 'GET' }
      );
      return response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}${endpoint}`,
        {
          ...options,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}${endpoint}`,
        {
          ...options,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}${endpoint}`,
        { ...options, method: 'DELETE' }
      );
      return response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export a singleton instance
export const api = new ApiService({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
}); 