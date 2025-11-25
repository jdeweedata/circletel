import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";

/**
 * Props for `ComparisonTable`.
 */
export type ComparisonTableProps = SliceComponentProps<Content.ComparisonTableSlice>;

/**
 * Component for "ComparisonTable" Slices.
 */
const ComparisonTable = ({ slice }: ComparisonTableProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 bg-white"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          {slice.primary.section_title && (
            <div className="mb-8">
              <PrismicRichText
                field={slice.primary.section_title}
                components={{
                  heading2: ({ children }) => (
                    <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
                      {children}
                    </h2>
                  ),
                }}
              />
              <div className="bg-circleTel-orange h-1 w-20 mb-6"></div>
              {slice.primary.section_description && (
                <div className="text-circleTel-secondaryNeutral">
                  <PrismicRichText field={slice.primary.section_description} />
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-circleTel-orange text-white">
                  <th className="px-4 py-3 text-left">Feature</th>
                  {slice.primary.column_1_header && (
                    <th className="px-4 py-3 text-center">
                      {slice.primary.column_1_header}
                    </th>
                  )}
                  {slice.primary.column_2_header && (
                    <th className="px-4 py-3 text-center">
                      {slice.primary.column_2_header}
                    </th>
                  )}
                  {slice.primary.column_3_header && (
                    <th className="px-4 py-3 text-center">
                      {slice.primary.column_3_header}
                    </th>
                  )}
                  {slice.primary.column_4_header && (
                    <th className="px-4 py-3 text-center">
                      {slice.primary.column_4_header}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {slice.items.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      row.highlight_row
                        ? "bg-circleTel-lightNeutral"
                        : index % 2 === 0
                        ? ""
                        : "bg-circleTel-lightNeutral"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{row.row_label}</td>
                    {row.column_1_value && (
                      <td className="px-4 py-3 text-center">
                        {row.column_1_value}
                      </td>
                    )}
                    {row.column_2_value && (
                      <td className="px-4 py-3 text-center">
                        {row.column_2_value}
                      </td>
                    )}
                    {row.column_3_value && (
                      <td className="px-4 py-3 text-center">
                        {row.column_3_value}
                      </td>
                    )}
                    {row.column_4_value && (
                      <td className="px-4 py-3 text-center">
                        {row.column_4_value}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {slice.primary.footer_note && (
              <p className="text-sm text-circleTel-secondaryNeutral mt-2">
                {slice.primary.footer_note}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
