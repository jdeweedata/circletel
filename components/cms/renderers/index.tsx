/**
 * CMS Public Block Renderers
 *
 * Server-side renderers for all CMS block types.
 * These components render published pages to the public.
 */

import { cn } from '@/lib/utils';
import type {
  BlockType,
  ContentBlock,
  BlockSettings,
  HeroContent,
  TextContent,
  ImageContent,
  CTAContent,
  FeatureGridContent,
  TestimonialContent,
  PricingContent,
  VideoContent,
  GalleryContent,
  FormContent,
  DividerContent,
  SpacerContent,
} from '@/lib/cms/types';

// ============================================
// Utility Functions
// ============================================

function getPaddingClasses(padding?: BlockSettings['padding']): string {
  const paddingMap = {
    none: '',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-16',
    xl: 'py-24',
  };
  return paddingMap[padding || 'md'];
}

function getAnimationClasses(animation?: BlockSettings['animation']): string {
  const animationMap = {
    none: '',
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-down': 'animate-slide-down',
    zoom: 'animate-zoom-in',
  };
  return animationMap[animation || 'none'];
}

// ============================================
// Hero Block Renderer
// ============================================

function HeroRenderer({ content, settings }: { content: HeroContent; settings?: BlockSettings }) {
  const alignment = content.alignment || 'center';
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const backgroundStyle: React.CSSProperties = {};
  if (content.backgroundType === 'image' && content.backgroundValue) {
    backgroundStyle.backgroundImage = `url(${content.backgroundValue})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
  } else if (content.backgroundType === 'gradient') {
    backgroundStyle.background = 'linear-gradient(135deg, #F5831F 0%, #1F2937 100%)';
  }

  return (
    <section
      className={cn(
        'relative min-h-[60vh] flex flex-col justify-center',
        getPaddingClasses(settings?.padding || 'lg'),
        getAnimationClasses(settings?.animation),
        alignmentClasses[alignment]
      )}
      style={backgroundStyle}
    >
      {content.backgroundType === 'image' && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      <div className={cn(
        'relative z-10 max-w-4xl mx-auto px-4',
        content.backgroundType === 'image' || content.backgroundType === 'gradient' ? 'text-white' : ''
      )}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          {content.headline}
        </h1>
        {content.subheadline && (
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
            {content.subheadline}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          {content.ctaText && content.ctaUrl && (
            <a
              href={content.ctaUrl}
              className="inline-flex items-center px-8 py-3 bg-circleTel-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {content.ctaText}
            </a>
          )}
          {content.secondaryCtaText && content.secondaryCtaUrl && (
            <a
              href={content.secondaryCtaUrl}
              className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              {content.secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Text Block Renderer
// ============================================

function TextRenderer({ content, settings }: { content: TextContent; settings?: BlockSettings }) {
  const variantClasses = {
    paragraph: '',
    quote: 'border-l-4 border-circleTel-orange pl-6 italic text-gray-600',
    callout: 'bg-orange-50 border border-orange-200 rounded-lg p-6',
  };

  return (
    <div
      className={cn(
        'max-w-4xl mx-auto px-4',
        getPaddingClasses(settings?.padding),
        getAnimationClasses(settings?.animation),
        variantClasses[content.variant || 'paragraph']
      )}
    >
      <div
        className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-circleTel-orange"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    </div>
  );
}

// ============================================
// Image Block Renderer
// ============================================

function ImageRenderer({ content, settings }: { content: ImageContent; settings?: BlockSettings }) {
  const variantClasses = {
    full: 'w-full',
    'side-by-side': 'max-w-2xl mx-auto',
    rounded: 'max-w-2xl mx-auto rounded-2xl overflow-hidden',
  };

  const ImageElement = (
    <figure className={cn(variantClasses[content.variant || 'full'])}>
      {content.src ? (
        <img
          src={content.src}
          alt={content.alt}
          className="w-full h-auto"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
          No image selected
        </div>
      )}
      {content.caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );

  return (
    <div
      className={cn(
        'px-4',
        getPaddingClasses(settings?.padding),
        getAnimationClasses(settings?.animation)
      )}
    >
      {content.link ? (
        <a href={content.link} className="block">
          {ImageElement}
        </a>
      ) : (
        ImageElement
      )}
    </div>
  );
}

// ============================================
// CTA Block Renderer
// ============================================

function CTARenderer({ content, settings }: { content: CTAContent; settings?: BlockSettings }) {
  const variantStyles = {
    banner: 'bg-gradient-to-r from-circleTel-orange to-orange-600 text-white',
    card: 'bg-white border border-gray-200 rounded-2xl shadow-lg',
    inline: 'bg-gray-50',
  };

  return (
    <section
      className={cn(
        'px-4',
        getPaddingClasses(settings?.padding || 'lg'),
        getAnimationClasses(settings?.animation)
      )}
    >
      <div
        className={cn(
          'max-w-4xl mx-auto p-8 md:p-12 text-center',
          variantStyles[content.variant || 'banner']
        )}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.headline}</h2>
        {content.description && (
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {content.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href={content.primaryButtonUrl}
            className={cn(
              'inline-flex items-center px-8 py-3 font-semibold rounded-lg transition-colors',
              content.variant === 'banner'
                ? 'bg-white text-circleTel-orange hover:bg-gray-100'
                : 'bg-circleTel-orange text-white hover:bg-orange-600'
            )}
          >
            {content.primaryButtonText}
          </a>
          {content.secondaryButtonText && content.secondaryButtonUrl && (
            <a
              href={content.secondaryButtonUrl}
              className={cn(
                'inline-flex items-center px-8 py-3 font-semibold rounded-lg transition-colors',
                content.variant === 'banner'
                  ? 'border-2 border-white text-white hover:bg-white/10'
                  : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {content.secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Feature Grid Block Renderer
// ============================================

function FeatureGridRenderer({ content, settings }: { content: FeatureGridContent; settings?: BlockSettings }) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section
      className={cn(
        'max-w-6xl mx-auto px-4',
        getPaddingClasses(settings?.padding || 'lg'),
        getAnimationClasses(settings?.animation)
      )}
    >
      <div className={cn('grid gap-8', columnClasses[content.columns || 3])}>
        {content.features.map((feature, index) => (
          <div
            key={index}
            className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center text-circleTel-orange">
              <span className="text-2xl font-bold">{feature.icon?.charAt(0) || '★'}</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
            {feature.link && (
              <a
                href={feature.link}
                className="inline-block mt-4 text-circleTel-orange font-medium hover:underline"
              >
                Learn more →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// Testimonial Block Renderer
// ============================================

function TestimonialRenderer({ content, settings }: { content: TestimonialContent; settings?: BlockSettings }) {
  if (content.variant === 'grid') {
    return (
      <section
        className={cn(
          'max-w-6xl mx-auto px-4',
          getPaddingClasses(settings?.padding || 'lg'),
          getAnimationClasses(settings?.animation)
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 bg-white border border-gray-200 rounded-xl"
            >
              <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                {testimonial.avatarUrl ? (
                  <img
                    src={testimonial.avatarUrl}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-circleTel-orange text-white flex items-center justify-center font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-sm text-gray-500">
                      {testimonial.role}{testimonial.role && testimonial.company ? ', ' : ''}{testimonial.company}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Single testimonial (featured)
  const testimonial = content.testimonials[0];
  if (!testimonial) return null;

  return (
    <section
      className={cn(
        'max-w-4xl mx-auto px-4 text-center',
        getPaddingClasses(settings?.padding || 'lg'),
        getAnimationClasses(settings?.animation)
      )}
    >
      <blockquote>
        <p className="text-2xl md:text-3xl text-gray-700 italic mb-8">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <footer className="flex flex-col items-center gap-3">
          {testimonial.avatarUrl ? (
            <img
              src={testimonial.avatarUrl}
              alt={testimonial.author}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-2xl font-bold">
              {testimonial.author.charAt(0)}
            </div>
          )}
          <div>
            <cite className="not-italic font-semibold text-gray-900">{testimonial.author}</cite>
            {(testimonial.role || testimonial.company) && (
              <p className="text-sm text-gray-500">
                {testimonial.role}{testimonial.role && testimonial.company ? ', ' : ''}{testimonial.company}
              </p>
            )}
          </div>
        </footer>
      </blockquote>
    </section>
  );
}

// ============================================
// Pricing Block Renderer
// ============================================

function PricingRenderer({ content, settings }: { content: PricingContent; settings?: BlockSettings }) {
  return (
    <section
      className={cn(
        'max-w-6xl mx-auto px-4',
        getPaddingClasses(settings?.padding || 'lg'),
        getAnimationClasses(settings?.animation)
      )}
    >
      {content.headline && (
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {content.headline}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.plans.map((plan, index) => (
          <div
            key={index}
            className={cn(
              'relative p-8 rounded-2xl border-2 transition-shadow',
              plan.highlighted
                ? 'border-circleTel-orange shadow-xl scale-105 bg-white'
                : 'border-gray-200 bg-white hover:shadow-lg'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-circleTel-orange text-white text-sm font-semibold rounded-full">
                Most Popular
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              {plan.period && (
                <span className="text-gray-500">{plan.period}</span>
              )}
            </div>
            {plan.description && (
              <p className="text-gray-600 mb-6">{plan.description}</p>
            )}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href={plan.ctaUrl}
              className={cn(
                'block w-full py-3 text-center font-semibold rounded-lg transition-colors',
                plan.highlighted
                  ? 'bg-circleTel-orange text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              )}
            >
              {plan.ctaText}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// Video Block Renderer
// ============================================

function VideoRenderer({ content, settings }: { content: VideoContent; settings?: BlockSettings }) {
  const getEmbedUrl = () => {
    if (!content.url) return null;

    if (content.platform === 'youtube') {
      // Extract YouTube video ID
      const match = content.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}${content.autoplay ? '?autoplay=1' : ''}`;
      }
    } else if (content.platform === 'vimeo') {
      // Extract Vimeo video ID
      const match = content.url.match(/vimeo\.com\/(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}${content.autoplay ? '?autoplay=1' : ''}`;
      }
    }

    return content.url;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div
      className={cn(
        'max-w-4xl mx-auto px-4',
        getPaddingClasses(settings?.padding),
        getAnimationClasses(settings?.animation)
      )}
    >
      {content.title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4">{content.title}</h3>
      )}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={content.title || 'Video'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No video URL provided
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Gallery Block Renderer
// ============================================

function GalleryRenderer({ content, settings }: { content: GalleryContent; settings?: BlockSettings }) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (!content.images || content.images.length === 0) {
    return (
      <div
        className={cn(
          'max-w-6xl mx-auto px-4',
          getPaddingClasses(settings?.padding)
        )}
      >
        <div className="p-12 bg-gray-50 rounded-xl text-center text-gray-400">
          No images in gallery
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'max-w-6xl mx-auto px-4',
        getPaddingClasses(settings?.padding),
        getAnimationClasses(settings?.animation)
      )}
    >
      <div className={cn('grid gap-4', columnClasses[content.columns || 3])}>
        {content.images.map((image, index) => (
          <figure key={index} className="group relative overflow-hidden rounded-lg">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-48 md:h-64 object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {image.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

// ============================================
// Form Block Renderer
// ============================================

function FormRenderer({ content, settings }: { content: FormContent; settings?: BlockSettings }) {
  return (
    <section
      className={cn(
        'max-w-2xl mx-auto px-4',
        getPaddingClasses(settings?.padding || 'lg'),
        getAnimationClasses(settings?.animation)
      )}
    >
      <form
        action={content.webhookUrl || '/api/forms/submit'}
        method="POST"
        className="space-y-6 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm"
      >
        <input type="hidden" name="formType" value={content.formType} />

        {content.fields.map((field, index) => (
          <div key={index}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-circleTel-orange"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-circleTel-orange"
              >
                <option value="">{field.placeholder || 'Select an option'}</option>
                {field.options?.map((option, optIndex) => (
                  <option key={optIndex} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  className="w-5 h-5 text-circleTel-orange rounded focus:ring-circleTel-orange"
                />
                <span className="text-gray-600">{field.placeholder}</span>
              </label>
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-circleTel-orange"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-3 bg-circleTel-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
        >
          {content.submitText}
        </button>
      </form>
    </section>
  );
}

// ============================================
// Divider Block Renderer
// ============================================

function DividerRenderer({ content, settings }: { content: DividerContent; settings?: BlockSettings }) {
  const styleClasses = {
    line: 'border-t',
    gradient: 'h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent border-none',
    dashed: 'border-t border-dashed',
    dots: 'border-none',
  };

  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
  };

  if (content.style === 'dots') {
    return (
      <div
        className={cn(
          'flex justify-center gap-2',
          getPaddingClasses(settings?.padding || 'sm')
        )}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-gray-300"
            style={{ backgroundColor: content.color }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex justify-center',
        getPaddingClasses(settings?.padding || 'sm')
      )}
    >
      <hr
        className={cn(
          'border-gray-300',
          styleClasses[content.style || 'line'],
          widthClasses[content.width || 'full']
        )}
        style={{ borderColor: content.color }}
      />
    </div>
  );
}

// ============================================
// Spacer Block Renderer
// ============================================

function SpacerRenderer({ content }: { content: SpacerContent }) {
  const sizeClasses = {
    xs: 'h-4',
    sm: 'h-8',
    md: 'h-16',
    lg: 'h-24',
    xl: 'h-32',
  };

  return <div className={sizeClasses[content.size || 'md']} aria-hidden="true" />;
}

// ============================================
// Main Block Renderer
// ============================================

interface BlockRendererProps {
  block: ContentBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const renderers: Record<BlockType, React.ComponentType<{ content: unknown; settings?: BlockSettings }>> = {
    hero: HeroRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    text: TextRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    image: ImageRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    cta: CTARenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    feature_grid: FeatureGridRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    testimonial: TestimonialRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    pricing: PricingRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    video: VideoRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    gallery: GalleryRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    form: FormRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    divider: DividerRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
    spacer: SpacerRenderer as React.ComponentType<{ content: unknown; settings?: BlockSettings }>,
  };

  const Renderer = renderers[block.type];

  if (!Renderer) {
    console.warn(`Unknown block type: ${block.type}`);
    return null;
  }

  return (
    <div
      data-block-id={block.id}
      data-block-type={block.type}
      className={cn(
        block.settings?.fullWidth ? '' : 'container mx-auto',
        block.settings?.customClasses
      )}
    >
      <Renderer content={block.content} settings={block.settings} />
    </div>
  );
}

// ============================================
// Page Renderer
// ============================================

interface PageRendererProps {
  blocks: ContentBlock[];
  theme?: 'light' | 'dark';
}

export function PageRenderer({ blocks, theme = 'light' }: PageRendererProps) {
  return (
    <main className={cn('min-h-screen', theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white')}>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </main>
  );
}

export default BlockRenderer;
