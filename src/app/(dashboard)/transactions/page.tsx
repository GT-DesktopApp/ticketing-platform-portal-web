import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Transactions" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Transactions"
      icon="Receipt"
      description="Payment transactions across the POS."
    />
  );
}
