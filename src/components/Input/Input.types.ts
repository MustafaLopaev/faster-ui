import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Figma Small/Medium/Large (24/36/40px). */
export const InputSize = {
  sm: "sm",
  md: "md",
  lg: "lg",
} as const;
export type InputSize = (typeof InputSize)[keyof typeof InputSize];

/** Visual state the field resolves to — derived from `error`/`disabled`, never passed directly. */
export const InputState = {
  default: "default",
  error: "error",
  disabled: "disabled",
} as const;
export type InputState = (typeof InputState)[keyof typeof InputState];

export const StepDirection = {
  up: 1,
  down: -1,
} as const;
export type StepDirection = (typeof StepDirection)[keyof typeof StepDirection];

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size" | "prefix"> {
  /** Figma Small/Medium/Large (24/36/40px). */
  size?: InputSize;
  /** Visible label rendered above the field, associated via htmlFor. */
  label?: ReactNode;
  /** Presence = error state: message below the field + aria-invalid/-describedby wiring. */
  error?: string;
  /** Leading in-field icon (Figma `Left icon` set); presentational. */
  leftIcon?: ReactNode;
  /** Trailing in-field icon (Figma `Right icon` set); presentational. */
  rightIcon?: ReactNode;
  /** Static leading affix text inside the field (Figma `Prefix`). */
  prefix?: ReactNode;
  /** Static trailing affix text inside the field (Figma `Suffix`). */
  suffix?: ReactNode;
  /** Clear affordance while the field has a value (Figma `State 2`). */
  clearable?: boolean;
  /** Called after the clear affordance empties the field. */
  onClear?: () => void;
}

/** Prop defaults, applied when destructuring in `Input.tsx`. */
export const INPUT_DEFAULTS = {
  size: InputSize.md,
  clearable: false,
} as const;

export const NUMBER_INPUT_TYPE = "number";
