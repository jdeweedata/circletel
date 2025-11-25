import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ProductSection } from './components/ProductSection';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';
import { Filter, SlidersHorizontal, RefreshCw, Plus, Download, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Product } from './types';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter logic
  const filteredGroups = useMemo(() => {
    // 1. Filter products first
    const filteredProducts = MOCK_PRODUCTS.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'All Categories' || 
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // 2. Group by category
    const groups: Record<string, Product[]> = {};
    
    // Initialize groups based on categories or dynamic findings
    CATEGORIES.forEach(cat => {
        if(cat !== 'All Categories') groups[cat] = [];
    });

    filteredProducts.forEach(p => {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
    });

    return groups;
  }, [searchQuery, selectedCategory]);


  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-600">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Header />

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
          
          {/* Page Title & Main Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product Catalogue</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your Circle Tel product offerings</p>
            </div>
            
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    <RefreshCw size={14} />
                    <span>Refresh</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 shadow-sm shadow-orange-200 transition-all transform active:scale-95">
                    <Plus size={16} />
                    <span>Add Product</span>
                </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <StatsBar />
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-8 sticky top-16 z-10">
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Name, SKU, category, or description..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                    <select 
                        className="form-select block w-40 pl-3 pr-8 py-2 text-base border-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg bg-slate-50 cursor-pointer hover:bg-white transition-colors"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                        ))}
                    </select>

                     <select className="form-select block w-32 pl-3 pr-8 py-2 text-base border-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg bg-slate-50 text-slate-500 cursor-pointer hover:bg-white">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                    
                     <select className="form-select block w-36 pl-3 pr-8 py-2 text-base border-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg bg-slate-50 text-slate-500 cursor-pointer hover:bg-white">
                        <option>Device Type</option>
                        <option>Fibre</option>
                        <option>LTE</option>
                        <option>5G</option>
                    </select>

                    <div className="h-8 w-px bg-slate-200 mx-1"></div>

                    <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all flex items-center gap-2">
                        <SlidersHorizontal size={16} />
                        <span className="hidden xl:inline text-xs font-medium">More Filters</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <button className="flex items-center gap-1 hover:text-slate-600">
                        <SlidersHorizontal size={12} />
                        Presets
                    </button>
                     <div className="h-3 w-px bg-slate-200 mx-1"></div>
                     <span className="cursor-pointer hover:text-slate-600">Sort by <span className="font-medium text-slate-600">Default</span></span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded shadow-sm transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button 
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded shadow-sm transition-all ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={14} />
                        </button>
                    </div>
                     <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        <Download size={12} />
                        Export CSV (94)
                    </button>
                </div>
            </div>
          </div>

          {/* Product Grid Content */}
          <div className="space-y-6">
            {Object.entries(filteredGroups).map(([category, products]) => (
                 (products as Product[]).length > 0 && (
                    <ProductSection 
                        key={category} 
                        category={category} 
                        products={products as Product[]} 
                        viewMode={viewMode}
                    />
                 )
            ))}
            
            {/* Empty State */}
            {Object.values(filteredGroups).flat().length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Filter size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">No products found</h3>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search query.</p>
                     <button className="mt-4 text-primary-600 text-sm font-medium hover:underline" onClick={() => {setSearchQuery(''); setSelectedCategory('All Categories')}}>
                        Clear all filters
                    </button>
                </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}