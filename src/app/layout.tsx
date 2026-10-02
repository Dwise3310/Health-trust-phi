import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { LoadingProvider } from "@/components/loading-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { HOSPITAL } from "@/lib/constants";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${HOSPITAL.program} · ${HOSPITAL.name}`,
    template: `%s · ${HOSPITAL.program}`,
  },
  description:
    "Sure Health membership at Eastern Ryse Specialist Hospital. Care Quota cover, a Health wallet, digital cards, and referral cashback. Sponsored by FarmGreat West Africa LLC.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://health-trust-phi.vercel.app",
  ),
  icons: { icon: "/favicon.svg" },
};

const themeBoot = `try{var t=localStorage.getItem('ht-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <LoadingProvider>
              {children}
              <CookieBanner />
            </LoadingProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
