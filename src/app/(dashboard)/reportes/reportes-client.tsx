'use client'

import { useMemo, useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { formatMoney } from '@/lib/utils'
import type { SolicitudCompleta } from '@/types/database'

export function ReportesClient({ solicitudes }: { solicitudes: SolicitudCompleta[] }) {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'anio'>('mes')

  const now = new Date()

  // Agrupar por semana
  function getWeekKey(date: Date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - d.getDay())
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  }

  const dataAgrupada = useMemo(() => {
    const groups: Record<string, {
      label: string; solicitudes: number; monto: number;
      aprobadas: number; comisiones: number;
    }> = {}

    solicitudes.forEach(s => {
      const fecha = new Date(s.created_at)
      let key: string

      if (periodo === 'semana') {
        key = getWeekKey(fecha)
      } else if (periodo === 'mes') {
        key = fecha.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      } else {
        key = fecha.getFullYear().toString()
      }

      if (!groups[key]) groups[key] = { label: key, solicitudes: 0, monto: 0, aprobadas: 0, comisiones: 0 }
      groups[key].solicitudes++
      groups[key].monto += s.monto_financiar || 0
      if (['aprobada', 'fondeada'].includes(s.estatus)) groups[key].aprobadas++
      if (s.comision_pagada && s.comision) groups[key].comisiones += s.comision
    })

    return Object.values(groups).slice(-12)
  }, [solicitudes, periodo])

  // Totales
  const totalMonto = solicitudes.reduce((a, b) => a + (b.monto_financiar || 0), 0)
  const totalComisiones = solicitudes.filter(s => s.comision_pagada).reduce((a, b) => a + (b.comision || 0), 0)
  const fondeadas = solicitudes.filter(s => s.estatus === 'fondeada').length
  const aprobadas = solicitudes.filter(s => ['aprobada', 'fondeada'].includes(s.estatus)).length

  // Por banco
  const porBanco: Record<string, { nombre: string; color: string; monto: number; total: number }> = {}
  solicitudes.forEach(s => {
    if (!porBanco[s.banco_nombre]) porBanco[s.banco_nombre] = { nombre: s.banco_nombre, color: s.banco_color, monto: 0, total: 0 }
    porBanco[s.banco_nombre].monto += s.monto_financiar || 0
    porBanco[s.banco_nombre].total++
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
            <p className="text-slate-500 text-xs">Análisis financiero del negocio</p>
          </div>
        </div>
        <Select value={periodo} onValueChange={v => setPeriodo(v as typeof periodo)}>
          <SelectTrigger className="w-40 bg-white border-slate-200">
            <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Por semana</SelectItem>
            <SelectItem value="mes">Por mes</SelectItem>
            <SelectItem value="anio">Por año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Cartera', value: formatMoney(totalMonto), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Solicitudes Aprobadas', value: `${aprobadas} / ${solicitudes.length}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Créditos Fondeados', value: fondeadas, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Comisiones Cobradas', value: formatMoney(totalComisiones), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">{kpi.label}</p>
                    <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Gráfica principal */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Solicitudes y Montos por {periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Año'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataAgrupada.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dataAgrupada} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [
                    name === 'monto' ? formatMoney(Number(v)) : v,
                    name === 'monto' ? 'Monto' : name === 'solicitudes' ? 'Solicitudes' : 'Aprobadas',
                  ]}
                />
                <Legend
                  formatter={(value) => value === 'solicitudes' ? 'Solicitudes' : value === 'aprobadas' ? 'Aprobadas' : 'Monto'}
                />
                <Bar yAxisId="left" dataKey="solicitudes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="aprobadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="monto" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Por banco */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Cartera por Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(porBanco).map(b => {
              const pct = totalMonto > 0 ? (b.monto / totalMonto) * 100 : 0
              return (
                <div key={b.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                      <span className="text-sm font-medium text-slate-700">{b.nombre}</span>
                      <span className="text-xs text-slate-400">{b.total} solicitudes</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatMoney(b.monto)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: b.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 text-right">{pct.toFixed(1)}%</p>
                </div>
              )
            })}
            {Object.keys(porBanco).length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Sin datos aún</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
