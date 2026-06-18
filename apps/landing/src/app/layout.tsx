import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Proxy — Open-Source AI Gateway",
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
    title: "Aura Proxy — Open-Source AI Gateway",
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
      <body style={{ margin: 0, padding: 0, background: "#030c1b" }}>
        {children}
      </body>
    </html>
  );
}
