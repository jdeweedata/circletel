import { ReactNode } from 'react';
import { IconType } from 'react-icons';
import { PiFileTextBold } from 'react-icons/pi';

interface ContentSectionProps {
  id: string;
  title: string;
  icon?: IconType;
  children: ReactNode;
}

export function ContentSection({
  id,
  title,
  icon,
  children,
}: ContentSectionProps) {
  const Icon = icon || PiFileTextBold;

  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
        <Icon className="w-5 h-5 text-circleTel-orange" />
        <h2 className="text-lg font-bold text-circleTel-navy font-heading">
          {title}
        </h2>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="prose prose-gray max-w-none prose-headings:text-circleTel-navy prose-headings:font-semibold prose-h3:text-base prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-circleTel-navy">
          {children}
        </div>
      </div>
    </section>
  );
}
