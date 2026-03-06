import { KeyPoint } from '@/lib/content/types';

interface SidebarKeyPointsProps {
  points: KeyPoint[];
  heading?: string;
}

export function SidebarKeyPoints({
  points,
  heading = 'Key points',
}: SidebarKeyPointsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-circleTel-navy mb-4 text-sm uppercase tracking-wide">
        {heading}
      </h3>
      <div className="space-y-4">
        {points.map((point, index) => {
          const Icon = point.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-circleTel-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-circleTel-navy text-sm">
                  {point.title}
                </p>
                {point.description && (
                  <p className="text-gray-500 text-xs">{point.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
