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
    primary: "bg-primary-light text-primary-dark",
    secondary: "bg-amber-100 text-amber-800",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-border text-foreground bg-white",
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
