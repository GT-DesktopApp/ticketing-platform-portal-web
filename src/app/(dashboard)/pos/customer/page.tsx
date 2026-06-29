import type { Metadata } from "next";

import { CustomerStep } from "@/modules/pos/components/booking/customer-step";

export const metadata: Metadata = { title: "Customer Information" };

export default function CustomerPage() {
  return <CustomerStep />;
}
