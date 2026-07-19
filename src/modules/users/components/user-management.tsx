"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { ResetPasswordDialog } from "@/modules/users/components/reset-password-dialog";
import { RoleForm } from "@/modules/users/components/role-form";
import { RolesList } from "@/modules/users/components/roles-list";
import { UserForm } from "@/modules/users/components/user-form";
import { UsersList } from "@/modules/users/components/users-list";
import type { ManagedRole, ManagedUser } from "@/modules/users/types";

type Tab = "users" | "roles";

type View =
  | { kind: "list" }
  | { kind: "user-form"; user: ManagedUser | null }
  | { kind: "role-form"; role: ManagedRole | null };

/**
 * User Management screen — Users | Roles tabs, each with a table/empty-state and
 * full-page Add/Edit forms (UserManagement*, userRoleManagement,
 * ATTRACTION_ROlescreation). A small view state machine swaps between the list
 * and the forms; a shared toast surfaces the result of each action.
 */
export function UserManagement() {
  const [tab, setTab] = useState<Tab>("users");
  const [view, setView] = useState<View>({ kind: "list" });
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  // ── Full-page forms ────────────────────────────────────────────────────────
  if (view.kind === "user-form") {
    return (
      <Shell>
        <BackHeader
          title={view.user ? "Edit User" : "Add User"}
          onBack={() => setView({ kind: "list" })}
        />
        <UserForm
          user={view.user}
          onCancel={() => setView({ kind: "list" })}
          onSaved={(m) => {
            showToast(m);
            setView({ kind: "list" });
          }}
          onNewRole={() => setView({ kind: "role-form", role: null })}
        />
        {toast && <Toast message={toast} />}
      </Shell>
    );
  }

  if (view.kind === "role-form") {
    return (
      <Shell>
        <BackHeader
          title={view.role ? "Edit Role" : "Add Role"}
          onBack={() => {
            setTab("roles");
            setView({ kind: "list" });
          }}
        />
        <RoleForm
          role={view.role}
          onCancel={() => setView({ kind: "list" })}
          onSaved={(m) => {
            showToast(m);
            setTab("roles");
            setView({ kind: "list" });
          }}
        />
        {toast && <Toast message={toast} />}
      </Shell>
    );
  }

  // ── List with tabs ─────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <TabBtn active={tab === "users"} onClick={() => setTab("users")}>
          Users
        </TabBtn>
        <TabBtn active={tab === "roles"} onClick={() => setTab("roles")}>
          Roles
        </TabBtn>
      </div>

      {tab === "users" ? (
        <UsersList
          onAdd={() => setView({ kind: "user-form", user: null })}
          onEdit={(u) => setView({ kind: "user-form", user: u })}
          onResetPassword={(u) => setResetUser(u)}
          onToast={showToast}
        />
      ) : (
        <RolesList
          onAdd={() => setView({ kind: "role-form", role: null })}
          onEdit={(r) => setView({ kind: "role-form", role: r })}
          onToast={showToast}
        />
      )}

      <ResetPasswordDialog
        user={resetUser}
        onOpenChange={(o) => !o && setResetUser(null)}
        onDone={(m) => {
          setResetUser(null);
          showToast(m);
        }}
      />

      {toast && <Toast message={toast} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-[15px] font-semibold transition-colors ${
        active
          ? "bg-[var(--pos-amber)] text-[#1c1407]"
          : "text-[var(--login-text-muted)] hover:text-[var(--pos-navy)]"
      }`}
    >
      {children}
    </button>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex w-fit items-center gap-2 text-[16px] font-bold text-[var(--pos-navy)] transition-colors hover:text-[var(--pos-amber-600)]"
    >
      <ArrowLeft className="size-5" /> {title}
    </button>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[var(--pos-navy)] px-4 py-3 text-[13px] font-medium text-white shadow-lg">
      {message}
    </div>
  );
}
