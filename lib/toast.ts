/**
 * Toast Notification System
 * Wraps sonner toasts with error-friendly messages
 */

import { toast } from 'sonner';

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const showToast = {
  // Success messages
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 3000,
      ...options,
    });
  },

  // Error messages - LOUD and clear
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  // Warning messages
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  // Info messages
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      duration: 3000,
      ...options,
    });
  },

  // Loading toast (returns ID to update later)
  loading: (message: string) => {
    return toast.loading(message);
  },

  // Update existing toast
  update: (toastId: string | number, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast[type](message, {
      id: toastId,
      duration: 3000,
    });
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss();
  },
};

// Helper for async operations with loading state
export async function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  }
): Promise<T> {
  const toastId = messages.loading ? showToast.loading(messages.loading) : undefined;

  try {
    const result = await promise;
    if (toastId) {
      showToast.update(toastId, messages.success || 'Success!', 'success');
    } else if (messages.success) {
      showToast.success(messages.success);
    }
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (toastId) {
      showToast.update(toastId, messages.error || `Error: ${errorMessage}`, 'error');
    } else {
      showToast.error(messages.error || `Error: ${errorMessage}`);
    }
    throw error;
  }
}
