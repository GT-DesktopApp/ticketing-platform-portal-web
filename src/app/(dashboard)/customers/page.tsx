import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Customer Management" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Customer Management"
      icon="Users"
      description="Search, view and manage customer records."
    />
  );
}
