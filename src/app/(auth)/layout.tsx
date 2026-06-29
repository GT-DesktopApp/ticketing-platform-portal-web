import type { ReactNode } from "react";

/**
 * Auth layout — wraps unauthenticated screens (login, etc.).
 *
 * Full-viewport premium shell: a fixed, blurred, cover-fit background image with
 * a soft dark overlay, and the page content perfectly centered on every desktop
 * resolution. Route group `(auth)` keeps these pages out of the dashboard chrome
 * (no sidebar/header) without affecting the URL.
 *
 * The background is split into two fixed layers:
 *  - an image layer (`blur` lives here so the card stays crisp), and
 *  - an overlay layer (subtly tones the image so the white card stands out).
 * Putting `blur` on the image layer — not an ancestor of the card — is what
 * keeps the foreground content sharp.
 *
 * The artwork (`/login-bg.png`) is already a soft, hazy photograph, so we apply
 * only a faint extra blur and a light overlay; a heavy blur would muddy it.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Background image layer — fixed, cover, centered, faintly blurred. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-20 scale-105 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/login-bg.png')",
          backgroundAttachment: "fixed",
          filter: "blur(2px)",
        }}
      />
      {/* Light overlay so the elevated white card reads clearly against the art. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: "rgba(8, 23, 38, 0.18)" }}
      />

      {children}
    </main>
  );
}
