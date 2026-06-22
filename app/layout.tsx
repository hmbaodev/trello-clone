import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import SupabaseProvider from "@/lib/supabase/SupabaseProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trello Clone",
  description: "Trello clone by nextjs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <SupabaseProvider>
        <html lang="en" className={`${inter.className} h-full antialiased`}>
          <body className="min-h-full flex flex-col">{children}</body>
        </html>
      </SupabaseProvider>
    </ClerkProvider>
  );
}
