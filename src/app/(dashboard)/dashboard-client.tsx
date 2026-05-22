'use client'

import Link from 'next/link'
import {
  Users, Car, FileText, TrendingUp, ArrowRight,
  Building2, Plus, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { formatMoney, ESTATUS_SOLICITUD_LABELS, ESTATUS_SOLICITUD_COLORS } from '@/lib/utils'
import type { SolicitudCompleta } from '@/types/database'

interface Props {
  stats: {
    totalClientes: number
    totalUnidades: number
    totalSolicitudes: number
    comisionesMes: number
  }
  solicitudesRecientes: SolicitudCompleta[]
  solicitudesPorEstatus: { estatus: string; total: number }[]
  solicitudesPorBanco: { nombre: string; color: string; total: number; monto: number }[]
}

const ESTATUS_COLORS_HEX: Record<string, string> = {
  nueva: '#94a3b8',
  preparando: '#f59e0b',
  enviada: '#3b82f6',
  en_revision: '#a855f7',
  aprobada: '#22c55e',
  rechazada: '#ef4444',
  fondeada: '#10b981',
  cancelada: '#6b7280',
}

export function DashboardClient({ stats, solicitudesRecientes, solicitudesPorEstatus, solicitudesPorBanco }: Props) {
  const now = new Date()
  const mesActual = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  const metricCards = [
    {
      label: 'Clientes Activos',
      value: stats.totalClientes,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/clientes',
    },
    {
      label: 'Unidades Disponibles',
      value: stats.totalUnidades,
      icon: Car,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/unidades',
    },
    {
      label: 'Total Solicitudes',
      value: stats.totalSolicitudes,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/solicitudes',
    },
    {
      label: `Comisiones ${mesActual}`,
      value: formatMoney(stats.comisionesMes),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/reportes',
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">{mesActual}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/clientes/nuevo">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Cliente
            </Button>
          </Link>
          <Link href="/solicitudes/nueva">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Solicitud
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-medium mb-1">{card.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${card.bg}`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por banco */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Solicitudes por Banco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {solicitudesPorBanco.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Sin datos aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={solicitudesPorBanco} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                    formatter={(value, name) => [
                      name === 'monto' ? formatMoney(Number(value)) : value,
                      name === 'monto' ? 'Monto' : 'Solicitudes',
                    ]}
                  />
                  <Bar dataKey="total" name="total" radius={[6, 6, 0, 0]}>
                    {solicitudesPorBanco.map((entry, i) => (
                      <Cell key={i} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por estatus */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Estado de Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {solicitudesPorEstatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Sin datos aún
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={solicitudesPorEstatus}
                      dataKey="total"
                      nameKey="estatus"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {solicitudesPorEstatus.map((entry, i) => (
                        <Cell key={i} fill={ESTATUS_COLORS_HEX[entry.estatus] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [v, ESTATUS_SOLICITUD_LABELS[String(name)] || String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {solicitudesPorEstatus.map(item => (
                    <div key={item.estatus} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: ESTATUS_COLORS_HEX[item.estatus] || '#94a3b8' }}
                        />
                        <span className="text-xs text-slate-600">{ESTATUS_SOLICITUD_LABELS[item.estatus] || item.estatus}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Solicitudes recientes */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">Solicitudes Recientes</CardTitle>
          <Link href="/solicitudes">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 gap-1 h-7 text-xs">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {solicitudesRecientes.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              No hay solicitudes aún.{' '}
              <Link href="/solicitudes/nueva" className="text-blue-600 hover:underline">
                Crear primera solicitud
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {solicitudesRecientes.map(sol => (
                <Link key={sol.id} href={`/solicitudes/${sol.id}`}>
                  <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-2 h-8 rounded-full shrink-0"
                        style={{ background: sol.banco_color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{sol.cliente_nombre}</p>
                        <p className="text-xs text-slate-500 truncate">{sol.unidad_descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{formatMoney(sol.monto_financiar)}</p>
                        <p className="text-xs text-slate-500">{sol.banco_nombre}</p>
                      </div>
                      <Badge className={`text-xs ${ESTATUS_SOLICITUD_COLORS[sol.estatus]}`} variant="secondary">
                        {ESTATUS_SOLICITUD_LABELS[sol.estatus]}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
