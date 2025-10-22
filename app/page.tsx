import { Navbar } from "@/components/layout/Navbar";
import { HeroWithTabs } from "@/components/home/HeroWithTabs";
import { ValueProposition } from "@/components/home/ValueProposition";
import { ServicesSnapshot } from "@/components/home/ServicesSnapshot";
import { SuccessStories } from "@/components/home/SuccessStories";
import { LeadMagnet } from "@/components/home/LeadMagnet";
import { BlogPreview } from "@/components/home/BlogPreview";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroWithTabs />
        <ValueProposition />
        <ServicesSnapshot />
        <SuccessStories />
        <LeadMagnet />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  );
}