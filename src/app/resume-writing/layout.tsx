import { poppins } from "@/components/edge/fonts";

export default function ResumeWritingLayout({ children }: { children: React.ReactNode }) {
  return <div className={poppins.variable}>{children}</div>;
}
