import { appConfig } from "@/config/app.config";

/** Format a number as currency using the app's configured locale/currency. */
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(appConfig.locale, {
    style: "currency",
    currency: appConfig.currency,
    ...options,
  }).format(amount);
}

/** Format a date in a human-readable, locale-aware way. */
export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
) {
  return new Intl.DateTimeFormat(appConfig.locale, options).format(
    new Date(value),
  );
}

/** Format a date with time, used for audit logs and timestamps. */
export function formatDateTime(value: Date | string | number) {
  return formatDate(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Convert an arbitrary string into a URL/identifier-safe slug. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Produce initials from a name, e.g. "Jane Doe" -> "JD". Useful for avatars. */
export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
