import type { Metadata } from "next";

import { BookingScreen } from "@/modules/pos/components/booking/booking-screen";

export const metadata: Metadata = {
  title: "Ticket Booking",
};

/**
 * POS booking page (homepage2). The interactive screen is a client component;
 * this server page is just the route entry.
 */
export default function PosPage() {
  return <BookingScreen />;
}
