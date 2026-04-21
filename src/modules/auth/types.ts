export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  profileType: "SALES" | "NON_SALES";
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResendOtpInput {
  email: string;
}

export interface RegisterResponse {
  message: string;
}

export interface AccessTokenResponse {
  accessToken: string;
}
