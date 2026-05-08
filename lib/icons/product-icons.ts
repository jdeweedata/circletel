import {
  PiShieldCheckBold,
  PiPhoneBold,
  PiGlobeBold,
  PiChatCircleBold,
  PiWifiHighBold,
  PiHardDrivesBold,
  PiReceiptBold,
  PiArrowUpBold,
  PiLayoutBold,
  PiChartBarBold,
  PiSimCardBold,
} from 'react-icons/pi'

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: PiShieldCheckBold,
  phone: PiPhoneBold,
  globe: PiGlobeBold,
  'message-circle': PiChatCircleBold,
  wifi: PiWifiHighBold,
  router: PiHardDrivesBold,
  receipt: PiReceiptBold,
  'arrow-up': PiArrowUpBold,
  layout: PiLayoutBold,
  chart: PiChartBarBold,
  'sim-card': PiSimCardBold,
}
