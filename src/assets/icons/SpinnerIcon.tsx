import { cn } from "../../lib/cn";
import { ICON_BASE } from "./icon.types";

export function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("fui:animate-spin fui:motion-reduce:animate-none", ICON_BASE)}
    >
      <path d="M14 8a6 6 0 1 1-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
