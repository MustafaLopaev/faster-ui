// Falsy-filtering class join (research R-1) — the whole variant-styling
// architecture: static `fui:*` class maps composed per prop, consumer
// className always appended last by the caller.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
