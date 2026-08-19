import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export const SLOT_BASE = "fui:inline-flex fui:shrink-0 fui:items-center fui:justify-center";

export interface IconSlotProps {
  className?: string;
  children: ReactNode;
}

export function IconSlot({ className, children }: IconSlotProps) {
  return (
    <span aria-hidden="true" className={cn(SLOT_BASE, className)}>
      {children}
    </span>
  );
}
