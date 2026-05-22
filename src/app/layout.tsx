import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'AutoCredit Pro',
  description: 'Sistema de Crédito Automotriz',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
