import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UDM TalentHub",
  description: "Faculty Hiring & Renewal Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "m-0 min-h-dvh font-sans antialiased text-slate-800 overflow-x-hidden",
          // soft teal gradient (no white anywhere)
          "bg-[#CFE9E6]",
          "bg-[radial-gradient(ellipse_at_top,_#DAF1EF_0%,_#CFE9E6_45%,_#B8DEDA_100%)]",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
