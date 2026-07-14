export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050507] text-zinc-300 flex flex-col font-sans">
      {children}
    </div>
  );
}
