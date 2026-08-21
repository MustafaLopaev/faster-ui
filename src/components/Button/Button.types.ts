import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Figma Small/Medium/Large (24/36/40px). */
export const ButtonSize = {
  sm: "sm",
  md: "md",
  lg: "lg",
} as const;
export type ButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

/** Visual style; maps 1:1 to the Figma text-button sets. */
export const ButtonVariant = {
  primary: "primary",
  outline: "outline",
  ghost: "ghost",
  link: "link",
  subtle: "subtle",
} as const;
export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

/**
 * Figma defines icon-only sets only for these three variants in the default
 * tone (A-11) — `link` has no box to draw a circle around.
 */
export const IconOnlyButtonVariant = {
  primary: ButtonVariant.primary,
  outline: ButtonVariant.outline,
  ghost: ButtonVariant.ghost,
} as const;
export type IconOnlyButtonVariant =
  (typeof IconOnlyButtonVariant)[keyof typeof IconOnlyButtonVariant];

/**
 * Which colour family a variant draws from. Internal: consumers select it with
 * the `danger` boolean, which reads better at the call site than `tone="danger"`.
 */
export const ButtonTone = {
  default: "default",
  danger: "danger",
} as const;
export type ButtonTone = (typeof ButtonTone)[keyof typeof ButtonTone];

interface ButtonBaseProps extends ComponentPropsWithoutRef<"button"> {
  /** Figma Small/Medium/Large (24/36/40px). */
  size?: ButtonSize;
  /** Busy state: spinner in the leading slot, `aria-busy`, activation suppressed. */
  loading?: boolean;
  elevated?: boolean;
}

/** The Button API for every non-`iconOnly` usage. */
export interface TextButtonProps extends ButtonBaseProps {
  iconOnly?: false;
  /** Visual style; maps 1:1 to the Figma text-button sets. */
  variant?: ButtonVariant;
  /** Switches the variant to its Figma danger counterpart set. */
  danger?: boolean;
  /** Leading icon slot (Figma Left Icon=True); presentational. */
  leftIcon?: ReactNode;
  /** Trailing icon slot (Figma Right Icon=True); presentational. */
  rightIcon?: ReactNode;
}

/** The Button API for circular icon-only usage — `aria-label` is required. */
export interface IconOnlyButtonProps extends ButtonBaseProps {
  /** Circular icon button (Figma icon-only sets); children are the icon. */
  iconOnly: true;
  /** Icon-only sets exist for primary/outline/ghost only (A-11). */
  variant?: IconOnlyButtonVariant;
  danger?: never;
  leftIcon?: never;
  rightIcon?: never;
  /** Required: the accessible name — there is no visible label (A11Y-001). */
  "aria-label": string;
}

export type ButtonProps = TextButtonProps | IconOnlyButtonProps;

/** Prop defaults, applied when destructuring in `Button.tsx`. */
export const BUTTON_DEFAULTS = {
  variant: ButtonVariant.primary,
  size: ButtonSize.md,
  danger: false,
  loading: false,
  iconOnly: false,
  /** Never submit by accident: an unset native `type` inside a form means "submit". */
  type: "button",
} as const;
