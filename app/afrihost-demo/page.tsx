import { WirelessPackagesSection } from "@/components/wireless-packages-section"

export default function AfriHostDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Afrihost-style Wireless Packages</h1>
        <p className="text-muted-foreground">
          Recreation of the Afrihost Pure Wireless packages section using shadcn/ui components.
          This matches the structure and functionality shown in the original HTML.
        </p>
      </div>

      <WirelessPackagesSection />

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Component Analysis</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">Original HTML Structure:</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>div.packages.solution-based-packages</code></li>
              <li>• <code>div.packages-section</code></li>
              <li>• <code>div.column-header</code> with tab selector</li>
              <li>• <code>div.package-cards.--col3</code></li>
              <li>• <code>div.card-solution</code> for each package</li>
              <li>• <code>div.packages-sidebar</code> with features</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">shadcn/ui Components Used:</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>Tabs</code> - For All/Capped/Uncapped switching</li>
              <li>• <code>Card</code> - For package containers</li>
              <li>• <code>Button</code> - For pricing CTAs</li>
              <li>• <code>lucide-react</code> icons - For visual elements</li>
              <li>• Responsive grid layout with Tailwind CSS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}