import type { Metadata } from "next";
import { LegalLayout } from "./LegalComponents";
import { legalPages, siteUrl, type LegalSlug } from "./legal-content";

export function generateLegalMetadata(slug: LegalSlug): Metadata {
  const page = legalPages[slug];
  const url = `${siteUrl}/legal/${slug}`;

  return {
    title: `${page.title} | Aura Proxy`,
    description: page.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${page.title} | Aura Proxy`,
      description: page.description,
      url,
      type: "article",
      siteName: "Aura Proxy",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Aura Proxy`,
      description: page.description,
    },
  };
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const page = legalPages[slug];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${siteUrl}/legal/${slug}`,
    dateModified: page.lastUpdated,
    publisher: {
      "@type": "Organization",
      name: "Aura Proxy",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "Article",
      headline: page.title,
      dateModified: page.lastUpdated,
      articleSection: page.sections.map((section) => section.title),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalLayout page={page} />
    </>
  );
}
