import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface ApiOptions {
  showToast?: boolean;
  toastSuccessMessage?: string;
  toastErrorMessage?: string;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options: ApiOptions = {}
  ) => {
    const {
      showToast = true,
      toastSuccessMessage = 'تمت العملية بنجاح',
      toastErrorMessage = 'حدث خطأ أثناء تنفيذ العملية',
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });

      if (showToast) {
        toast({
          title: 'نجاح',
          description: toastSuccessMessage,
        });
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setState({ data: null, loading: false, error: new Error(errorMessage) });

      if (showToast) {
        toast({
          title: 'خطأ',
          description: toastErrorMessage,
          variant: 'destructive',
        });
      }

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Example usage:
/*
const { data, loading, error, execute } = useApi<Customer>();

// In your component:
const handleSubmit = async (formData: CustomerFormData) => {
  try {
    await execute(
      () => api.createCustomer(formData),
      {
        toastSuccessMessage: 'تم إضافة العميل بنجاح',
        toastErrorMessage: 'فشل في إضافة العميل',
      }
    );
  } catch (error) {
    // Handle error if needed
  }
};
*/
