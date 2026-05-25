import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pollstar | Premium Real-Time Voting Platform",
  description: "A secure, beautiful, real-time voting platform supporting Borda count ranked choices, closed voter verification, map analytics, and anti-fraud protections.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <body className="font-sans antialiased text-gray-100 min-h-screen flex flex-col bg-[#030712]">
        {children}
      </body>
    </html>
  );
}
