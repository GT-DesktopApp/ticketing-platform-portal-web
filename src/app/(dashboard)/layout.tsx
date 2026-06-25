import type { ReactNode } from "react";

import { Header } from "@/components/layouts/header";
import { Sidebar } from "@/components/layouts/sidebar";

/**
 * Dashboard layout — the authenticated application shell.
 *
 * Structure: fixed sidebar (desktop) + a column with a sticky header and the
 * scrollable page content. Authentication is enforced upstream by the
 * middleware (any route not in PUBLIC_ROUTES requires a session), so this
 * layout can assume an authenticated user.
 *
 * Responsive: the sidebar is hidden below `lg`; a mobile drawer toggle can be
 * layered into the Header later without changing this structure.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
