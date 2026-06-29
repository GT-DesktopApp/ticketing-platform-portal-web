import type { Metadata } from "next";

import { PaymentStep } from "@/modules/pos/components/booking/payment-step";

export const metadata: Metadata = { title: "Process Payment" };

export default function PaymentPage() {
  return <PaymentStep />;
}
