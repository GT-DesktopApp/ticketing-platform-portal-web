import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Complimentary Passes" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Complimentary Passes"
      icon="Ticket"
      description="Issue and audit complimentary passes."
    />
  );
}
