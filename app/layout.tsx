import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";
// import PasswordProtection from './components/PasswordProtection';

export const metadata: Metadata = {
  title: "x402",
  description: "x402 demo - Freepik x Coinbase",
  authors: [{ name: "must_be_ash" }],
  creator: "must_be_ash",
  publisher: "must_be_ash",
  metadataBase: new URL("https://freepik-x402.replit.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "402",
    description: "x402 demo - Freepik x Coinbase",
    url: "https://freepik-x402.replit.app",
    siteName: "402",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "x402 demo - Freepik x Coinbase",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "402 - x402 demo - Freepik x Coinbase",
    description: "x402 demo - Freepik x Coinbase",
    images: ["/og.png"],
    creator: "@must_be_ash",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  keywords: [
    "x402",
    "Freepik",
    "Coinbase",
    "AI",
    "image generation",
    "crypto payments",
    "USDC",
    "blockchain",
    "demo",
  ],
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* <PasswordProtection> */}
          {children}
        {/* </PasswordProtection> */}
        <Analytics />
      </body>
    </html>
  );
}