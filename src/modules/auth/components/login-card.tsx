import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Elevated white login card: circular logo, heading, subtitle, then `children`
 * (the form). Owns the premium card chrome — generous padding, 24px radius, the
 * luxurious drop shadow, and the load-in fade/scale animation — so pages just
 * drop their form inside.
 *
 * Width is fluid up to the design's 520px ceiling (`w-full max-w-[520px]`),
 * which gives the responsive behavior for free: it fills 90–95% on tablet /
 * mobile and tops out at the target width on desktop.
 */
export function LoginCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="login-card-animate w-full max-w-[520px] rounded-3xl bg-white p-6 shadow-[0_25px_60px_rgba(0,0,0,0.18)] sm:p-10">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/login-logo.svg"
          alt="Ticketing Platform"
          width={100}
          height={100}
          priority
          className="size-[100px]"
        />

        <h1 className="mt-6 text-[36px] leading-tight font-bold text-[var(--login-navy)]">
          {title}
        </h1>
        <p className="mt-2 text-[20px] leading-relaxed text-[var(--login-text-muted)]">
          {subtitle}
        </p>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
