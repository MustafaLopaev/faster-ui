import { InputSize, InputState } from "./Input.types";

export const INPUT_WRAPPER_BASE =
  "fui:box-border fui:flex fui:items-center fui:font-sans fui:border fui:border-solid fui:rounded-control";

export const INPUT_WRAPPER_SIZE: Record<InputSize, string> = {
  [InputSize.lg]: "fui:h-10 fui:px-3 fui:gap-1",
  [InputSize.md]: "fui:h-9 fui:px-3 fui:gap-1",
  [InputSize.sm]: "fui:h-6 fui:px-2 fui:gap-1",
};

export const INPUT_WRAPPER_STATE: Record<InputState, string> = {
  [InputState.default]:
    "fui:bg-surface-raised fui:border-border-default fui:not-focus-within:hover:border-border-hover fui:focus-within:border-focus-ring",
  [InputState.error]: "fui:bg-surface-raised fui:border-feedback-error",
  [InputState.disabled]: "fui:bg-surface-sunken fui:border-border-disabled",
};

export const INPUT_TEXT_RAMP: Record<InputSize, string> = {
  [InputSize.lg]: "fui:text-subtitle",
  [InputSize.md]: "fui:text-body",
  [InputSize.sm]: "fui:text-caption",
};

export const INPUT_MESSAGE_RAMP: Record<InputSize, string> = {
  [InputSize.lg]: "fui:text-body",
  [InputSize.md]: "fui:text-body",
  [InputSize.sm]: "fui:text-caption",
};

export const INPUT_ICON_SLOT: Record<InputSize, string> = {
  [InputSize.lg]: "fui:size-4.5",
  [InputSize.md]: "fui:size-4",
  [InputSize.sm]: "fui:size-3.5",
};

export const INPUT_FIELD_BASE =
  "fui:min-w-0 fui:w-full fui:flex-1 fui:bg-transparent fui:border-0 fui:outline-none fui:p-0 fui:m-0 fui:font-sans fui:font-regular fui:text-text-control fui:placeholder:text-text-placeholder fui:disabled:text-text-disabled fui:disabled:placeholder:text-text-placeholder-disabled";

export const INPUT_NUMBER_RESET =
  "fui:[appearance:textfield] fui:[&::-webkit-inner-spin-button]:appearance-none fui:[&::-webkit-outer-spin-button]:appearance-none";

export const INPUT_FOCUS_RING =
  "fui:focus-visible:outline-2 fui:focus-visible:outline-solid fui:focus-visible:outline-offset-2 fui:focus-visible:outline-focus-ring";

export const INPUT_STEPPER_BUTTON =
  "fui:flex fui:items-center fui:justify-center fui:size-3.5 fui:p-0 fui:m-0 fui:bg-transparent fui:border-0 fui:enabled:cursor-pointer";

export const INPUT_STEPPER_COLUMN =
  "fui:flex fui:flex-col fui:shrink-0 fui:items-center fui:justify-center";

export const INPUT_ROOT = "fui:flex fui:flex-col fui:font-sans";

export const INPUT_LABEL = "fui:mb-1 fui:font-regular fui:text-text-heading";

export const INPUT_AFFIX = "fui:shrink-0 fui:font-regular";

export const INPUT_MESSAGE = "fui:m-0 fui:mt-1 fui:font-regular fui:text-feedback-error";

export const INPUT_CLEAR_BUTTON =
  "fui:size-4 fui:p-0 fui:m-0 fui:bg-transparent fui:border-0 fui:cursor-pointer fui:text-action-clear fui:hover:text-action-clear-hover fui:active:text-action-clear-active";

export const INPUT_ADORNMENT_COLOR = {
  enabled: "fui:text-icon-muted",
  disabled: "fui:text-text-disabled",
} as const;
