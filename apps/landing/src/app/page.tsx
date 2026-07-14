import NavBar from "@/components/NavBar";
import HeroSection from "@/components/sections/HeroSection";
import StatsStrip from "@/components/StatsStrip";
import FeaturesBento from "@/components/sections/FeaturesBento";
import ArchitectureSection from "@/components/ArchitectureSection";
import DeploySection from "@/components/DeploySection";
import ComparisonSection from "@/components/ComparisonSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <StatsStrip />
        <FeaturesBento />
        <ArchitectureSection />
        <DeploySection />
        <ComparisonSection />
      </main>
      <Footer />
    </>
  );
}
