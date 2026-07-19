import type { Metadata } from "next";

import { LayoutManagement } from "@/modules/layouts/components/layout-management";

export const metadata: Metadata = { title: "Layout Management" };

/**
 * Layout Management route (reusable seat layouts). The interactive screen is a
 * client component; this server page is just the route entry.
 */
export default function Page() {
  return <LayoutManagement />;
}
