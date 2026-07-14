"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { ROUTES } from "@/lib/constants/routes";
import { useCartStore } from "@/modules/pos/store/cart-store";

/**
 * Breadcrumb derived from the current pathname, with two refinements over a
 * naive segment split:
 *
 *  1. Friendly labels — segments are looked up in SEGMENT_LABELS (e.g. "pos" →
 *     "Ticket Booking") and otherwise title-cased.
 *
 *  2. Wizard hierarchy — the POS checkout steps live at SIBLING paths
 *     (/pos/customer, /pos/seats, /pos/payment), not nested ones, so a raw split
 *     of /pos/payment would read "Ticket Booking › Payment" and drop the
 *     Customer step. WIZARDS re-expresses those flat routes as an ordered trail
 *     up to the current step: Ticket Booking › Customer › Payment.
 */

/** Segment → display label (only where title-casing isn't enough). */
const SEGMENT_LABELS: Record<string, string> = {
  pos: "Ticket Booking",
  cctv: "CCTV Monitoring",
  qr: "QR Verify",
};

/** A single crumb: a label and the URL it links to. */
interface Crumb {
  label: string;
  href: string;
}

/**
 * Multi-step flows whose steps are sibling routes. Each entry maps a base route
 * to its ordered steps; the breadcrumb shows the base plus every step up to and
 * including the current one.
 */
const WIZARDS: {
  base: string;
  baseLabel: string;
  steps: { segment: string; label: string }[];
}[] = [
  {
    base: ROUTES.POS,
    baseLabel: "Ticket Booking",
    steps: [
      { segment: "customer", label: "Customer" },
      { segment: "seats", label: "Seats" },
      { segment: "payment", label: "Payment" },
    ],
  },
];

/** Stable Set instances so the memoised crumb build doesn't churn. */
const EMPTY_SKIP: Set<string> = new Set();
const SKIP_SEATS: Set<string> = new Set(["seats"]);

function titleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelFor(segment: string) {
  return SEGMENT_LABELS[segment] ?? titleCase(segment);
}

/**
 * Build the ordered crumb list for a pathname. For a wizard sub-route, the trail
 * is: base → each step in the wizard's defined order up to the current step,
 * omitting any step in `skipSegments` (e.g. "seats" for a non-seated attraction).
 * For any other route it is the plain accumulated-segment trail.
 */
function buildCrumbs(pathname: string, skipSegments: Set<string>): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  // Is this a step within a known wizard? (e.g. /pos/payment)
  const wizard = WIZARDS.find((w) => pathname.startsWith(`${w.base}/`));
  if (wizard) {
    const currentSegment = segments[segments.length - 1];
    const currentIndex = wizard.steps.findIndex(
      (s) => s.segment === currentSegment,
    );
    // Recognised step → base + steps up to the current one, in wizard order.
    if (currentIndex >= 0) {
      const crumbs: Crumb[] = [
        { label: wizard.baseLabel, href: wizard.base },
      ];
      for (let i = 0; i <= currentIndex; i++) {
        const step = wizard.steps[i];
        // Skip an optional step (e.g. Seats) unless it's the current page.
        if (i !== currentIndex && skipSegments.has(step.segment)) continue;
        crumbs.push({
          label: step.label,
          href: `${wizard.base}/${step.segment}`,
        });
      }
      return crumbs;
    }
  }

  // Default: one crumb per accumulated path segment.
  return segments.map((segment, index) => ({
    label: labelFor(segment),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }));
}

export function Breadcrumb() {
  const pathname = usePathname();
  // The seat step only applies to attractions that require seats; otherwise
  // omit it from the POS wizard trail.
  const requiresSeats = useCartStore(
    (s) => s.selectedAttraction?.requiresSeats ?? false,
  );
  const skipSegments = requiresSeats ? EMPTY_SKIP : SKIP_SEATS;
  const crumbs = buildCrumbs(pathname, skipSegments);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {index > 0 && <ChevronRight className="size-3.5" aria-hidden />}
              {isLast ? (
                <li className="font-medium text-foreground">{crumb.label}</li>
              ) : (
                <li>
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
