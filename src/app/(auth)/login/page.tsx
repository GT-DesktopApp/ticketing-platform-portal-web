"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { appConfig } from "@/config/app.config";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/constants/routes";
import {
  FooterMessage,
  InputField,
  LoginButton,
  LoginCard,
  type LoginRole,
  PasswordField,
  RoleTabs,
} from "@/modules/auth/components";
import {
  type LoginInput,
  loginSchema,
} from "@/modules/auth/schemas/login.schema";

/**
 * Premium login experience.
 *
 * The form remains a single Email/Password credentials flow: the user's role is
 * resolved from the database record on the server during verification, never
 * from the client. The Admin/Manager/Staff tabs are a **visual** selector only
 * (see {@link RoleTabs}) and do not influence authentication.
 *
 * The page is pure composition of the small `auth` UI components — no markup or
 * styling is duplicated here.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [role, setRole] = useState<LoginRole>("admin");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid email or password.");
      return;
    }
    const callbackUrl =
      searchParams.get("callbackUrl") ?? DEFAULT_LOGIN_REDIRECT;
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[520px]">
      <LoginCard
        title="Welcome Back!"
        subtitle="Login to continue managing tickets, bookings and visitors."
      >
        {/* <RoleTabs value={role} onChange={setRole} /> */}

        {serverError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[16px] text-destructive"
          >
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-5"
          noValidate
        >
          <InputField
            id="email"
            label="Email/Username"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="Enter your email or username"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="space-y-2">
            <PasswordField
              id="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="flex justify-end">
              <a
                href="#"
                className="text-[16px] text-[var(--login-text-muted)] underline-offset-4 transition-colors hover:text-[var(--login-navy)] hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          <LoginButton loading={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Login"}
          </LoginButton>
        </form>
      </LoginCard>

      <FooterMessage email={appConfig.supportEmail} />
    </div>
  );
}

/**
 * Page wrapper: `useSearchParams()` (read inside LoginForm to honor a
 * `callbackUrl`) requires a Suspense boundary for static prerendering.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
