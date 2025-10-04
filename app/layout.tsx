import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import Footer from "@/components/footer";
import { AccountMenu } from "./users/AccountMenu";
import { cookies } from "next/headers"


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
  title: "CarePair - Automotive Service Management Dashboard",
  description:
    "Professional automotive service management system for tracking vehicle repairs, customer information, service appointments, and before/after documentation. Streamline your auto repair business with CarePair.",
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
  authors: [{ name: "CarePair Team" }],
  creator: "CarePair",
  publisher: "CarePair",
  robots: "index, follow",
  openGraph: {
    title: "CarePair - Automotive Service Management Dashboard",
    description:
      "Professional automotive service management system for streamlining vehicle repairs and customer service.",
    type: "website",
    locale: "en_US",
    siteName: "CarePair",
  },
  twitter: {
    card: "summary_large_image",
    title: "CarePair - Automotive Service Management",
    description:
      "Professional automotive service management system for vehicle repairs and customer service.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

   const cookieStore = cookies()
    const session = cookieStore.get("session")?.value
    let currentUser = ""
    if (session) {
      try {
        const parsed = JSON.parse(session)
        currentUser = parsed.email
      } catch {}
    }
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-border bg-card">
          <div className=" mx-auto py-3 px-2">
            <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
              <Link
                href="/"
                className="flex flex-row items-center text-base font-semibold text-foreground sm:text-lg"
              >
                <img
                  src="/logo.jpg"
                  alt="Carepair Logo"
                  className="h-12 w-auto"
                />
                Car Service Dashboard
              </Link>
              <nav className="flex w-full flex-wrap items-center sm:w-auto justify-end">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 justify-start sm:justify-center"
                >
                  <Link href="/analytics" prefetch={false}>Analytics</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 justify-start sm:justify-center"
                >
                  <Link href="/" prefetch={false}>Tickets</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 justify-start sm:justify-center"
                >
                  <Link href="/customers" prefetch={false}>Customers</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 justify-start sm:justify-center"
                >
                  <Link href="/search" prefetch={false}>Search</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 justify-start sm:justify-center"
                >
                  <Link href="/appointments" prefetch={false}>Appointments</Link>
                </Button>
                        {currentUser && <AccountMenu email={currentUser} />}
                
              </nav>
            </div>
          </div>
        </header>
        <main className="w-full pb-12">{children}</main>
        <Footer />

        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
