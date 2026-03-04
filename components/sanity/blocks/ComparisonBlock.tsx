'use client';

import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonColumn {
  _key: string;
  name: string;
  featured?: boolean;
  badge?: string;
}

interface ComparisonRow {
  _key: string;
  feature: string;
  values: {
    columnKey: string;
    value: 'yes' | 'no' | 'partial' | string;
  }[];
}

interface ComparisonBlockProps {
  title?: string;
  subtitle?: string;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
}

function renderValue(value: string) {
  if (value === 'yes') {
    return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  }
  if (value === 'no') {
    return <X className="w-5 h-5 text-red-400 mx-auto" />;
  }
  if (value === 'partial') {
    return <Minus className="w-5 h-5 text-amber-500 mx-auto" />;
  }
  return <span className="text-sm text-circleTel-navy">{value}</span>;
}

export function ComparisonBlock({
  title,
  subtitle,
  columns,
  rows,
}: ComparisonBlockProps) {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="font-heading text-display-2 text-circleTel-navy mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-body text-lg text-circleTel-grey600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto">
            {/* Header Row */}
            <thead>
              <tr>
                <th className="text-left p-4 bg-circleTel-grey200 rounded-tl-xl">
                  <span className="font-heading text-sm font-semibold text-circleTel-grey600">
                    Feature
                  </span>
                </th>
                {columns?.map((column, idx) => (
                  <th
                    key={column._key}
                    className={cn(
                      'p-4 text-center',
                      column.featured
                        ? 'bg-circleTel-orange text-white'
                        : 'bg-circleTel-grey200',
                      idx === columns.length - 1 && 'rounded-tr-xl'
                    )}
                  >
                    {column.badge && (
                      <span className="inline-block bg-white/20 text-xs px-2 py-0.5 rounded-full mb-1">
                        {column.badge}
                      </span>
                    )}
                    <span className={cn(
                      'font-heading text-sm font-semibold block',
                      column.featured ? 'text-white' : 'text-circleTel-navy'
                    )}>
                      {column.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody>
              {rows?.map((row, rowIdx) => (
                <tr
                  key={row._key}
                  className={cn(
                    'border-b border-gray-100',
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-circleTel-grey200/30'
                  )}
                >
                  <td className="p-4 text-left">
                    <span className="font-body text-sm text-circleTel-navy">
                      {row.feature}
                    </span>
                  </td>
                  {columns?.map((column) => {
                    const cellValue = row.values?.find(
                      (v) => v.columnKey === column._key
                    )?.value;
                    return (
                      <td
                        key={column._key}
                        className={cn(
                          'p-4 text-center',
                          column.featured && 'bg-circleTel-orange/5'
                        )}
                      >
                        {renderValue(cellValue || '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
