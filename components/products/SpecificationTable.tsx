import { Card, CardContent } from '@/components/ui/card'

interface SpecificationTableProps {
  specifications: Array<{ _key: string; label: string; value: string }>
}

export function SpecificationTable({ specifications }: SpecificationTableProps) {
  if (!specifications || specifications.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Technical Specifications
        </h2>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <dl className="divide-y divide-slate-100">
                {specifications.map((spec, index) => (
                  <div
                    key={spec._key || index}
                    className="flex justify-between py-4 px-6"
                  >
                    <dt className="font-medium text-slate-900">
                      {spec.label}
                    </dt>
                    <dd className="text-slate-600">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
