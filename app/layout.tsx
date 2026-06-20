import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: t("appName"),
    description: t("tagline"),
    metadataBase: new URL("https://myeongdong-street-food.vercel.app"),
    openGraph: {
      title: t("appName"),
      description: t("tagline"),
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ee2a5a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
