/**
 * RichTextBlock Slice
 * Long-form content with rich text formatting
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps, PrismicRichText } from '@prismicio/react';

export type RichTextBlockSlice = SliceComponentProps<Content.RichTextBlockSlice>;

const RichTextBlock = ({ slice }: RichTextBlockSlice): JSX.Element => {
  return (
    <section className="py-16 md:py-24 bg-white" data-slice-type={slice.slice_type}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="prose prose-lg prose-circleTel max-w-none">
          <PrismicRichText field={slice.primary.content} />
        </div>
      </div>
    </section>
  );
};

export default RichTextBlock;
