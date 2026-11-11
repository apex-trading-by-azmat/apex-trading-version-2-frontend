import * as React from "react";
import { cn } from "cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "danger" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        {
          default: "border-border bg-card text-foreground",
          secondary: "border-border bg-secondary text-secondary-foreground",
          outline: "border-primary/60 bg-transparent text-primary",
          success: "border-up/30 bg-up/10 text-up",
          danger: "border-down/30 bg-down/10 text-down",
          warning: "border-warning/30 bg-warning/10 text-warning",
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
