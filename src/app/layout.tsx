import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cyber Pidgeon | Real-Time Chat for Students",
  description: "A lightning-fast, secure messaging platform built for students. Connect, collaborate, and communicate in real-time.",
  keywords: ["chat", "messaging", "students", "real-time", "collaboration"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-deep-space text-slate-gray`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
