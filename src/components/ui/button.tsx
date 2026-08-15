"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-hover focus:ring-primary/50",
        destructive:
          "bg-danger text-white hover:bg-danger/90 focus:ring-danger/50",
        outline:
          "border border-border bg-transparent text-text hover:bg-surface focus:ring-primary/50",
        secondary:
          "bg-surface text-text border border-border hover:bg-border focus:ring-primary/50",
        ghost:
          "bg-transparent text-text-muted hover:text-text hover:bg-surface focus:ring-primary/50",
        link: "bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-10 rounded-lg px-3 text-sm",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
