import LegalClient from "@/components/legal/LegalClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ slug: "privacy" }, { slug: "terms" }, { slug: "cookies" }];
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  if (!["privacy", "terms", "cookies"].includes(params.slug)) {
    notFound();
  }
  return <LegalClient initialSlug={params.slug} />;
}
