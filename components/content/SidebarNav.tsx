import { PiListBold } from 'react-icons/pi';
import { SidebarNavSection } from '@/lib/content/types';

interface SidebarNavProps {
  sections: SidebarNavSection[];
}

export function SidebarNav({ sections }: SidebarNavProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-circleTel-navy mb-4 text-sm uppercase tracking-wide">
        Jump to section
      </h3>
      <nav className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon || PiListBold;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-circleTel-orange/5 hover:text-circleTel-orange transition-colors group"
            >
              <Icon className="w-4 h-4 text-gray-400 group-hover:text-circleTel-orange transition-colors" />
              <span className="text-sm font-medium">{section.title}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
