"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Info,
  ListTree,
  Menu,
  X,
} from "lucide-react";
import type { LegalBlock, LegalPageData, LegalSectionData, LegalSlug } from "./legal-content";
import { legalNav } from "./legal-content";

type LegalLayoutProps = {
  page: LegalPageData;
  children?: React.ReactNode;
};

type TableOfContentsProps = {
  sections: LegalSectionData[];
  activeId: string;
  onNavigate?: () => void;
};

type LegalSidebarProps = {
  activeSlug: LegalSlug;
  onNavigate?: () => void;
};

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-72px" },
  transition: { duration: 0.34, ease: "easeOut" as const },
};

function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-18% 0px -64% 0px",
        threshold: [0.05, 0.2, 0.45],
      },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

export function LegalBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,92,252,0.18)] bg-[rgba(124,92,252,0.055)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#b7a5ff]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#7c5cfc]" />
      {children}
    </span>
  );
}

export function LegalDivider() {
  return <div aria-hidden="true" className="my-12 h-px w-full bg-[rgba(255,255,255,0.06)]" />;
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[70ch] text-[15.5px] leading-[1.85] text-[#a1a1ac]">{children}</p>;
}

export function LegalCard({
  title,
  children,
  items,
}: {
  title: string;
  children: React.ReactNode;
  items?: string[];
}) {
  return (
    <div className="rounded-[12px] border border-[rgba(255,255,255,0.075)] bg-[#0b0b0f] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
      <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#f4f4f7]">{title}</h3>
      <div className="mt-3 text-[14px] leading-7 text-[#9898a4]">{children}</div>
      {items && items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-[14px] leading-6 text-[#9898a4]">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#23d18b]" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function LegalNotice({
  tone,
  title,
  children,
}: {
  tone: "info" | "warning" | "success";
  title: string;
  children: React.ReactNode;
}) {
  const toneClass = {
    info: {
      icon: Info,
      border: "border-[rgba(124,92,252,0.18)]",
      bg: "bg-[rgba(124,92,252,0.055)]",
      text: "text-[#b18cff]",
    },
    warning: {
      icon: AlertTriangle,
      border: "border-[rgba(245,158,11,0.18)]",
      bg: "bg-[rgba(245,158,11,0.055)]",
      text: "text-[#fbbf24]",
    },
    success: {
      icon: CheckCircle2,
      border: "border-[rgba(35,209,139,0.18)]",
      bg: "bg-[rgba(35,209,139,0.055)]",
      text: "text-[#23d18b]",
    },
  }[tone];
  const Icon = toneClass.icon;

  return (
    <aside className={`rounded-[12px] border ${toneClass.border} ${toneClass.bg} p-5`} role="note">
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${toneClass.text}`} aria-hidden="true" />
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#f4f4f7]">{title}</h3>
          <p className="mt-2 text-[14px] leading-7 text-[#a1a1ac]">{children}</p>
        </div>
      </div>
    </aside>
  );
}

export function LegalSection({ section, index }: { section: LegalSectionData; index: number }) {
  return (
    <motion.section {...reveal} id={section.id} className="scroll-mt-28" aria-labelledby={`${section.id}-heading`}>
      <div className="grid gap-5 md:grid-cols-[48px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] font-mono text-[12px] text-[#777784]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div>
          <h2 id={`${section.id}-heading`} className="text-[clamp(1.45rem,2.4vw,2rem)] font-semibold tracking-[-0.025em] text-[#f2f2f5]">
            {section.title}
          </h2>
          <div className="mt-5 space-y-5">
            {section.blocks.map((block, blockIndex) => (
              <LegalBlockRenderer key={`${section.id}-${blockIndex}`} block={block} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function LegalBlockRenderer({ block }: { block: LegalBlock }) {
  if (block.type === "paragraph") return <LegalParagraph>{block.text}</LegalParagraph>;

  if (block.type === "notice") {
    return (
      <LegalNotice tone={block.tone} title={block.title}>
        {block.text}
      </LegalNotice>
    );
  }

  if (block.type === "card") {
    return (
      <LegalCard title={block.title} items={block.items}>
        {block.text}
      </LegalCard>
    );
  }

  return (
    <ul className="max-w-[70ch] space-y-3">
      {block.items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-7 text-[#a1a1ac]">
          <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-[#7c5cfc]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalSidebar({ activeSlug, onNavigate }: LegalSidebarProps) {
  return (
    <nav aria-label="Legal pages" className="space-y-1">
      <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#63636f]">Legal pages</p>
      {legalNav.map((item) => {
        const Icon = item.icon;
        const isActive = activeSlug === item.slug;

        return (
          <Link
            key={item.slug}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-[14px] font-medium transition-colors ${
              isActive
                ? "border-[rgba(124,92,252,0.22)] bg-[rgba(124,92,252,0.085)] text-[#f4f4f7]"
                : "border-transparent text-[#858590] hover:border-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#f4f4f7]"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-[#b18cff]" : "text-[#63636f] group-hover:text-[#a1a1ac]"}`} aria-hidden="true" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function TableOfContents({ sections, activeId, onNavigate }: TableOfContentsProps) {
  return (
    <nav aria-label="Table of contents" className="space-y-2">
      <div className="flex items-center gap-2 px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#63636f]">
        <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
        On this page
      </div>
      <div className="space-y-1">
        {sections.map((section) => {
          const isActive = activeId === section.id;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={onNavigate}
              aria-current={isActive ? "location" : undefined}
              className={`block rounded-[8px] border-l px-3 py-2 text-[13px] leading-5 transition-colors ${
                isActive
                  ? "border-l-[#7c5cfc] bg-[rgba(124,92,252,0.075)] text-[#d8ccff]"
                  : "border-l-transparent text-[#777784] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#f4f4f7]"
              }`}
            >
              {section.title}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function LegalTopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,7,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Back to Aura Proxy home">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[rgba(124,92,252,0.18)] bg-[rgba(124,92,252,0.08)] text-[13px] font-bold tracking-[-0.03em] text-[#f4f4f7]">
            A
          </span>
          <span className="leading-none">
            <span className="block text-[14px] font-semibold tracking-[-0.02em] text-[#f4f4f7]">Aura Proxy</span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#7c5cfc]">Legal</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-3 py-2 text-[13px] font-medium text-[#a1a1ac] transition-colors hover:border-[rgba(255,255,255,0.14)] hover:text-[#f4f4f7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back home
        </Link>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#050507]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-8 text-[13px] text-[#6f6f7a] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <p>© 2026 Aura Proxy, Inc. Legal documents for the Aura AI gateway.</p>
        <div className="flex flex-wrap gap-4">
          {legalNav.map((item) => (
            <Link key={item.slug} href={item.href} className="transition-colors hover:text-[#f4f4f7]">
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] px-3 py-1.5 text-[12px] text-[#858590]">
      <CheckCircle2 className="h-3.5 w-3.5 text-[#23d18b]" aria-hidden="true" />
      {children}
    </span>
  );
}

function SidePanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-[rgba(255,255,255,0.065)] bg-[rgba(255,255,255,0.018)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] ${className}`}>
      {children}
    </div>
  );
}

function LegalHero({ page }: { page: LegalPageData }) {
  const Icon = legalNav.find((item) => item.slug === page.slug)?.icon ?? Info;

  return (
    <motion.header {...reveal} className="mx-auto max-w-[900px] py-14 text-center sm:py-20">
      <div className="flex justify-center">
        <LegalBadge>{page.badge}</LegalBadge>
      </div>
      <div className="mt-8 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[rgba(124,92,252,0.18)] bg-[rgba(124,92,252,0.075)] text-[#b18cff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <h1 className="mx-auto mt-6 max-w-[11ch] text-[clamp(3rem,7vw,5.75rem)] font-bold leading-[0.95] tracking-[-0.055em] text-[#f4f4f7]">
        {page.title}
      </h1>
      <p className="mx-auto mt-6 max-w-[720px] text-[16px] leading-8 text-[#92929d] sm:text-[17px]">
        {page.description}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] px-3 py-1.5 text-[12px] text-[#858590]">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Last updated {page.lastUpdated}
        </span>
        <TrustPill>Customer-owned prompts</TrustPill>
        <TrustPill>Configurable logging</TrustPill>
      </div>
    </motion.header>
  );
}

function MobileLegalControls({
  onOpenPages,
  onOpenToc,
}: {
  onOpenPages: () => void;
  onOpenToc: () => void;
}) {
  return (
    <div className="sticky top-16 z-30 -mx-5 flex gap-2 border-y border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,7,0.88)] px-5 py-3 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={onOpenPages}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[13px] font-medium text-[#f4f4f7]"
        aria-label="Open legal navigation"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        Pages
      </button>
      <button
        type="button"
        onClick={onOpenToc}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[13px] font-medium text-[#f4f4f7]"
        aria-label="Open table of contents"
      >
        <ListTree className="h-4 w-4" aria-hidden="true" />
        Contents
      </button>
    </div>
  );
}

export function LegalLayout({ page, children }: LegalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const sectionIds = useMemo(() => page.sections.map((section) => section.id), [page.sections]);
  const activeId = useActiveSection(sectionIds);

  return (
    <>
      <LegalTopBar />
      <main className="relative min-h-screen overflow-hidden bg-[#050507] pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_52%_at_50%_0%,rgba(124,92,252,0.14),transparent_68%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 pb-24 sm:px-8 lg:px-10">
          <LegalHero page={page} />
          <MobileLegalControls onOpenPages={() => setSidebarOpen(true)} onOpenToc={() => setTocOpen(true)} />

          <div className="grid gap-8 border-t border-[rgba(255,255,255,0.06)] pt-8 lg:grid-cols-[230px_minmax(0,780px)] xl:grid-cols-[230px_minmax(0,800px)_250px]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <SidePanel>
                  <LegalSidebar activeSlug={page.slug} />
                </SidePanel>
              </div>
            </aside>

            <article className="min-w-0">
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.018)] px-5 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-8 sm:py-10 lg:px-10">
                <div className="space-y-14">
                  {page.sections.map((section, index) => (
                    <div key={section.id}>
                      <LegalSection section={section} index={index} />
                      {index < page.sections.length - 1 ? <LegalDivider /> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)] p-5">
                <p className="text-[13px] leading-6 text-[#777784]">
                  Questions about this document? Contact{" "}
                  <a className="text-[#b18cff] hover:text-[#d8ccff]" href="mailto:legal@auraproxy.dev">
                    legal@auraproxy.dev
                  </a>
                  .
                </p>
              </div>

              {children}
            </article>

            <aside className="hidden xl:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto pr-1">
                <SidePanel>
                  <TableOfContents sections={page.sections} activeId={activeId} />
                </SidePanel>
                <Link
                  href="/"
                  className="mt-4 flex items-center justify-between rounded-[14px] border border-[rgba(255,255,255,0.065)] bg-[rgba(255,255,255,0.018)] p-4 text-[13px] font-medium text-[#858590] transition-colors hover:border-[rgba(124,92,252,0.18)] hover:text-[#f4f4f7]"
                >
                  Product overview
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <LegalFooter />

      <MobilePanel title="Legal pages" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <LegalSidebar activeSlug={page.slug} onNavigate={() => setSidebarOpen(false)} />
      </MobilePanel>
      <MobilePanel title="On this page" open={tocOpen} onClose={() => setTocOpen(false)}>
        <TableOfContents sections={page.sections} activeId={activeId} onNavigate={() => setTocOpen(false)} />
      </MobilePanel>
    </>
  );
}

function MobilePanel({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close panel" />
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative h-full w-[min(86vw,360px)] border-r border-[rgba(255,255,255,0.08)] bg-[#08080b] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#f4f4f7]">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] text-[#a1a1ac]"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
