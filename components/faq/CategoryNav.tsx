'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { faqCategories } from '@/app/faq/faq-data';
import { cn } from '@/lib/utils';

interface CategoryNavProps {
  className?: string;
}

export function CategoryNav({ className }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState<string>(faqCategories[0]?.id || '');

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const offset = 200; // Account for sticky elements

      // Find the category section currently in view
      for (let i = faqCategories.length - 1; i >= 0; i--) {
        const category = faqCategories[i];
        const element = document.getElementById(`faq-${category.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset) {
            setActiveCategory(category.id);
            return;
          }
        }
      }

      // Default to first category if none found
      if (faqCategories.length > 0) {
        setActiveCategory(faqCategories[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to category section
  const scrollToCategory = useCallback((categoryId: string) => {
    const element = document.getElementById(`faq-${categoryId}`);
    if (element) {
      const offset = 160; // Account for sticky header + nav
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <nav
      className={cn(
        'bg-white border-b border-gray-200 sticky top-16 z-40',
        className
      )}
      aria-label="FAQ category navigation"
    >
      <div className="max-w-7xl mx-auto">
        {/* Edge-to-edge scroll container */}
        <div className="flex overflow-x-auto -mx-4 px-4 py-3 gap-2 scrollbar-hide">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-circleTel-orange text-white'
                    : 'text-circleTel-navy hover:bg-gray-100'
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {/* Mobile: first word only */}
                <span className="sm:hidden">{category.title.split(' ')[0]}</span>
                {/* Desktop: full title */}
                <span className="hidden sm:inline">{category.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
