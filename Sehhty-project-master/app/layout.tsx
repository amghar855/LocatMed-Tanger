import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/components/locatomed/i18n-provider";
import { Toaster } from "@/components/ui/sonner";
import { localeToDir } from "@/lib/i18n/config";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LOCATOMED — Santé numérique au Maroc",
  description:
    "Trouvez vos médicaments, prenez rendez-vous, consultez votre dossier médical.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LOCATOMED",
  },
  icons: {
    apple: [
      {
        url: "/logo.PNG",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/logo.PNG",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#007BFF",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const dir = localeToDir(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider initialLocale={locale}>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </body>
    </html>
  );
}
