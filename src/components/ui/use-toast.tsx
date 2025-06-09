import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export function toast({ title, description, variant = "default", duration = 3000 }: ToastProps) {
  return sonnerToast[variant === "destructive" ? "error" : "success"](title, {
    description,
    duration,
  });
}

export const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
      }}
    />
  );
}; 