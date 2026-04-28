import Image from 'next/image'
import { HARDWARE_ADDONS } from '@/lib/data/mtn-business-deals'

export function HardwareAddOnStrip() {
  return (
    <section className="bg-white border-t border-b border-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-heading font-bold text-lg text-[#1B2A4A] mb-4">
          Add a MiFi router to your business deal
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {HARDWARE_ADDONS.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3 flex-1 border border-gray-200"
            >
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-white rounded-lg border border-gray-100">
                <Image
                  src={addon.image_path}
                  alt={addon.device_name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1B2A4A] leading-snug">{addon.device_name}</p>
                <p className="text-xs text-gray-500 leading-tight">{addon.tagline}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400 leading-tight">Outright</p>
                <p className="font-heading font-black text-base text-[#F5831F] leading-tight">
                  R{addon.outright_incl_vat.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
