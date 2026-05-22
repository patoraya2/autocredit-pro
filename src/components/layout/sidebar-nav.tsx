'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Car, FileText, Building2,
  BarChart3, MessageSquareMore, LogOut, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/unidades', label: 'Unidades', icon: Car },
  { href: '/solicitudes', label: 'Solicitudes', icon: FileText },
  { href: '/bancos', label: 'Bancos', icon: Building2 },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/agente', label: 'Agente IA', icon: MessageSquareMore, highlight: true },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0f172a] border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shrink-0">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">AutoCredit Pro</p>
          <p className="text-slate-500 text-xs mt-0.5">Crédito Automotriz</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-slate-600 text-xs font-medium uppercase tracking-wider px-3 mb-2">Menú</p>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : item.highlight
                  ? 'text-blue-400 hover:bg-slate-800 hover:text-blue-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">IA</span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
