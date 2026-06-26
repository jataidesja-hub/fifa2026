import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'FIFA 2026 Dashboard',
  description: 'Dashboard interativo em tempo real da Copa do Mundo FIFA 2026 — classificações, fases, resultados e estatísticas.',
  keywords: 'FIFA 2026, Copa do Mundo, World Cup, Dashboard, Estatísticas, Resultados',
  openGraph: {
    title: 'FIFA 2026 Dashboard',
    description: 'Dashboard em tempo real da Copa do Mundo 2026',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
