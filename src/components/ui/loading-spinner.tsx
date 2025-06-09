import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({
  size = "md",
  className,
  ...props
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    >
      <Loader2 className="w-full h-full" />
      <span className="sr-only">جاري التحميل</span>
    </div>
  );
}; 