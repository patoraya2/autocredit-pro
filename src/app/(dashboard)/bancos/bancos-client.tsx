'use client'

import { useState } from 'react'
import { Building2, TrendingUp, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { formatMoney, formatDate, ESTATUS_SOLICITUD_LABELS, ESTATUS_SOLICITUD_COLORS } from '@/lib/utils'
import type { SolicitudCompleta, Banco } from '@/types/database'
import Link from 'next/link'

interface Props {
  solicitudes: SolicitudCompleta[]
  bancos: Banco[]
}

export function BancosClient({ solicitudes, bancos }: Props) {
  const [bancoSeleccionado, setBancoSeleccionado] = useState(bancos[0]?.codigo || '')

  function getMetricasBanco(codigo: string) {
    const sols = solicitudes.filter(s => s.banco_codigo === codigo)
    const aprobadas = sols.filter(s => ['aprobada', 'fondeada'].includes(s.estatus)).length
    const rechazadas = sols.filter(s => s.estatus === 'rechazada').length
    const activas = sols.filter(s => !['rechazada', 'cancelada', 'fondeada'].includes(s.estatus)).length
    const montoTotal = sols.reduce((a, b) => a + (b.monto_financiar || 0), 0)
    const tasa = sols.length > 0 ? Math.round((aprobadas / sols.length) * 100) : 0
    return { sols, total: sols.length, aprobadas, rechazadas, activas, montoTotal, tasa }
  }

  const bancoActual = bancos.find(b => b.codigo === bancoSeleccionado)
  const metricas = getMetricasBanco(bancoSeleccionado)

  // Datos mensuales para el banco actual
  const dataByMonth: Record<string, { mes: string; solicitudes: number; monto: number }> = {}
  metricas.sols.forEach(s => {
    const mes = new Date(s.created_at).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    if (!dataByMonth[mes]) dataByMonth[mes] = { mes, solicitudes: 0, monto: 0 }
    dataByMonth[mes].solicitudes++
    dataByMonth[mes].monto += s.monto_financiar || 0
  })
  const chartData = Object.values(dataByMonth).slice(-6)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard por Banco</h1>
          <p className="text-slate-500 text-xs">Análisis y seguimiento por institución financiera</p>
        </div>
      </div>

      {/* Resumen de todos los bancos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {bancos.map(banco => {
          const m = getMetricasBanco(banco.codigo)
          return (
            <button
              key={banco.codigo}
              onClick={() => setBancoSeleccionado(banco.codigo)}
              className={`text-left transition-all ${bancoSeleccionado === banco.codigo ? 'ring-2 ring-offset-2' : ''}`}
              style={{ '--tw-ring-color': banco.color } as React.CSSProperties}
            >
              <Card className={`border-slate-200 hover:shadow-md transition-shadow ${bancoSeleccionado === banco.codigo ? 'shadow-md' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-8 rounded-full"
                      style={{ background: banco.color }}
                    />
                    <div>
                      <p className="font-bold text-slate-900">{banco.nombre}</p>
                      <p className="text-xs text-slate-500">{m.total} solicitudes</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-700">{m.aprobadas}</p>
                      <p className="text-xs text-green-600">Aprobadas</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-slate-700">{m.activas}</p>
                      <p className="text-xs text-slate-500">Activas</p>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(m.montoTotal)}</p>
                    <p className="text-xs text-slate-400">Monto total</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      {/* Detalle del banco seleccionado */}
      {bancoActual && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full" style={{ background: bancoActual.color }} />
            <h2 className="text-lg font-bold text-slate-900">{bancoActual.nombre}</h2>
            <Badge variant="secondary" className="text-xs">
              {metricas.tasa}% tasa de aprobación
            </Badge>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Solicitudes', value: metricas.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Aprobadas / Fondeadas', value: metricas.aprobadas, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Rechazadas', value: metricas.rechazadas, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'En Proceso', value: metricas.activas, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(m => {
              const Icon = m.icon
              return (
                <Card key={m.label} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{m.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${m.bg}`}>
                        <Icon className={`w-4 h-4 ${m.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Gráfica de tendencia */}
          {chartData.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  Tendencia Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [v, 'Solicitudes']}
                    />
                    <Bar dataKey="solicitudes" fill={bancoActual.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Solicitudes del banco */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Solicitudes — {bancoActual.nombre}
              </CardTitle>
            </CardHeader>
            {metricas.sols.length === 0 ? (
              <CardContent>
                <p className="text-slate-400 text-sm text-center py-6">
                  No hay solicitudes para {bancoActual.nombre} aún
                </p>
              </CardContent>
            ) : (
              <div className="divide-y divide-slate-100">
                {metricas.sols.slice(0, 10).map(sol => (
                  <Link key={sol.id} href={`/solicitudes/${sol.id}`}>
                    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono text-slate-400 shrink-0">{sol.folio}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{sol.cliente_nombre}</p>
                          <p className="text-xs text-slate-500 truncate">{sol.unidad_descripcion}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <p className="text-sm font-semibold text-slate-900 hidden sm:block">
                          {formatMoney(sol.monto_financiar)}
                        </p>
                        <Badge variant="secondary" className={`text-xs ${ESTATUS_SOLICITUD_COLORS[sol.estatus]}`}>
                          {ESTATUS_SOLICITUD_LABELS[sol.estatus]}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                {metricas.sols.length > 10 && (
                  <div className="px-5 py-3 text-center">
                    <Link href="/solicitudes" className="text-xs text-blue-600 hover:underline">
                      Ver las {metricas.sols.length - 10} restantes →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
