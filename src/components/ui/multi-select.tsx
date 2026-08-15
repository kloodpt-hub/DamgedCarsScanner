"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  selectedLabel?: (count: number) => string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder,
      selectedLabel,
      disabled,
      ariaLabel,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const listId = useId();

    useEffect(() => {
      if (!open) return;

      const handlePointerDown = (e: MouseEvent | TouchEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [open]);

    const toggle = (optionValue: string) => {
      if (disabled) return;
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(next);
    };

    const triggerLabel =
      value.length > 0 && selectedLabel
        ? selectedLabel(value.length)
        : placeholder;

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn("relative", className)}
      >
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={ariaLabel}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-sm text-text",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "transition-colors duration-150",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "border-primary"
          )}
        >
          <span className="truncate text-start">{triggerLabel}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-muted transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="absolute start-0 end-0 top-full z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-card-border bg-card-bg p-1 shadow-xl"
          >
            {options.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-text-muted">
                {placeholder}
              </p>
            ) : (
              options.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm text-text",
                      "transition-colors duration-150 hover:bg-primary/10",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      checked && "font-medium"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-input-bg text-transparent"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }
);
MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
