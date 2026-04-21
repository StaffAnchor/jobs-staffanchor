import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\d+$/, "Phone must contain only digits")
    .min(8, "Phone must be at least 8 digits")
    .max(10, "Phone must be at most 10 digits"),
  profileType: z.enum(["SALES", "NON_SALES"]),
  password: z.string().min(8).max(100),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ResendOtpFormValues = z.infer<typeof resendOtpSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
