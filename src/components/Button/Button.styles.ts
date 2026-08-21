import { ButtonSize, ButtonTone, ButtonVariant, IconOnlyButtonVariant } from "./Button.types";
import type { IconOnlyButtonVariant as IconOnlyVariant } from "./Button.types";

export const BUTTON_BASE =
  "fui:box-border fui:inline-flex fui:items-center fui:justify-center fui:gap-1 fui:whitespace-nowrap fui:font-sans fui:enabled:cursor-pointer fui:focus-visible:outline-2 fui:focus-visible:outline-solid fui:focus-visible:outline-offset-2 fui:focus-visible:outline-focus-ring";

export const BUTTON_SIZE: Record<ButtonSize, string> = {
  [ButtonSize.lg]:
    "fui:h-10 fui:px-2 fui:py-2 fui:min-w-26.5 fui:text-subtitle fui:rounded-control",
  [ButtonSize.md]: "fui:h-9 fui:px-2 fui:py-1.75 fui:min-w-24.5 fui:text-body fui:rounded-control",
  [ButtonSize.sm]:
    "fui:h-6 fui:px-1 fui:py-0.75 fui:min-w-15.5 fui:text-caption fui:rounded-control",
};

export const BUTTON_LINK_SIZE: Record<ButtonSize, string> = {
  [ButtonSize.lg]: "fui:text-subtitle",
  [ButtonSize.md]: "fui:text-body",
  [ButtonSize.sm]: "fui:text-caption",
};

export const BUTTON_ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  [ButtonSize.lg]: "fui:size-10 fui:p-2.75 fui:text-subtitle fui:rounded-full",
  [ButtonSize.md]: "fui:size-9 fui:p-2.5 fui:text-body fui:rounded-full",
  [ButtonSize.sm]: "fui:size-6 fui:p-1.25 fui:text-caption fui:rounded-full",
};

export const BUTTON_ELEVATED = "fui:rounded-[10px]";

export const BUTTON_ICON_SLOT: Record<ButtonSize, string> = {
  [ButtonSize.lg]: "fui:size-4.5",
  [ButtonSize.md]: "fui:size-4",
  [ButtonSize.sm]: "fui:size-3.5",
};

export const BUTTON_VARIANT: Record<ButtonVariant, Record<ButtonTone, string>> = {
  [ButtonVariant.primary]: {
    [ButtonTone.default]:
      "fui:font-medium fui:border-0 fui:bg-action-primary fui:text-on-action fui:enabled:hover:bg-action-primary-hover fui:enabled:active:bg-action-primary-active fui:disabled:bg-action-primary-disabled",
    [ButtonTone.danger]:
      "fui:font-medium fui:border-0 fui:bg-action-danger fui:text-on-action fui:enabled:hover:bg-action-danger-hover fui:enabled:active:bg-action-danger-active fui:disabled:bg-action-danger-disabled",
  },
  [ButtonVariant.outline]: {
    [ButtonTone.default]:
      "fui:font-regular fui:bg-surface-raised fui:border fui:border-solid fui:border-action-secondary-border fui:text-action-secondary-text fui:enabled:hover:border-action-secondary-border-hover fui:enabled:hover:text-action-secondary-text-hover fui:enabled:active:border-action-secondary-border-active fui:enabled:active:text-action-secondary-text-active fui:disabled:border-action-secondary-border-disabled fui:disabled:text-action-secondary-text-disabled",
    [ButtonTone.danger]:
      "fui:font-regular fui:bg-surface-raised fui:border fui:border-solid fui:border-action-danger-outline fui:text-action-danger-outline fui:enabled:hover:border-action-danger-outline-hover fui:enabled:hover:text-action-danger-outline-hover fui:enabled:active:border-action-danger-outline-active fui:enabled:active:text-action-danger-outline-active fui:disabled:border-action-danger-outline-disabled fui:disabled:text-action-danger-outline-disabled",
  },
  [ButtonVariant.ghost]: {
    [ButtonTone.default]:
      "fui:font-regular fui:border-0 fui:bg-transparent fui:text-action-secondary-text fui:enabled:hover:bg-action-ghost-hover fui:enabled:active:bg-action-ghost-active fui:disabled:text-action-secondary-text-disabled",
    [ButtonTone.danger]:
      "fui:font-regular fui:border-0 fui:bg-transparent fui:text-action-danger-outline fui:enabled:hover:bg-action-ghost-danger-hover fui:enabled:active:bg-action-ghost-danger-active fui:enabled:active:text-action-danger-outline-active fui:disabled:text-action-danger-outline-disabled",
  },
  [ButtonVariant.subtle]: {
    [ButtonTone.default]:
      "fui:font-regular fui:border-0 fui:bg-[#F5F5F5] fui:text-action-secondary-text fui:enabled:hover:bg-action-ghost-hover fui:enabled:active:bg-action-ghost-active fui:disabled:text-action-secondary-text-disabled",
    [ButtonTone.danger]:
      "fui:font-regular fui:border-0 fui:bg-[#FEF2F2] fui:text-action-danger-outline fui:enabled:hover:bg-action-ghost-danger-hover fui:enabled:active:bg-action-ghost-danger-active fui:disabled:text-action-danger-outline-disabled",
  },
  [ButtonVariant.link]: {
    [ButtonTone.default]:
      "fui:font-regular fui:border-0 fui:bg-transparent fui:p-0 fui:no-underline fui:text-action-primary fui:enabled:hover:text-action-primary-hover fui:enabled:active:text-action-primary-active fui:disabled:text-action-link-disabled",
    [ButtonTone.danger]:
      "fui:font-regular fui:border-0 fui:bg-transparent fui:p-0 fui:no-underline fui:text-action-danger fui:enabled:hover:text-action-danger-hover fui:enabled:active:text-action-danger-active fui:disabled:text-action-danger-outline-disabled",
  },
};

export const BUTTON_ICON_ONLY_VARIANT: Record<IconOnlyVariant, string> = {
  [IconOnlyButtonVariant.primary]: BUTTON_VARIANT[ButtonVariant.primary][ButtonTone.default],
  [IconOnlyButtonVariant.outline]:
    "fui:font-regular fui:bg-surface-raised fui:border fui:border-solid fui:border-action-secondary-border fui:text-action-secondary-text fui:enabled:hover:bg-action-ghost-hover fui:enabled:active:bg-action-ghost-active fui:disabled:border-action-secondary-border-disabled fui:disabled:text-action-secondary-text-disabled",
  [IconOnlyButtonVariant.ghost]: BUTTON_VARIANT[ButtonVariant.ghost][ButtonTone.default],
};
