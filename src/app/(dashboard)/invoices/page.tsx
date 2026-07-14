import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Invoices"
      icon="FileText"
      description="Generate and track customer invoices."
    />
  );
}
