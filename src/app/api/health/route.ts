import { ok } from "@/lib/api";

/**
 * Liveness/health endpoint. Unauthenticated by design (used by uptime checks
 * and load balancers). Demonstrates the standard success envelope.
 */
export async function GET() {
  return ok(
    { status: "ok", timestamp: new Date().toISOString() },
    "Service is healthy",
  );
}
