import { useState } from "react";
import { Navigate, useLocation, useNavigate, type Location } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CircleAlert, Eye, EyeOff, Lock, LogIn, Mail, Megaphone, ShieldCheck, Wallet } from "lucide-react";

import { authService } from "@/api/services/auth";
import { WebAppButton } from "@/components/Button";
import { WebAppInput } from "@/components/Input";
import { WebAppModal } from "@/components/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { fieldError } from "@/pages/pricing/fieldError";
import { loginSchema, type LoginValues } from "@/schemas/account";
import type { ApiError } from "@/api/types/response";

const highlights = [
  { icon: Megaphone, title: "Campaigns & audiences", text: "Monitor delivery, pricing and the audience marketplace." },
  { icon: Wallet, title: "Wallets & finance", text: "Track funding, charges, referrals and reports." },
  { icon: ShieldCheck, title: "Compliance & support", text: "Review flags, answer tickets and keep an audit trail." },
];

const BrandMark = ({ logo, name, light = false }: { logo: string; name: string; light?: boolean }) => (
  <div className="flex items-center gap-3">
    <span
      className={
        light
          ? "flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 p-1.5"
          : "flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar p-1.5"
      }
    >
      <img src={logo || "/global-pride-logo.png"} alt="" className="h-full w-full rounded object-contain" />
    </span>
    <span>
      <span className={light ? "block font-semibold text-white" : "block font-semibold text-gray-900"}>{name}</span>
      <span className={light ? "block text-xs text-white/70" : "block text-xs text-gray-500"}>Admin Console</span>
    </span>
  </div>
);

/** Left-hand brand panel, shown on large screens. */
const BrandPanel = ({ logo, name }: { logo: string; name: string }) => (
  <aside className="relative hidden overflow-hidden bg-sidebar p-10 text-white lg:flex lg:w-[44%] lg:flex-col xl:p-14">
    {/* Decorative shapes */}
    <span aria-hidden="true" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/40 blur-2xl" />
    <span aria-hidden="true" className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5" />
    <span aria-hidden="true" className="absolute right-12 bottom-40 h-24 w-24 rounded-2xl border border-white/10" />

    <div className="relative">
      <BrandMark logo={logo} name={name} light />
    </div>

    <div className="relative mt-auto max-w-md">
      <h2 className="text-3xl leading-tight font-bold xl:text-4xl">Everything you need to run {name}, in one console.</h2>
      <p className="mt-3 text-sm text-white/75">
        Manage users, campaigns, payments and platform content from a single, secure workspace.
      </p>

      <ul className="mt-8 space-y-4">
        {highlights.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-sm text-white/70">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>

    <p className="relative mt-12 text-xs text-white/50">
      © {new Date().getFullYear()} {name}. All rights reserved.
    </p>
  </aside>
);

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const login = useAuth((state) => state.login);
  const { platformName, logo, supportEmail } = useSettings((state) => state.general);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Back to the page that sent the user here (RequireAuth passes it), else the dashboard.
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/dashboard";

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (values: LoginValues) => {
    clearErrors("root");
    try {
      const result = await authService.login(values);
      login(result);
      navigate(from, { replace: true });
    } catch (error) {
      setError("root", {
        message: (error as ApiError).message || "We couldn't sign you in. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <BrandPanel logo={logo} name={platformName} />

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <BrandMark logo={logo} name={platformName} />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to the {platformName} Admin Console to continue.</p>

          {errors.root?.message && (
            <div role="alert" className="mt-6 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.root.message}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <WebAppInput
              id="loginEmail"
              type="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={fieldError(errors.email?.message)}
              {...register("email")}
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="loginPassword" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <WebAppInput
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  className="pr-11"
                  error={fieldError(errors.password?.message)}
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute top-0 right-1.5 flex h-11 w-9 items-center justify-center rounded-md text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <WebAppButton
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              loadingText="Signing in…"
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In
            </WebAppButton>
          </form>

          <p className="mt-8 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-gray-400" />
            For authorized administrators only. Sign-in activity is monitored for security.
          </p>
        </div>
      </main>

      <WebAppModal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Forgot your password?">
        <p className="text-sm text-gray-600">
          Administrator accounts are managed by your platform administrator. Ask them to reset your password
          {supportEmail ? (
            <>
              , or email{" "}
              <a href={`mailto:${supportEmail}`} className="font-medium text-primary hover:underline">
                {supportEmail}
              </a>
            </>
          ) : null}
          .
        </p>
        <div className="mt-5 flex justify-end">
          <WebAppButton variant="outline" onClick={() => setForgotOpen(false)}>
            Got it
          </WebAppButton>
        </div>
      </WebAppModal>
    </div>
  );
};
