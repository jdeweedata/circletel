// components/sanity/blocks/FormBlock.tsx
'use client'

import { cn } from '@/lib/utils'
import { SanityImage } from '../primitives'

interface FormBlockProps {
  formProvider: 'circletel-contact' | 'circletel-callback' | 'circletel-newsletter' | 'hubspot' | 'typeform'
  formId?: string
  headline?: string
  description?: string
  variant?: 'card' | 'inline' | 'split'
  submitText?: string
  successMessage?: string
  backgroundImage?: {
    _type: 'image'
    asset: { _ref: string; _type: 'reference' }
    hotspot?: { x: number; y: number }
  }
}

const variantClasses = {
  card: 'bg-white rounded-2xl shadow-lg p-8',
  inline: '',
  split: 'grid md:grid-cols-2 gap-8 items-center',
}

export function FormBlock({
  formProvider,
  formId,
  headline,
  description,
  variant = 'card',
  submitText = 'Submit',
  successMessage = 'Thank you! We will be in touch soon.',
  backgroundImage,
}: FormBlockProps) {
  // For HubSpot embeds
  if (formProvider === 'hubspot' && formId) {
    return (
      <div className="container mx-auto px-4">
        <div className={cn(variantClasses[variant], 'max-w-xl mx-auto')}>
          {headline && <h2 className="text-2xl font-heading font-bold mb-4">{headline}</h2>}
          {description && <p className="text-gray-600 mb-6">{description}</p>}
          <div id={`hubspot-form-${formId}`} data-hubspot-form-id={formId}>
            {/* HubSpot script will inject form here */}
            <p className="text-gray-400 text-sm">Loading form...</p>
          </div>
        </div>
      </div>
    )
  }

  // For Typeform embeds
  if (formProvider === 'typeform' && formId) {
    return (
      <div className="container mx-auto px-4">
        <div className={cn(variantClasses[variant], 'max-w-xl mx-auto')}>
          {headline && <h2 className="text-2xl font-heading font-bold mb-4">{headline}</h2>}
          {description && <p className="text-gray-600 mb-6">{description}</p>}
          <div data-tf-live={formId} style={{ height: '400px' }}>
            {/* Typeform embed */}
          </div>
        </div>
      </div>
    )
  }

  // Split variant with background image
  if (variant === 'split' && backgroundImage) {
    return (
      <div className="container mx-auto px-4">
        <div className={variantClasses[variant]}>
          <div className="relative h-64 md:h-full min-h-[300px] rounded-lg overflow-hidden">
            <SanityImage image={backgroundImage} fill className="object-cover" />
          </div>
          <div className="py-8 md:py-0">
            {headline && <h2 className="text-2xl font-heading font-bold mb-2">{headline}</h2>}
            {description && <p className="text-gray-600 mb-6">{description}</p>}
            <FormPlaceholder
              formProvider={formProvider}
              submitText={submitText}
              successMessage={successMessage}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className={cn(variantClasses[variant], 'max-w-xl mx-auto')}>
        {headline && <h2 className="text-2xl font-heading font-bold mb-2">{headline}</h2>}
        {description && <p className="text-gray-600 mb-6">{description}</p>}
        <FormPlaceholder
          formProvider={formProvider}
          submitText={submitText}
          successMessage={successMessage}
        />
      </div>
    </div>
  )
}

// Placeholder for CircleTel forms - connect to actual form components
function FormPlaceholder({
  formProvider,
  submitText,
}: {
  formProvider: string
  submitText?: string
  successMessage?: string
}) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <p className="text-gray-500 text-sm mb-4">
        Form: <code className="bg-gray-200 px-1 rounded">{formProvider}</code>
      </p>
      <p className="text-gray-400 text-xs">
        Connect to existing form component. Button text: &quot;{submitText}&quot;
      </p>
    </div>
  )
}
