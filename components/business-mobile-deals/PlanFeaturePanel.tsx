import {
  PiCellSignalHighBold,
  PiUsersBold,
  PiHeadphonesBold,
  PiReceiptBold,
  PiShieldCheckBold,
} from 'react-icons/pi'

const FEATURES = [
  {
    icon: PiCellSignalHighBold,
    title: 'MTN Enterprise Network',
    body: "Priority access on South Africa's leading business LTE & 5G network.",
  },
  {
    icon: PiUsersBold,
    title: 'Multi-SIM Ready',
    body: 'Add multiple lines on a single business account — perfect for teams.',
  },
  {
    icon: PiHeadphonesBold,
    title: 'Dedicated Business Support',
    body: 'Mon-Fri 8am–5pm SAST. Escalate directly via your account manager.',
  },
  {
    icon: PiReceiptBold,
    title: 'Single Monthly Bill',
    body: 'All your devices and plans consolidated on one invoice.',
  },
  {
    icon: PiShieldCheckBold,
    title: 'No Hidden Fees',
    body: 'All prices quoted are VAT-inclusive. What you see is what you pay.',
  },
]

export function PlanFeaturePanel() {
  return (
    <div className="bg-[#1B2A4A] rounded-xl p-6 text-white h-full flex flex-col gap-5">
      <h3 className="font-heading font-bold text-lg leading-snug">
        Why choose a business plan?
      </h3>
      <ul className="flex flex-col gap-4 flex-1">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-[#F5831F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="text-xs text-white/70 mt-0.5 leading-snug">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
