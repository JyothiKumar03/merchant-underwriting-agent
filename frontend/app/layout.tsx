import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/providers/query-provider";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GrabCredit × GrabInsurance | Merchant Underwriting",
  description: "AI-powered merchant underwriting for GrabOn — credit & insurance offers",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        figtree.variable,
        geistMono.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
