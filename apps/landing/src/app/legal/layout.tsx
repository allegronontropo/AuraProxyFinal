import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050507] text-zinc-300 flex flex-col font-sans">
      <NavBar />
      <main className="flex-1 w-full max-w-[800px] mx-auto px-6 pt-32 pb-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
