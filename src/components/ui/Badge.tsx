import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "primary" | "secondary" | "success" | "destructive" | "outline";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary-light text-primary",
    secondary: "bg-orange-100 text-orange-800",
    success: "bg-emerald-50 text-emerald-800",
    destructive: "bg-red-50 text-red-700",
    outline: "border border-border text-foreground bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
