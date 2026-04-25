"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/modules/auth/api";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/modules/auth/schema";
import { getApiErrorMessage } from "@/modules/shared/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to send reset link")),
  });

  return (
    <main className="mx-auto flex w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <FormField label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </FormField>
            <Button className="w-full" disabled={!form.formState.isValid || mutation.isPending} type="submit">
              Send Reset Link
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Remembered your password? <Link href="/login" className="font-medium text-slate-900">Back to Login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
