"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/modules/auth/api";
import { registerSchema, type RegisterFormValues } from "@/modules/auth/schema";
import { useAuthStore } from "@/modules/auth/store";
import { getApiErrorMessage } from "@/modules/shared/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

export default function RegisterPage() {
  const router = useRouter();
  const setPendingVerificationEmail = useAuthStore((state) => state.setPendingVerificationEmail);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      profileType: "SALES",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (_, payload) => {
      setPendingVerificationEmail(payload.email);
      toast.success("Registration successful. OTP sent to your email.");
      router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Registration failed")),
  });

  return (
    <main className="mx-auto flex w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Candidate Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </FormField>
            <FormField label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </FormField>
            <FormField label="Phone" required error={form.formState.errors.phone?.message}>
              <Input inputMode="numeric" maxLength={10} {...form.register("phone")} />
            </FormField>
            <FormField label="Profile Type" required error={form.formState.errors.profileType?.message}>
              <Select {...form.register("profileType")}>
                <option value="SALES">Sales</option>
                <option value="NON_SALES">Non-sales(General)</option>
              </Select>
            </FormField>
            <FormField label="Password" required error={form.formState.errors.password?.message}>
              <Input type="password" {...form.register("password")} />
            </FormField>
            <Button className="w-full" disabled={!form.formState.isValid || mutation.isPending} type="submit">
              Register
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account? <Link href="/login" className="font-medium text-slate-900">Login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
