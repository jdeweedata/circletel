
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import ServicesSnapshot from '@/components/home/ServicesSnapshot';
import ValueProposition from '@/components/home/ValueProposition';
import LeadMagnet from '@/components/home/LeadMagnet';
import SuccessStories from '@/components/home/SuccessStories';
import BlogPreview from '@/components/home/BlogPreview';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <ServicesSnapshot />
        <ValueProposition />
        <LeadMagnet />
        <SuccessStories />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
