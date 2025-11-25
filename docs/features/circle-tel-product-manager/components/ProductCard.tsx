import React from 'react';
import { Product } from '../types';
import { 
  MoreHorizontal, 
  Eye, 
  Edit2, 
  Wifi, 
  Zap, 
  Globe, 
  Radio, 
  Smartphone,
  ArrowDown, 
  ArrowUp,
  Database,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  Copy
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

const getCategoryTheme = (category: string) => {
  switch (category) {
    case 'business_fibre': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Globe };
    case 'business': return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Smartphone };
    case 'lte': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: Zap };
    case '5g': return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: Radio };
    case 'wireless': return { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', icon: Wifi };
    case 'fibre_consumer': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Globe };
    default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: Globe };
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const theme = getCategoryTheme(product.category);
  const Icon = theme.icon;
  const isSyncFailed = product.syncStatus === 'failed';
  const isSynced = product.syncStatus === 'synced';

  // --- LIST VIEW ---
  if (viewMode === 'list') {
    return (
      <div className="group flex items-center bg-white border border-slate-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-md transition-all duration-200 relative overflow-hidden">
        {/* Selection Stripe */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>

        {/* 1. Basic Info */}
        <div className="flex items-center gap-4 flex-[2] pl-3">
             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.bg} ${theme.color}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800 text-sm leading-tight">{product.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1 rounded">{product.sku}</span>
                     {isSyncFailed && <AlertCircle size={10} className="text-red-500" />}
                </div>
            </div>
        </div>

        {/* 2. Stats */}
        <div className="flex-[2] hidden md:flex items-center gap-4 text-xs text-slate-600">
             {product.specs?.download && (
                <div className="flex items-center gap-1.5" title="Download Speed">
                    <div className="p-1 bg-slate-50 rounded text-slate-400"><ArrowDown size={12} /></div>
                    <span className="font-medium">{product.specs.download}</span>
                </div>
            )}
             {product.specs?.dataLimit && (
                <div className="flex items-center gap-1.5" title="Data Cap">
                    <div className="p-1 bg-slate-50 rounded text-slate-400"><Database size={12} /></div>
                    <span className="font-medium">{product.specs.dataLimit}</span>
                </div>
            )}
        </div>

        {/* 3. Price */}
        <div className="flex-1 text-right pr-6">
            <div className="font-bold text-slate-800">{product.currency}{product.price}</div>
            <div className="text-[10px] text-slate-400 uppercase">{product.billingCycle}</div>
        </div>

        {/* 4. Actions */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
             <div className="flex items-center gap-1">
                <label className="relative inline-flex items-center cursor-pointer mr-2" title={product.isHidden ? "Show in Store" : "Hide from Store"}>
                    <input type="checkbox" checked={!product.isHidden} readOnly className="sr-only peer" />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
             </div>
             
             <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                <Edit2 size={14} />
             </button>
             <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                <MoreHorizontal size={14} />
             </button>
        </div>
      </div>
    );
  }

  // --- GRID VIEW ---
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:border-primary-200 transition-all duration-300 flex flex-col group relative overflow-hidden h-full">
      
      {/* Top Stripe */}
      <div className={`h-1 w-full ${product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

      {/* Header */}
      <div className="px-5 pt-4 pb-0 flex justify-between items-start">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${theme.bg} ${theme.color} ${theme.border}`}>
            {product.category.replace('_', ' ')}
        </span>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-white/80 backdrop-blur-sm p-1 rounded-lg">
             <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Clone">
                <Copy size={14} />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Edit">
                <Edit2 size={14} />
            </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-4 mb-4">
             <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm border ${theme.bg} ${theme.color} ${theme.border} group-hover:scale-105 transition-transform duration-300`}>
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                    {product.name}
                </h3>
                <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                    {product.sku}
                </div>
            </div>
        </div>

        {/* Price Tag */}
        <div className="mb-5 flex items-baseline gap-1">
            <span className="text-sm font-medium text-slate-400">{product.currency}</span>
            <span className="text-3xl font-bold text-slate-800 tracking-tight">{product.price}</span>
            <span className="text-xs font-medium text-slate-400">/ {product.billingCycle}</span>
        </div>

        {/* Specs Grid */}
        <div className="mt-auto bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-2 gap-y-2 gap-x-1">
            {product.specs?.download && (
                <div className="flex items-center gap-2">
                    <ArrowDown size={12} className="text-emerald-500" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase leading-none font-semibold">Down</span>
                        <span className="text-xs font-semibold text-slate-700 leading-none mt-0.5">{product.specs.download}</span>
                    </div>
                </div>
            )}
             {product.specs?.upload && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
                    <ArrowUp size={12} className="text-blue-500" />
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase leading-none font-semibold">Up</span>
                        <span className="text-xs font-semibold text-slate-700 leading-none mt-0.5">{product.specs.upload}</span>
                    </div>
                </div>
            )}
            {product.specs?.dataLimit && (
                 <div className="col-span-2 pt-2 mt-1 border-t border-slate-200 flex items-center gap-2">
                    <Database size={12} className="text-orange-500" />
                    <span className="text-xs text-slate-600">
                        Cap: <span className="font-semibold text-slate-800">{product.specs.dataLimit}</span>
                    </span>
                 </div>
            )}
            {product.specs?.type && !product.specs.download && (
                 <div className="col-span-2 flex items-center gap-2">
                    <Icon size={12} className={theme.color} />
                    <span className="text-xs text-slate-600 font-medium">{product.specs.type}</span>
                 </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
         <div className="flex items-center gap-1.5" title={isSynced ? "Synced with Provider" : "Sync Failed"}>
             {isSyncFailed 
                ? <AlertCircle size={14} className="text-red-500" /> 
                : isSynced 
                    ? <CheckCircle2 size={14} className="text-emerald-500" /> 
                    : <XCircle size={14} className="text-slate-300" />
             }
             <span className={`text-[10px] font-medium ${isSyncFailed ? 'text-red-600' : isSynced ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isSyncFailed ? 'Sync Failed' : isSynced ? 'Synced' : 'Draft'}
             </span>
         </div>

         <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400 uppercase">
                {product.isHidden ? 'Hidden' : 'Visible'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={!product.isHidden} readOnly className="sr-only peer" />
                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
         </div>
      </div>
    </div>
  );
};