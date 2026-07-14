import * as Icons from "lucide-react";

/**
 * A consistent "coming soon" page for nav modules whose features aren't built
 * yet. Keeps the sidebar's 13-item design intact without dead links — each item
 * lands on a clear, branded placeholder instead of a 404.
 */
export function PlaceholderPage({
  title,
  description,
  icon = "Sparkles",
}: {
  title: string;
  description?: string;
  /** Lucide icon name; falls back to a circle if unknown. */
  icon?: string;
}) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[icon] ??
    Icons.Circle;

  return (
    <div className="flex min-h-[60vh] flex-col">
      <h1 className="text-2xl font-bold" style={{ color: "var(--pos-navy)" }}>
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}

      <div className="mt-8 flex flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--login-border)] bg-white p-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--pos-blue-soft)]">
          <Icon className="size-8 text-[var(--pos-navy)]" aria-hidden />
        </div>
        <p className="mt-4 text-lg font-semibold text-[var(--pos-navy)]">
          Coming soon
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The <span className="font-medium">{title}</span> module is part of the
          platform roadmap and will be available in an upcoming release.
        </p>
      </div>
    </div>
  );
}
