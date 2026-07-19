import type { Metadata } from "next";

import { UserManagement } from "@/modules/users/components/user-management";

export const metadata: Metadata = { title: "User Management" };

/**
 * User Management route (Users + Roles tabs). The interactive screen is a client
 * component; this server page is just the route entry.
 */
export default function Page() {
  return <UserManagement />;
}
