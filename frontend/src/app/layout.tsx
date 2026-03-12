import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PageAppear } from "@/components/ui/PageAppear";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AuthHashHandler } from "@/components/auth/AuthHashHandler";
import { Providers } from "@/components/providers";
import { UserProvider } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/server-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StatementFlow – MT940 / CAMT.053 to CSV, XLSX & QBO",
  description:
    "StatementFlow converts MT940 and CAMT.053 bank statements to CSV, XLSX, or QuickBooks (QBO) for accountants, founders, and finance teams.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <div id="root" className="min-h-screen">
          <Providers>
            <AuthHashHandler />
            <UserProvider initialUser={user}>
              <SiteHeader />
              <PageAppear>{children}</PageAppear>
            </UserProvider>
          </Providers>
        </div>
      </body>
    </html>
  );
}


