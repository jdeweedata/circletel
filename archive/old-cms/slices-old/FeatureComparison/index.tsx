/**
 * FeatureComparison Slice
 * 2-3 column comparison table
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';

export type FeatureComparisonSlice = SliceComponentProps<Content.FeatureComparisonSlice>;

const FeatureComparison = ({ slice }: FeatureComparisonSlice): JSX.Element => {
  return (
    <section className="py-16 md:py-24 bg-circleTel-lightNeutral" data-slice-type={slice.slice_type}>
      <div className="container mx-auto px-4">
        {slice.primary.heading && (
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-12 text-center">
            {slice.primary.heading}
          </h2>
        )}
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-circleTel-orange text-white">
                <th className="p-4 text-left">Feature</th>
                {slice.items.slice(0, 3).map((item, idx) => (
                  <th key={idx} className="p-4 text-center">{item.column_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.primary.features && JSON.parse(slice.primary.features || '[]').map((feature: any, idx: number) => (
                <tr key={idx} className="border-b">
                  <td className="p-4 font-semibold">{feature.name}</td>
                  {slice.items.slice(0, 3).map((item, colIdx) => (
                    <td key={colIdx} className="p-4 text-center">
                      {feature[`col${colIdx + 1}`] === true ? '✓' : feature[`col${colIdx + 1}`] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default FeatureComparison;
