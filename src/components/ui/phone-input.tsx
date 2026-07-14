"use client";

import RPNInput from "react-phone-number-input";

import { cn } from "@/lib/utils/index";

/**
 * App phone input — a thin wrapper over `react-phone-number-input`.
 *
 * Renders a country selector (flag + calling code) next to a formatted national
 * number field, and stores the value in E.164 (e.g. "+919812345678"). Styled via
 * the `.phone-field` classes in globals.css to match the standard <Input>.
 * Validate the stored value with `isValidPhone` from pos/utils/validation.
 */
export function PhoneInput({
  value,
  onChange,
  invalid = false,
  disabled = false,
  placeholder = "Enter mobile number",
  defaultCountry = "IN",
  id,
}: {
  /** E.164 string, or undefined when empty. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** Draw the invalid (destructive) border/ring. */
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Initial country (ISO-3166 alpha-2). Defaults to India. */
  defaultCountry?: string;
  id?: string;
}) {
  return (
    <RPNInput
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultCountry={defaultCountry as any}
      international
      countryCallingCodeEditable={false}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      numberInputProps={{ id }}
      className={cn(
        "phone-field",
        invalid && "phone-field-invalid",
        disabled && "phone-field-disabled",
      )}
    />
  );
}
