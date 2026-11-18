"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-provider";
import { getApiErrorMessage } from "@/lib/api-client";
import { getPortalPath } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS: { label: string; email: string }[] = [
  {
    label: "Student demo",
    email: "aarav.mehta@northbridge.edu",
  },
  {
    label: "Manager demo",
    email: "priya.nair@northbridge.edu",
  },
];

export function LoginForm() {
  const router = useRouter();
  const { user, status, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(getPortalPath(user.role));
    }
  }, [status, user, router]);

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);

    try {
      const signedInUser = await login({
        email: values.email.trim(),
        password: values.password,
      });
      router.replace(getPortalPath(signedInUser.role));
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Unable to sign in. Please try again."),
      );
    }
  };

  const fillDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", "demo1234", { shouldValidate: true });
  };

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-40" />
        <div className="pointer-events-none absolute -right-24 top-20 size-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative">
          <Link href="/login" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-indigo-500 text-white shadow-lg shadow-indigo-900/40">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                aria-hidden="true"
              >
                <path
                  d="M4.5 8.2 12 4l7.5 4.2v7.6L12 20l-7.5-4.2V8.2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="m4.8 8.3 7.2 4 7.2-4M12 12.3V19.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="m8.6 6.1 7.2 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>
              <span className="block text-[15px] font-semibold leading-none tracking-tight">
                EquipBook
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Northbridge University
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300">
            Shared resources, simplified
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight xl:text-[46px]">
            Equipment,
            <br />
            without the guesswork.
          </h1>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            Browse live availability across every department, request what you
            need, and track the full issue-to-return journey in one calm
            workspace.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Live availability before you request",
              "Manager review and approval trail",
              "Issue, return, and condition records",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-[13px] text-slate-300">
                <span className="flex size-5 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
                  <CheckMark />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex flex-wrap gap-6 border-t border-white/10 pt-6">
          <div>
            <p className="text-xl font-semibold tabular">17</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
              resources
            </p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular">5</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
              categories
            </p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular">1</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
              shared desk
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
          >
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-indigo-600 text-white">
              <LockKeyhole className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              EquipBook
            </span>
          </Link>

          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
            Welcome back
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Sign in to your workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with your EquipBook account to browse, book, and manage
            shared equipment.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              label="Email address"
              htmlFor="email"
              required
              error={errors.email?.message}
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@northbridge.edu"
                  className="pl-9"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
              </div>
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pl-9 pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </FormField>

            {formError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-700"
              >
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            New to EquipBook?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Create an account
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Demo accounts
            </p>
            <div className="mt-2 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-slate-700">
                      {account.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                      {account.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-medium text-indigo-600">
                    Use
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] leading-4 text-slate-400">
            Seeded accounts use the password demo1234
          </p>
        </div>
      </section>
    </div>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" aria-hidden="true">
      <path
        d="m2.5 6.2 2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
