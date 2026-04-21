import { AuthGuard } from "@/components/common/auth-guard";

export default function GeneralOnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard roles={["CANDIDATE"]}>{children}</AuthGuard>;
}
