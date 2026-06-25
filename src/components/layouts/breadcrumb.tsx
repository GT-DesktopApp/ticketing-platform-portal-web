"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

/**
 * Auto-generated breadcrumb derived from the current pathname.
 *
 * Each path segment becomes a crumb (title-cased); all but the last are
 * clickable links to the accumulated path. This keeps breadcrumbs in sync with
 * routing without per-page configuration. Pages can render a custom breadcrumb
 * instead when they need richer labels.
 */
function titleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          return (
            <Fragment key={href}>
              {index > 0 && <ChevronRight className="size-3.5" aria-hidden />}
              {isLast ? (
                <li className="font-medium text-foreground">
                  {titleCase(segment)}
                </li>
              ) : (
                <li>
                  <Link
                    href={href}
                    className="transition-colors hover:text-foreground"
                  >
                    {titleCase(segment)}
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
