import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import Footer from "@/components/footer";
import { AccountMenu } from "./users/AccountMenu";
import { cookies } from "next/headers";
import { MainNav } from "@/components/main-nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NintyNine - Automotive Service Management Dashboard",
  description:
    "Professional automotive service management system for tracking vehicle repairs, customer information, service appointments, and before/after documentation. Streamline your auto repair business with NintyNine.",
  keywords: [
    "automotive service",
    "car repair management",
    "vehicle service dashboard",
    "auto repair software",
    "service ticket management",
    "automotive CRM",
    "repair shop management",
    "vehicle maintenance tracking",
  ],
  authors: [{ name: "NintyNine Team" }],
  creator: "NintyNine",
  publisher: "NintyNine",
  robots: "index, follow",
  openGraph: {
    title: "NintyNine - Automotive Service Management Dashboard",
    description:
      "Professional automotive service management system for streamlining vehicle repairs and customer service.",
    type: "website",
    locale: "en_US",
    siteName: "NintyNine",
  },
  twitter: {
    card: "summary_large_image",
    title: "NintyNine - Automotive Service Management",
    description:
      "Professional automotive service management system for vehicle repairs and customer service.",
  },
};
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const session = cookieStore.get("session")?.value;
  let currentUser = "";
  let isAdmin = false;
  if (session) {
    try {
      const parsed = JSON.parse(session);
      currentUser = parsed.email;
      isAdmin = currentUser === ADMIN_EMAIL;
    } catch {}
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-100`}
      >
        <header className="border-b border-border bg-[#002540]">
          <div className="mx-auto py-3 px-2">
            {/* Logo and account menu */}
            <div className="flex flex-row items-center justify-between mb-2">
              <Link
                href="/"
                className="flex flex-row items-center text-base font-semibold text-foreground sm:text-lg"
              >
                <img
                  src="/logo.jpg"
                  alt="NintyNine Logo"
                  className="h-16 w-auto rounded-full"
                />
              </Link>
              <div className="flex justify-end">
                {currentUser && <AccountMenu email={currentUser} />}
              </div>
            </div>

            {/* Navigation */}
            <MainNav isAdmin={isAdmin} />
          </div>
        </header>
        <main className="w-full pb-12">{children}</main>
        <Footer />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
