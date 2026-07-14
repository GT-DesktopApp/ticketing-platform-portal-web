import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Inventory / Capacity" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Inventory / Capacity"
      icon="Boxes"
      description="Seat/bogie capacity and stock allocation."
    />
  );
}
