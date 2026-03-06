import { ReactNode } from 'react';

interface ContentSidebarProps {
  children: ReactNode;
}

export function ContentSidebar({ children }: ContentSidebarProps) {
  return (
    <aside className="lg:w-80 flex-shrink-0">
      <div className="lg:sticky lg:top-24 space-y-6">{children}</div>
    </aside>
  );
}
