import { appConfig } from "@/config/app.config";

/**
 * Below-card footer: "Don't have an account? Contact Administrator".
 *
 * The contact target is a `mailto:` link so the gold call-to-action is actually
 * actionable. Sits below the card per the design reference, centered.
 */
export function FooterMessage({ email }: { email?: string }) {
  const contactHref = email ? `mailto:${email}` : undefined;

  return (
    <p className="mt-8 text-center text-[18px] text-[var(--login-text-muted)]">
      Don&apos;t have an account?{" "}
      {contactHref ? (
        <a
          href={contactHref}
          className="font-semibold text-[var(--login-amber)] underline-offset-4 transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Contact Administrator
        </a>
      ) : (
        <span className="font-semibold text-[var(--login-amber)]">
          Contact Administrator
        </span>
      )}
    </p>
  );
}

/** Convenience: default footer wired to the app's configured admin contact. */
export function DefaultFooterMessage() {
  return <FooterMessage email={appConfig.supportEmail} />;
}
