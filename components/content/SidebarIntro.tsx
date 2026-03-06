interface SidebarIntroProps {
  title?: string;
  description: string;
}

export function SidebarIntro({ title, description }: SidebarIntroProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {title && (
        <h3 className="font-semibold text-circleTel-navy mb-3">{title}</h3>
      )}
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
