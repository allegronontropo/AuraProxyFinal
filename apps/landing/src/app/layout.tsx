import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://auraproxy.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aura Proxy - Open-Source AI Gateway",
  description:
    "Self-hosted AI gateway with semantic caching, intelligent routing, and full observability. Stop paying for the same AI request twice.",
  keywords: [
    "AI Gateway",
    "LLM Proxy",
    "Semantic Cache",
    "OpenAI Proxy",
    "Self-hosted AI",
    "Multi-provider routing",
  ],
  openGraph: {
    title: "Aura Proxy - Open-Source AI Gateway",
    description: "Stop paying for the same AI request twice. Semantic cache, smart routing, full observability.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
