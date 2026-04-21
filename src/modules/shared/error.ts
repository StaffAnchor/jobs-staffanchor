import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getFieldErrors(error: unknown) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {};
  }
  return error.response?.data?.issues?.fieldErrors ?? {};
}

export function getStatus(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  return error.response?.status ?? null;
}
