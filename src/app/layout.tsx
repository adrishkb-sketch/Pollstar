import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import RaiseIssueButton from "@/components/RaiseIssueButton";
import SiteWalkthrough from "@/components/SiteWalkthrough";
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
    icon: "/favicon.png?v=5",
    shortcut: "/favicon.png?v=5",
    apple: "/favicon.png?v=5",
  },

};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

const zoomBlockerScript = `
  if (typeof window !== 'undefined') {
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('gesturechange', function (e) { e.preventDefault(); });
    document.addEventListener('gestureend', function (e) { e.preventDefault(); });
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1) { e.preventDefault(); }
    }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) { e.preventDefault(); }
      lastTouchEnd = now;
    }, false);
  }
`;

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: zoomBlockerScript }} />
      </head>
      <body className="font-sans antialiased text-gray-100 min-h-screen flex flex-col bg-[#030712]">
        {children}
        <RaiseIssueButton />
        <SiteWalkthrough />
      </body>
    </html>
  );
}
