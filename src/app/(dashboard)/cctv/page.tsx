import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "CCTV Monitoring" };

export default function Page() {
  return (
    <PlaceholderPage
      title="CCTV Monitoring"
      icon="Cctv"
      description="Live camera feeds across attractions."
    />
  );
}
