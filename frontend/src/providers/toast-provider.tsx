"use client";

import { Toaster } from "sonner";

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}

      <Toaster
        position="top-right"
        expand
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "!bg-zinc-950 !border !border-red-500/20 !text-white",
            title: "!text-white",
            description: "!text-zinc-400",
            success: "!border-emerald-500/20",
            error: "!border-red-500/30",
            warning: "!border-amber-500/20",
            info: "!border-blue-500/20",
          },
        }}
      />
    </>
  );
}
