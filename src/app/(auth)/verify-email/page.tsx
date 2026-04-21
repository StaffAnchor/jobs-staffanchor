"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/modules/auth/api";
import { resendOtpSchema, verifyEmailSchema, type VerifyEmailFormValues } from "@/modules/auth/schema";
import { useAuthStore } from "@/modules/auth/store";
import { getOnboardingPath } from "@/modules/auth/navigation";
import { decodeJwtPayload } from "@/lib/utils";
import type { AuthTokenPayload } from "@/types/api";
import { getApiErrorMessage, getStatus } from "@/modules/shared/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

export default function VerifyEmailPage() {
  const router = useRouter();
  const pendingEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const login = useAuthStore((state) => state.login);

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    mode: "onChange",
    defaultValues: {
      email: pendingEmail ?? "",
      otp: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromQuery = params.get("email") ?? pendingEmail ?? "";
    form.setValue("email", emailFromQuery);
  }, [form, pendingEmail]);

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (data) => {
      login(data.accessToken);
      toast.success("Email verified successfully");
      const payload = decodeJwtPayload<AuthTokenPayload>(data.accessToken);
      router.push(getOnboardingPath(payload?.profileType));
    },
    onError: (error) => {
      const status = getStatus(error);
      if (status === 410) {
        toast.error("OTP expired. Please resend OTP.");
        return;
      }
      if (status === 403) {
        toast.error("Verification required before login.");
        return;
      }
      toast.error(getApiErrorMessage(error, "Verification failed"));
    },
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendVerificationOtp,
    onSuccess: () => toast.success("OTP resent to your email"),
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to resend OTP")),
  });

  return (
    <main className="mx-auto flex w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => verifyMutation.mutate(values))}>
            <FormField label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </FormField>
            <FormField label="OTP" required error={form.formState.errors.otp?.message}>
              <Input maxLength={6} {...form.register("otp")} />
            </FormField>
            <Button className="w-full" disabled={!form.formState.isValid || verifyMutation.isPending} type="submit">
              Verify Email
            </Button>
          </form>
          <Button
            className="w-full"
            variant="outline"
            type="button"
            onClick={() => {
              const parsed = resendOtpSchema.safeParse({ email: form.getValues("email") });
              if (!parsed.success) {
                toast.error("Please provide a valid email");
                return;
              }
              resendMutation.mutate(parsed.data);
            }}
            disabled={resendMutation.isPending}
          >
            Resend OTP
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
