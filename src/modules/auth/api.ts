import { axiosClient } from "@/lib/axios";
import type {
  AccessTokenResponse,
  ForgotPasswordInput,
  LoginInput,
  MessageResponse,
  RegisterInput,
  RegisterResponse,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./types";

export const authApi = {
  async register(payload: RegisterInput) {
    const { data } = await axiosClient.post<RegisterResponse>("/auth/register", payload);
    return data;
  },

  async verifyEmail(payload: VerifyEmailInput) {
    const { data } = await axiosClient.post<AccessTokenResponse>("/auth/verify-email", payload);
    return data;
  },

  async resendVerificationOtp(payload: ResendOtpInput) {
    const { data } = await axiosClient.post<{ message: string }>("/auth/resend-verification-otp", payload);
    return data;
  },

  async login(payload: LoginInput) {
    const { data } = await axiosClient.post<AccessTokenResponse>("/auth/login", payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordInput) {
    const { data } = await axiosClient.post<MessageResponse>("/auth/forgot-password", payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordInput) {
    const { data } = await axiosClient.post<MessageResponse>("/auth/reset-password", payload);
    return data;
  },
};
