import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: { default: 'Locus', template: '%s | Locus' },
  description: 'Talk to who\'s near you. Proximity voice chat for convoys, meets, and road trips.',
  keywords: ['proximity chat', 'convoy', 'walkie talkie', 'location', 'road trip'],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Locus',
    description: 'Talk to who\'s near you.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080810',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
