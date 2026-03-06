import { ReactNode } from 'react';

interface ContentBodyProps {
  children: ReactNode;
}

export function ContentBody({ children }: ContentBodyProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="space-y-8">{children}</div>
    </div>
  );
}
