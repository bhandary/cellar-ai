import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cellar AI',
  description: 'Wine expert AI assistant with streaming guidance and structured renders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
