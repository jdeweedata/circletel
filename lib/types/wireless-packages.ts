export interface WirelessPackage {
  id: string
  name: string
  speed?: string
  data?: string
  type: "uncapped" | "capped"
  description: string
  price: {
    amount: number
    currency: string
    period: string
  }
  features: string[]
  popular?: boolean
  premium?: boolean
}

export interface PackageFeature {
  icon: string
  title: string
  description: string
  link?: string
  highlight?: boolean
}

export interface WirelessPackagesConfig {
  packages: {
    uncapped: WirelessPackage[]
    capped: WirelessPackage[]
  }
  features: PackageFeature[]
  promotions: {
    active: boolean
    current: Array<{
      id: string
      name: string
      description: string
      validUntil: string
      conditions: string[]
    }>
  }
  settings: {
    currency: string
    vat: number
    defaultTab: string
    showPromotion: boolean
    enableComparison: boolean
    maxItemsInCart: number
  }
}