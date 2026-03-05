'use client';

import { cn } from '@/lib/utils';

interface TabConfig {
  id: string;
  label: string;
}

interface UnderlineTabsProps {
  tabs: readonly TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function UnderlineTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: UnderlineTabsProps) {
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <div role="tablist" className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'pb-4 border-b-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper component for tab panels
interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({
  id,
  activeTab,
  children,
  className,
}: TabPanelProps) {
  if (activeTab !== id) return null;

  return (
    <div
      id={`${id}-panel`}
      role="tabpanel"
      aria-labelledby={`${id}-tab`}
      className={className}
    >
      {children}
    </div>
  );
}
