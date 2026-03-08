'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PiMagnifyingGlass, PiX, PiArrowRight } from 'react-icons/pi';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SearchResult {
  title: string;
  description: string;
  href: string;
  category: string;
}

// Static search index - pages and common search terms
const SEARCH_INDEX: SearchResult[] = [
  // Products
  { title: 'SkyFibre SMB', description: 'Fixed Wireless Broadband for SMEs', href: '/products/skyfibre-smb', category: 'Products' },
  { title: 'WorkConnect SOHO', description: 'Internet for home workers and freelancers', href: '/products/workconnect-soho', category: 'Products' },
  { title: 'CloudWiFi', description: 'Managed WiFi as a Service', href: '/products/cloudwifi', category: 'Products' },
  { title: 'BizFibreConnect', description: 'Enterprise fibre solutions', href: '/products/bizfibreconnect', category: 'Products' },

  // Actions
  { title: 'Check Coverage', description: 'See if we cover your area', href: '/coverage', category: 'Actions' },
  { title: 'Request a Quote', description: 'Get a custom quote for your business', href: '/quotes/request', category: 'Actions' },
  { title: 'Customer Login', description: 'Access your dashboard', href: '/auth/login', category: 'Actions' },
  { title: 'Partner Portal', description: 'Login for CircleTel partners', href: '/partners', category: 'Actions' },

  // Support
  { title: 'FAQ', description: 'Frequently asked questions', href: '/faq', category: 'Support' },
  { title: 'Contact Us', description: 'Get in touch with our team', href: '/contact', category: 'Support' },
  { title: 'Terms of Service', description: 'Our service terms and conditions', href: '/terms-of-service', category: 'Legal' },
  { title: 'Privacy Policy', description: 'How we handle your data', href: '/privacy-policy', category: 'Legal' },

  // Resources
  { title: 'About CircleTel', description: 'Learn about our company', href: '/about', category: 'Company' },
  { title: 'Become a Partner', description: 'Join our partner program', href: '/partners/register', category: 'Company' },
];

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults(SEARCH_INDEX.slice(0, 6)); // Show top 6 by default
      return;
    }

    const filtered = SEARCH_INDEX.filter((item) => {
      const searchText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      return query.toLowerCase().split(' ').every((word) => searchText.includes(word));
    });

    setResults(filtered.slice(0, 8));
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href);
            onOpenChange(false);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    },
    [results, selectedIndex, router, onOpenChange]
  );

  // Navigate to result
  const handleResultClick = (result: SearchResult) => {
    router.push(result.href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <PiMagnifyingGlass className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, products, help..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-4 text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-muted rounded"
            >
              <PiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={result.href}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-circleTel-orange/10 text-circleTel-orange'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-muted-foreground">{result.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {result.category}
                    </span>
                    {index === selectedIndex && <PiArrowRight className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between bg-muted/50">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↓</kbd></span>
          <span>Select with <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">Enter</kbd></span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keyboard shortcut hook
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
