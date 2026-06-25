import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Dashboard landing page (foundation placeholder).
 *
 * The live dashboard (KPIs, charts, recent activity) is a later milestone.
 * This page confirms the protected shell renders and the layout is wired.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Ticketing Platform admin console.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Tickets Today", "Active Customers", "Revenue", "Open Counters"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold">—</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Wired in a later milestone
              </p>
            </div>
          ),
        )}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-medium">Foundation ready ✅</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Authentication, RBAC, API architecture, and the layout shell are in
          place. Build features as modules under <code>src/modules</code>.
        </p>
      </div>
    </div>
  );
}
