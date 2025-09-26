import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
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
        <Hero />
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