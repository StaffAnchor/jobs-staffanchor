"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/modules/auth/api";
import { getOnboardingPath } from "@/modules/auth/navigation";
import { loginSchema, type LoginFormValues } from "@/modules/auth/schema";
import { useAuthStore } from "@/modules/auth/store";
import { getApiErrorMessage, getStatus } from "@/modules/shared/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { userApi } from "@/modules/user/api";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      form.clearErrors("root");
      login(data.accessToken);
      toast.success("Login successful");

      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next");
      const isOnboardingPath = nextPath?.startsWith("/onboarding") ?? false;

      try {
        const account = await userApi.me();
        const shouldSendToOnboarding =
          account.profileType === "NON_SALES"
            ? !account.generalCandidateProfile
            : account.candidateProfileCompletion === 0;

        if (shouldSendToOnboarding) {
          router.push(getOnboardingPath(account.profileType));
          return;
        }
      } catch {
        // Fall back to the default landing page if the profile lookup fails.
      }

      router.push(nextPath && !isOnboardingPath ? nextPath : "/dashboard");
    },
    onError: (error) => {
      const status = getStatus(error);
      if (status === 403) {
        toast.error("Email not verified. Please verify your email first.");
        router.push(`/verify-email?email=${encodeURIComponent(form.getValues("email"))}`);
        return;
      }
      const message = getApiErrorMessage(error, "Invalid email or password");
      form.setError("root", { type: "server", message });
      toast.error(message);
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              form.clearErrors("root");
              mutation.mutate(values);
            })}
          >
            <FormField label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </FormField>
            <FormField label="Password" required error={form.formState.errors.password?.message}>
              <Input type="password" {...form.register("password")} />
            </FormField>
            {form.formState.errors.root?.message ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <Button className="w-full" disabled={!form.formState.isValid || mutation.isPending} type="submit">
              Login
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            New here? <Link href="/register" className="font-medium text-slate-900">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
