import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Link from 'next/link';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#030014',
  initialScale: 1,
  width: 'device-width',
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Cyber Pidgeon | Real-Time Chat for Students",
  description: "A lightning-fast, secure messaging platform. Connect, collaborate, and communicate in real-time.",
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
        <Link href="/" className="fixed top-4 right-4 z-50 flex items-center gap-2 opacity-80 mix-blend-screen hover:opacity-100 transition-opacity cursor-pointer">
          <img src="/logo.png" alt="Cyber Pidgeon" className="w-8 h-8 object-contain" />
          <span className="text-pure-white font-bold text-sm tracking-widest uppercase hidden md:block text-shadow-neon">Cyber Pidgeon</span>
        </Link>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
