"use client";

import { toast } from "sonner";

export const useToast = () => {
  return {
    success: (title: string, description?: string) =>
      toast.success(title, {
        description,
      }),

    error: (title: string, description?: string) =>
      toast.error(title, {
        description,
      }),

    warning: (title: string, description?: string) =>
      toast.warning(title, {
        description,
      }),

    info: (title: string, description?: string) =>
      toast.info(title, {
        description,
      }),

    loading: (title: string) => toast.loading(title),

    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  };
};
