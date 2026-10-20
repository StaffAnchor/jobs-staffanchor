import { poppins } from "@/components/edge/fonts";

export default function EdgeLayout({ children }: { children: React.ReactNode }) {
  return <div className={poppins.variable}>{children}</div>;
}
