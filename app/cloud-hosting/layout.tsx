import './globals.css'

export const metadata = {
  title: 'Cloud Hosting Solutions | CircleTel',
  description: 'Virtual hosting with more scalability, more redundancy and minimal downtime. Explore our managed and self-managed cloud hosting solutions.',
  keywords: 'cloud hosting, VPS, virtual private server, managed hosting, South Africa, CircleTel',
}

export default function CloudHostingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}