// Speed tier and contention level options configuration

export const speedOptions = [
  { value: '100', label: '100 Mbps', shortLabel: '100', description: 'Small office / Remote workers' },
  { value: '200', label: '200 Mbps', shortLabel: '200', description: 'Growing teams / Light cloud usage' },
  { value: '500', label: '500 Mbps', shortLabel: '500', description: 'Larger teams / Heavy cloud & VoIP' },
  { value: '1000', label: '1 Gbps+', shortLabel: '1G+', description: 'Enterprise / Data centers' },
] as const;

export const contentionOptions = [
  {
    value: 'best-effort',
    label: 'Best Effort',
    shortLabel: 'BE',
    description: 'Shared bandwidth',
    fullDescription: 'Cost-effective for non-critical applications. Bandwidth shared with other users.'
  },
  {
    value: '10:1',
    label: '10:1 Contention',
    shortLabel: '10:1',
    description: 'Business standard',
    fullDescription: 'Guaranteed minimum of 10% of line speed. Ideal for most business applications.'
  },
  {
    value: 'dia',
    label: 'DIA',
    shortLabel: 'DIA',
    description: 'Dedicated internet',
    fullDescription: 'Dedicated Internet Access. Full committed bandwidth, SLA-backed. Premium tier.'
  },
] as const;

export type SpeedValue = typeof speedOptions[number]['value'];
export type ContentionValue = typeof contentionOptions[number]['value'];
