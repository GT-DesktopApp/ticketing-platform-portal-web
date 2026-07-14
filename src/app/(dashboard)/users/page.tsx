import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "User Management" };

export default function Page() {
  return (
    <PlaceholderPage
      title="User Management"
      icon="UserCog"
      description="Manage staff accounts and access."
    />
  );
}
