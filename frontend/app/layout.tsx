import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/providers/query-provider";
import { Sidebar } from "@/components/sidebar";

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
      className={cn("h-full antialiased", figtree.variable, geistMono.variable)}
    >
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {children}
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
