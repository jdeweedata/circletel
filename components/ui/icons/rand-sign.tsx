import * as React from "react"
import { cn } from "@/lib/utils"

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
  strokeWidth?: number | string
}

export function RandSign({
  size = 24,
  className,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-rand-sign", className)}
      {...props}
    >
      <path d="M7 5v14" />
      <path d="M7 13h4a4 4 0 0 0 0-8H7" />
      <path d="M11 13l5 6" />
    </svg>
  )
}

export default RandSign;
