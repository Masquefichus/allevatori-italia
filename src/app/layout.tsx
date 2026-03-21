import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Allevatori di Cani in Italia`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "allevatori cani",
    "allevamento cani Italia",
    "cuccioli",
    "allevatori ENCI",
    "razze cani",
    "allevatori professionali",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = data;
    }
  } catch {
    // Supabase not configured yet - continue without auth
  }

  return (
    <html lang="it">
      <head>
        <WebsiteJsonLd />
        <OrganizationJsonLd />
      </head>
      <body className={`${inter.variable} antialiased font-sans`}>
        <AuthProvider initialProfile={profile}>
          <div className="min-h-screen flex flex-col">
            <Header user={profile} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
