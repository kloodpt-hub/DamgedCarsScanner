"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-lg border bg-input-bg px-3.5 py-2.5 pe-10 text-sm text-text",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            "transition-colors duration-200 ease-premium",
            error
              ? "border-danger focus:ring-danger/50 focus:border-danger"
              : "border-border",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
