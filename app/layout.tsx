// app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Analyz - Product Analytics Dashboard",
  description: "Track behavior, manage projects, grow smarter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased font-sans`}>
        {/* Wrap everything in SessionProviderWrapper */}
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}