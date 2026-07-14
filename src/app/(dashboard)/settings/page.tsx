import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Settings"
      icon="Settings"
      description="Platform, branch and VAT configuration."
    />
  );
}
