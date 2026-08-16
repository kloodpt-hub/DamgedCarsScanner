"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarProvider";

export function ShellMain({ children }: { children: ReactNode }) {
  const { collapsed, mounted } = useSidebar();
  const offset = !mounted || !collapsed ? "lg:ms-64" : "lg:ms-17";

  return (
    <div
      className={cn(
        offset,
        "transition-[margin-inline-start] duration-500 ease-premium"
      )}
    >
      <main className="px-4 pt-20 pb-24 lg:px-6 lg:pt-20 lg:pb-6">{children}</main>
    </div>
  );
}
