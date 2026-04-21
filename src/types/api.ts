export interface ApiErrorIssues {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}

export interface ApiErrorResponse {
  message: string;
  issues?: ApiErrorIssues;
}

export interface AuthTokenPayload {
  sub: string;
  role: "CANDIDATE" | "ADMIN";
  profileType: "SALES" | "NON_SALES";
  iat: number;
  exp: number;
}
