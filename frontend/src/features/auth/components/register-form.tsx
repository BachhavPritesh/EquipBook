"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-provider";
import { getApiErrorMessage } from "@/lib/api-client";
import { getPortalPath } from "@/lib/auth";
import {
  registerSchema,
  type RegisterFormSchema,
} from "../utils/register-schema";

export function RegisterForm() {
  const router = useRouter();
  const { user, status, register: registerAccount } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student",
      department: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(getPortalPath(user.role));
    }
  }, [status, user, router]);

  const onSubmit = async (values: RegisterFormSchema) => {
    setFormError(null);

    try {
      await registerAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        department: values.department.trim() || undefined,
        phone: values.phone.trim() || undefined,
      });
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Unable to create your account."),
      );
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <BrandMark href="/login" className="mb-8" />

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
          Join EquipBook
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use your university details to request and manage shared equipment.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            label="Full name"
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your full name"
                className="pl-9"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </div>
          </FormField>

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

          <Controller
            control={control}
            name="role"
            render={({ field, fieldState }) => (
              <FormField
                label="Role"
                htmlFor="role"
                required
                error={fieldState.error?.message}
              >
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="role"
                    aria-invalid={Boolean(fieldState.error)}
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Department"
              htmlFor="department"
              error={errors.department?.message}
              hint="Optional"
            >
              <Input
                id="department"
                autoComplete="organization"
                placeholder="e.g. Computer Science"
                aria-invalid={Boolean(errors.department)}
                {...register("department")}
              />
            </FormField>

            <FormField
              label="Phone number"
              htmlFor="phone"
              error={errors.phone?.message}
              hint="Optional"
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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

            <FormField
              label="Confirm password"
              htmlFor="confirm-password"
              required
              error={errors.confirmPassword?.message}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="pl-9 pr-10"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register("confirmPassword")}
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
          </div>

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
            {isSubmitting ? "Creating account..." : "Create account"}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
