import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve conflicting Tailwind utilities.
 *
 * `clsx` handles conditional/array/object class syntax; `tailwind-merge`
 * ensures that e.g. `cn("px-2", "px-4")` resolves to `px-4` instead of both.
 *
 * This is the canonical helper used by Shadcn UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
