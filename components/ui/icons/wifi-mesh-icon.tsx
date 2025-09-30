import * as React from "react"
import { cn } from "@/lib/utils"

interface WifiMeshIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export function WifiMeshIcon({
  size = 24,
  className,
  ...props
}: WifiMeshIconProps) {
  return (
    <span
      className={cn("icon --wifi-mesh inline-block", className)}
      style={{ lineHeight: 0 }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{
          display: "inline-block",
          maxWidth: "100%",
          maxHeight: "100%"
        }}
        {...props}
      >
        <path
          fill="currentColor"
          d="M12 3c6.431 0 10 4.867 10 10 0 3.44-1.26 5.709-4.445 7.832a1 1 0 1 1-1.11-1.664C19.084 17.409 20 15.76 20 13c0-4.14-2.831-8-8-8s-8 3.86-8 8c0 2.76.916 4.41 3.555 6.168a1 1 0 0 1-1.11 1.664C3.26 18.71 2 16.44 2 13 2 7.867 5.569 3 12 3m.063 4c3.893 0 6.062 2.957 6.062 6.063 0 2.084-.784 3.495-2.695 4.77a1 1 0 1 1-1.11-1.665c1.365-.91 1.805-1.702 1.805-3.105 0-2.111-1.431-4.063-4.062-4.063S8 10.952 8 13.063c0 1.403.44 2.195 1.805 3.105a1 1 0 1 1-1.11 1.664C6.784 16.558 6 15.147 6 13.062 6 9.958 8.169 7 12.063 7M12 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4"
        />
      </svg>
    </span>
  )
}

export default WifiMeshIcon