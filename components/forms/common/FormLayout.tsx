import React from 'react';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface FormLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormLayout({ title, subtitle, children, className }: FormLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className={cn("py-8 px-4 md:px-8", className)}>
          <div className="container mx-auto max-w-6xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 text-white p-6 md:p-8 text-center">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
                {subtitle && <p className="text-orange-100 text-sm md:text-base">{subtitle}</p>}
              </div>

              {/* Form Content */}
              <div className="p-6 md:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}