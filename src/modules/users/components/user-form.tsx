"use client";

import { Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhone } from "@/modules/pos/utils/validation";
import {
  useCreateUser,
  useRoleOptions,
  useUpdateUser,
} from "@/modules/users/hooks/use-users-admin";
import {
  createUserSchema,
  updateUserSchema,
} from "@/modules/users/schemas";
import type { ManagedUser } from "@/modules/users/types";

type FieldErrors = Record<string, string>;

/**
 * Add / Edit User form (UserMnagemnetCreation). Basic Information (name, email,
 * mobile, username, password + confirm, with an admin-only Reset Password hint),
 * Role & Permissions (single role select + a "New Role" shortcut), and Status
 * (Active / Inactive). On edit, the password fields are optional.
 */
export function UserForm({
  user,
  onCancel,
  onSaved,
  onNewRole,
}: {
  user: ManagedUser | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
  onNewRole: () => void;
}) {
  const isEdit = !!user;
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const saving = createMut.isPending || updateMut.isPending;
  const { data: roleOptions = [] } = useRoleOptions();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mobile, setMobile] = useState<string | undefined>(
    user?.mobile ?? undefined,
  );
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState(user?.role?.id ?? "");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSave() {
    setServerError(null);
    const next: FieldErrors = {};

    // Mobile is stored/validated as an E.164 phone.
    if (!mobile || !isValidPhone(mobile)) {
      next.mobile = "Enter a valid mobile number";
    }

    const base = {
      name,
      email,
      username,
      mobile: mobile ?? "",
      roleId,
      isActive,
    };

    if (isEdit) {
      const parsed = updateUserSchema.safeParse({
        ...base,
        password: password || "",
        confirmPassword: confirmPassword || "",
      });
      if (!parsed.success) {
        for (const issue of parsed.error.issues)
          next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      if (Object.keys(next).length) return;
      try {
        await updateMut.mutateAsync({ id: user!.id, input: parsed.data! });
        onSaved("User updated.");
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Failed to save.");
      }
    } else {
      const parsed = createUserSchema.safeParse({
        ...base,
        password,
        confirmPassword,
      });
      if (!parsed.success) {
        for (const issue of parsed.error.issues)
          next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      if (Object.keys(next).length) return;
      try {
        await createMut.mutateAsync(parsed.data!);
        onSaved("User created.");
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Failed to save.");
      }
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
        {/* Basic Information */}
        <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
          Basic Information
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Full Name" required error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Full name"
              className={inputCls(errors.name)}
            />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Email Address"
              className={inputCls(errors.email)}
            />
          </Field>
          <Field label="Mobile Number" required error={errors.mobile}>
            <PhoneInput
              value={mobile}
              onChange={setMobile}
              invalid={!!errors.mobile}
              placeholder="Enter Mobile Number"
            />
          </Field>
          <Field label="Username" required error={errors.username}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Username"
              className={inputCls(errors.username)}
            />
          </Field>
          <Field
            label="Password"
            required={!isEdit}
            error={errors.password}
          >
            <PasswordInput
              value={password}
              onChange={setPassword}
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              placeholder={isEdit ? "Leave blank to keep current" : "Enter Password"}
              invalid={!!errors.password}
            />
          </Field>
          <Field
            label="Confirm Password"
            required={!isEdit}
            error={errors.confirmPassword}
          >
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder="Enter Confirm Password"
              invalid={!!errors.confirmPassword}
            />
            {isEdit && (
              <p className="mt-1 flex items-center justify-end gap-1.5 text-[12px] text-[var(--pos-navy)]">
                <RefreshCw className="size-3.5" /> Reset Password{" "}
                <span className="text-[var(--login-text-muted)]">
                  ( Admin only option )
                </span>
              </p>
            )}
          </Field>
        </div>
      </section>

      {/* Role & Permissions + Status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
            Role &amp; Permissions
          </h2>
          <div className="mt-4">
            <label className="text-[13px] font-medium text-[var(--pos-navy)]">
              Role<span className="text-[#DC2626]">*</span>
            </label>
            <div className="mt-1 flex gap-2">
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className={`h-10 flex-1 rounded-md border bg-white px-3 text-[14px] text-[var(--pos-navy)] outline-none focus:border-[var(--pos-amber)] ${
                  errors.roleId
                    ? "border-[#DC2626]"
                    : "border-[var(--login-border)]"
                }`}
              >
                <option value="">Select Roles</option>
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.isActive}>
                    {r.name}
                    {r.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onNewRole}
                className="flex items-center gap-1.5 rounded-md border border-[var(--login-border)] px-3 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
              >
                <Plus className="size-4" /> New Role
              </button>
            </div>
            {errors.roleId && (
              <p className="mt-1 text-[12px] text-[#DC2626]">{errors.roleId}</p>
            )}
            <p className="mt-2 text-[12px] text-[var(--login-text-muted)]">
              Custom roles created in Role Management will appear here.
            </p>
          </div>
        </section>

        <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">Status</h2>
          <p className="mt-4 text-[13px] font-medium text-[var(--pos-navy)]">
            Account Status<span className="text-[#DC2626]">*</span>
          </p>
          <div className="mt-2 inline-flex rounded-lg border border-[var(--login-border)] p-1">
            <StatusButton
              active={isActive}
              onClick={() => setIsActive(true)}
              dot
            >
              Active
            </StatusButton>
            <StatusButton active={!isActive} onClick={() => setIsActive(false)}>
              Inactive
            </StatusButton>
          </div>
        </section>
      </div>

      {serverError && (
        <p className="rounded-md border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-[13px] text-[#DC2626]">
          {serverError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-[var(--login-border)] bg-white/95 px-6 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--login-border)] px-6 py-2.5 text-[14px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--pos-amber)] px-6 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save User"}
        </button>
      </div>
    </div>
  );
}

function inputCls(error?: string) {
  return `h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[var(--pos-amber)] ${
    error ? "border-[#DC2626]" : "border-[var(--login-border)]"
  }`;
}

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[13px] font-medium text-[var(--pos-navy)]">
        {label}
        {required && <span className="text-[#DC2626]">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[12px] text-[#DC2626]">{error}</p>}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  invalid: boolean;
}) {
  return (
    <div
      className={`flex h-10 items-center rounded-md border px-3 focus-within:border-[var(--pos-amber)] ${
        invalid ? "border-[#DC2626]" : "border-[var(--login-border)]"
      }`}
    >
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="text-[var(--login-text-muted)] hover:text-[var(--pos-navy)]"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function StatusButton({
  active,
  dot = false,
  onClick,
  children,
}: {
  active: boolean;
  dot?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "bg-[var(--pos-navy)] text-white"
          : "text-[var(--login-text-muted)]"
      }`}
    >
      {dot && (
        <span
          className={`size-2 rounded-full ${active ? "bg-[var(--pos-success)]" : "bg-current"}`}
        />
      )}
      {children}
    </button>
  );
}
