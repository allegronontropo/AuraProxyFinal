import LegalClient from "@/components/legal/LegalClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ slug: "privacy" }, { slug: "terms" }, { slug: "cookies" }];
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!["privacy", "terms", "cookies"].includes(slug)) {
    notFound();
  }
  return <LegalClient initialSlug={slug} />;
}
