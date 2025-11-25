import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPages } from '../services/storageService';
import { Page } from '../types';
import { Lock, ArrowLeft } from 'lucide-react';

const PageRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);

  useEffect(() => {
    const pages = getPages();
    const found = pages.find((p) => p.slug === slug);
    if (found) setPage(found);
  }, [slug]);

  // Handle SEO and Open Graph Meta Tags
  useEffect(() => {
    if (!page) return;

    // Security check: Don't set SEO tags for non-published pages to avoid leaking content
    if (page.status !== 'published') {
        document.title = 'Access Denied';
        return;
    }

    // Update Document Title
    document.title = page.content.seo.title;

    // Helper to set or update meta tags
    const setMetaTag = (attr: string, key: string, content: string) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard SEO
    setMetaTag('name', 'description', page.content.seo.description);

    // Open Graph (Facebook, LinkedIn, etc.)
    setMetaTag('property', 'og:title', page.content.seo.title);
    setMetaTag('property', 'og:description', page.content.seo.description);
    setMetaTag('property', 'og:type', 'article');
    setMetaTag('property', 'og:url', window.location.href);
    if (page.featured_image) {
      setMetaTag('property', 'og:image', page.featured_image);
    }

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', page.content.seo.title);
    setMetaTag('name', 'twitter:description', page.content.seo.description);
    setMetaTag('name', 'twitter:url', window.location.href);
    if (page.featured_image) {
      setMetaTag('name', 'twitter:image', page.featured_image);
    }

    // Cleanup: Reset title on unmount
    return () => {
      document.title = 'AI Content Studio';
    };

  }, [page]);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-500">Page not found</p>
        </div>
      </div>
    );
  }

  if (page.status !== 'published') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-8">
            This page is currently <strong>{page.status}</strong> and is not visible to the public.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-black transition-colors w-full"
          >
            <ArrowLeft size={18} />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src={page.featured_image} 
          className="absolute inset-0 w-full h-full object-cover z-0 animate-fade-in"
          alt="Hero background" 
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-lg">{page.content.hero.headline}</h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-gray-100 opacity-90 drop-shadow-md">{page.content.hero.subheadline}</p>
          <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
            {page.content.hero.cta}
          </button>
        </div>
      </section>

      {/* Content Sections */}
      <article className="max-w-4xl mx-auto py-20 px-6">
        {page.content.sections.map((section, i) => (
          <div key={i} className="mb-16 last:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">{section.heading}</h2>
            <div 
              className="prose prose-lg prose-gray max-w-none text-gray-600 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: section.content }} 
            />
          </div>
        ))}
      </article>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-lg">{page.content.seo.title}</span>
            <p className="text-gray-400 text-sm mt-1">{page.content.seo.description}</p>
          </div>
          <div className="text-gray-400 text-sm">
            Powered by AI CMS
          </div>
        </div>
      </footer>
    </main>
  );
};

export default PageRenderer;