import { Poppins } from "next/font/google";

// Headline face shared by the Edge and Resume Writing pages (matches staffanchor.com). Called once, here.
export const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
