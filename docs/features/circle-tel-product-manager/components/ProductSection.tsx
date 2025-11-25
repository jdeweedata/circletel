import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Box } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  category: string;
  products: Product[];
  viewMode: 'grid' | 'list';
}

export const ProductSection: React.FC<ProductSectionProps> = ({ category, products, viewMode }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (products.length === 0) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-3 cursor-pointer group select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        <div className="flex items-center gap-2">
            <Box size={14} className="text-slate-400" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-primary-600 transition-colors">
            {category.replace('_', ' ')}
            </h2>
        </div>
        
        <div className="h-px bg-slate-200 flex-1 ml-4 group-hover:bg-slate-300 transition-colors"></div>
        
        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
            {products.length}
        </span>
      </div>

      {/* Container */}
      {isOpen && (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" 
          : "flex flex-col gap-2"
        }>
          {products.map(product => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};