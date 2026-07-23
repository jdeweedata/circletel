import { permanentRedirect } from "next/navigation";

/**
 * Preserve the published CloudWiFi toolkit URL while the current guide lives
 * at the established connectivity-guide route.
 */
export default function WifiToolkitRedirect() {
  permanentRedirect("/resources/connectivity-guide");
}
