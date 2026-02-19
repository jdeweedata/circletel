'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  List,
  Map,
  Terminal,
  Grid3X3,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Design Components
import { DesignV1Refined } from './components/DesignV1Refined';
import { DesignV2Stepper } from './components/DesignV2Stepper';
import { DesignV3MapView } from './components/DesignV3MapView';
import { DesignV4Dense } from './components/DesignV4Dense';
import { DesignV5Bento } from './components/DesignV5Bento';

const designs = [
  {
    id: 'v1',
    label: '3-Column Refined',
    shortLabel: 'Refined',
    icon: LayoutGrid,
    description: 'Premium polish on the classic layout',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'v2',
    label: 'Stepper Wizard',
    shortLabel: 'Wizard',
    icon: List,
    description: 'Guided step-by-step flow',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'v3',
    label: 'Split Map View',
    shortLabel: 'Map',
    icon: Map,
    description: 'Live map feedback as you type',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'v4',
    label: 'Power User',
    shortLabel: 'Dense',
    icon: Terminal,
    description: 'Terminal-style, maximum efficiency',
    color: 'from-slate-600 to-zinc-800'
  },
  {
    id: 'v5',
    label: 'Bento Grid',
    shortLabel: 'Bento',
    icon: Grid3X3,
    description: 'Expandable tiles, modern feel',
    color: 'from-sky-500 to-indigo-600'
  }
];

export default function FeasibilityDesignsPage() {
  const [activeDesign, setActiveDesign] = useState('v1');

  const currentDesign = designs.find(d => d.id === activeDesign)!;

  return (
    <div className="min-h-screen bg-ui-bg">
      {/* Floating Design Selector */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-1.5 flex items-center gap-1">
          <Link href="/admin/sales/feasibility">
            <Button variant="ghost" size="sm" className="h-10 px-3 text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
          </Link>

          <div className="w-px h-8 bg-gray-200 mx-1" />

          {designs.map((design) => {
            const Icon = design.icon;
            const isActive = activeDesign === design.id;
            return (
              <button
                key={design.id}
                onClick={() => setActiveDesign(design.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDesign"
                    className={cn("absolute inset-0 rounded-xl bg-gradient-to-r", design.color)}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 relative z-10", isActive && "text-white")} />
                <span className={cn(
                  "font-medium text-sm relative z-10 hidden lg:inline",
                  isActive && "text-white"
                )}>
                  {design.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Design Info Banner */}
      <div className="pt-20 pb-4 px-6">
        <motion.div
          key={activeDesign}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl bg-gradient-to-br text-white", currentDesign.color)}>
              <currentDesign.icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {currentDesign.label}
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Design Mockup
                </span>
              </h1>
              <p className="text-sm text-gray-500">{currentDesign.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span>Static preview • Not functional</span>
          </div>
        </motion.div>
      </div>

      {/* Design Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDesign}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          {activeDesign === 'v1' && <DesignV1Refined />}
          {activeDesign === 'v2' && <DesignV2Stepper />}
          {activeDesign === 'v3' && <DesignV3MapView />}
          {activeDesign === 'v4' && <DesignV4Dense />}
          {activeDesign === 'v5' && <DesignV5Bento />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
