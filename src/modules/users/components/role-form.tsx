"use client";

import {
  BarChart3,
  BookOpen,
  Boxes,
  Cctv,
  Check,
  DatabaseBackup,
  FileText,
  Landmark,
  type LucideIcon,
  Receipt,
  Settings as SettingsIcon,
  Ticket,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";
import { useState } from "react";

import {
  useCreateRole,
  useUpdateRole,
} from "@/modules/users/hooks/use-users-admin";
import { type ModuleKey,MODULES } from "@/modules/users/modules";
import { roleInputSchema } from "@/modules/users/schemas";
import type { ManagedRole } from "@/modules/users/types";

/** Map the module icon names to their Lucide components. */
const ICONS: Record<string, LucideIcon> = {
  Ticket,
  BookOpen,
  Receipt,
  FileText,
  Boxes,
  Cctv,
  Landmark,
  UserCog,
  BarChart3,
  Users: UsersIcon,
  Settings: SettingsIcon,
  DatabaseBackup,
};

/**
 * Add / Edit Role form (ATTRACTION_ROlescreation). Basic Information (name +
 * optional description), Module Permissions (the 12 sidebar modules as
 * checkbox tiles), and Role Status (Active / Inactive). Each checked module
 * grants that module's full permission bundle on save.
 */
export function RoleForm({
  role,
  onCancel,
  onSaved,
}: {
  role: ManagedRole | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = !!role;
  const createMut = useCreateRole();
  const updateMut = useUpdateRole();
  const saving = createMut.isPending || updateMut.isPending;

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [modules, setModules] = useState<Set<ModuleKey>>(
    new Set(role?.modules ?? []),
  );
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function toggleModule(key: ModuleKey) {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setServerError(null);
    setNameError(null);

    const parsed = roleInputSchema.safeParse({
      name,
      description: description.trim() || null,
      modules: [...modules],
      isActive,
    });
    if (!parsed.success) {
      const nameIssue = parsed.error.issues.find((i) => i.path[0] === "name");
      setNameError(nameIssue?.message ?? "Please check the form.");
      return;
    }

    try {
      if (isEdit && role) {
        await updateMut.mutateAsync({ id: role.id, input: parsed.data });
        onSaved("Role updated.");
      } else {
        await createMut.mutateAsync(parsed.data);
        onSaved("Role created.");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to save role.");
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
        {/* Basic Information */}
        <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
          Basic Information
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-[13px] font-medium text-[var(--pos-navy)]">
              Role Name<span className="text-[#DC2626]">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Role name"
              disabled={role?.isSystem}
              className={`mt-1 h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[var(--pos-amber)] disabled:bg-[var(--login-hover-bg)]/60 ${
                nameError ? "border-[#DC2626]" : "border-[var(--login-border)]"
              }`}
            />
            {role?.isSystem && (
              <p className="mt-1 text-[12px] text-[var(--login-text-muted)]">
                System role names can’t be changed.
              </p>
            )}
            {nameError && (
              <p className="mt-1 text-[12px] text-[#DC2626]">{nameError}</p>
            )}
          </div>
          <div>
            <label className="text-[13px] font-medium text-[var(--pos-navy)]">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="Enter a short description about this role….."
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-[var(--login-border)] p-3 text-[14px] outline-none focus:border-[var(--pos-amber)]"
            />
          </div>
        </div>

        {/* Module Permissions */}
        <div className="mt-6 border-t border-[var(--login-border)] pt-5">
          <h3 className="text-[16px] font-bold text-[var(--pos-navy)]">
            Module Permissions
          </h3>
          <p className="text-[12px] text-[var(--login-text-muted)]">
            Select the modules this role can access
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MODULES.map((m) => {
              const Icon = ICONS[m.icon] ?? Landmark;
              const on = modules.has(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleModule(m.key)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                    on
                      ? "border-[var(--pos-navy)] bg-[var(--pos-navy)] text-white"
                      : "border-[var(--login-border)] bg-white text-[var(--pos-navy)] hover:border-[var(--pos-navy)]/40"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded ${
                      on
                        ? "bg-[var(--pos-amber)] text-[#1c1407]"
                        : "border border-[var(--login-border)]"
                    }`}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate text-[13px] font-medium">
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Status */}
        <div className="mt-6 border-t border-[var(--login-border)] pt-5">
          <h3 className="text-[16px] font-bold text-[var(--pos-navy)]">
            Role Status
          </h3>
          <div className="mt-2 inline-flex rounded-lg border border-[var(--login-border)] p-1">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[var(--pos-navy)] text-white"
                  : "text-[var(--login-text-muted)]"
              }`}
            >
              <span
                className={`size-2 rounded-full ${isActive ? "bg-[var(--pos-success)]" : "bg-current"}`}
              />
              Active
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                !isActive
                  ? "bg-[var(--pos-navy)] text-white"
                  : "text-[var(--login-text-muted)]"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </section>

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
          {saving ? "Saving…" : "Save Role"}
        </button>
      </div>
    </div>
  );
}
