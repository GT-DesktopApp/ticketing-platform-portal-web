import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Bookings"
      icon="BookOpen"
      description="View and manage all ticket bookings."
    />
  );
}
