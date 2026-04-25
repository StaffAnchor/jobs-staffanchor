"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/modules/auth/api";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/modules/auth/schema";
import { getApiErrorMessage, getStatus } from "@/modules/shared/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("token") ?? "";
  }, []);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: { token: string; password: string }) => authApi.resetPassword(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/login");
    },
    onError: (error) => {
      const status = getStatus(error);
      if (status === 410) {
        toast.error("Reset link expired. Please request a new one.");
        return;
      }

      toast.error(getApiErrorMessage(error, "Failed to reset password"));
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Invalid reset link. Please request a new password reset email.
            </div>
          ) : null}
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({
                token,
                password: values.password,
              })
            )}
          >
            <FormField label="New Password" required error={form.formState.errors.password?.message}>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} className="pr-10" {...form.register("password")} />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm New Password" required error={form.formState.errors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  className="pr-10"
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <Button className="w-full" disabled={!token || !form.formState.isValid || mutation.isPending} type="submit">
              Reset Password
            </Button>
          </form>
          <p className="text-center text-sm text-slate-600">
            Back to <Link href="/login" className="font-medium text-slate-900">Login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
