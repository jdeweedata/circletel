import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CallToActionSectionProps {
  heading: string
  text?: string
  buttonText: string
  buttonUrl: string
  style: 'orange' | 'blue' | 'dark' | 'white'
}

export function CallToActionSection({ heading, text, buttonText, buttonUrl, style = 'orange' }: CallToActionSectionProps) {
  
  const styles = {
    orange: "bg-circleTel-orange text-white",
    blue: "bg-blue-600 text-white",
    dark: "bg-circleTel-darkNeutral text-white",
    white: "bg-white text-gray-900 border-y border-gray-100"
  }

  const buttonStyles = {
    orange: "bg-white text-circleTel-orange hover:bg-gray-100",
    blue: "bg-white text-blue-600 hover:bg-gray-100",
    dark: "bg-circleTel-orange text-white hover:bg-orange-600",
    white: "bg-circleTel-orange text-white hover:bg-orange-600"
  }

  return (
    <section className={cn("py-16 md:py-20", styles[style])}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
          
          <div className="text-center md:text-left max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {heading}
            </h2>
            {text && (
              <p className={cn(
                "text-lg md:text-xl",
                style === 'white' ? "text-gray-600" : "text-white/90"
              )}>
                {text}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <Link href={buttonUrl || '#'}>
              <Button size="lg" className={cn("px-8 text-lg h-14 font-semibold", buttonStyles[style])}>
                {buttonText}
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
