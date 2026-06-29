import type { Metadata } from "next";

import { SeatStep } from "@/modules/pos/components/booking/seat-step";

export const metadata: Metadata = { title: "Seat Allocation" };

export default function SeatsPage() {
  return <SeatStep />;
}
