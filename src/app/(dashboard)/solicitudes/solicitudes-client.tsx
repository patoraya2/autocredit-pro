'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, ChevronRight, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  formatMoney, formatDate,
  ESTATUS_SOLICITUD_LABELS, ESTATUS_SOLICITUD_COLORS,
} from '@/lib/utils'
import type { SolicitudCompleta, Banco } from '@/types/database'

interface Props {
  solicitudes: SolicitudCompleta[]
  bancos: Banco[]
}

export function SolicitudesClient({ solicitudes, bancos }: Props) {
  const [search, setSearch] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('todos')
  const [filtroBanco, setFiltroBanco] = useState('todos')

  const filtered = solicitudes.filter(s => {
    const text = `${s.folio} ${s.cliente_nombre} ${s.unidad_descripcion}`.toLowerCase()
    const matchSearch = !search || text.includes(search.toLowerCase())
    const matchEstatus = filtroEstatus === 'todos' || s.estatus === filtroEstatus
    const matchBanco = filtroBanco === 'todos' || s.banco_id === filtroBanco
    return matchSearch && matchEstatus && matchBanco
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Solicitudes</h1>
            <p className="text-slate-500 text-xs">{solicitudes.length} solicitudes en total</p>
          </div>
        </div>
        <Link href="/solicitudes/nueva">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nueva Solicitud
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por folio, cliente o unidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <Select value={filtroEstatus} onValueChange={setFiltroEstatus}>
          <SelectTrigger className="w-44 bg-white border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {Object.entries(ESTATUS_SOLICITUD_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroBanco} onValueChange={setFiltroBanco}>
          <SelectTrigger className="w-40 bg-white border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los bancos</SelectItem>
            {bancos.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-slate-100">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                {search || filtroEstatus !== 'todos' || filtroBanco !== 'todos'
                  ? 'Sin resultados para esos filtros'
                  : 'No hay solicitudes aún'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {!search && filtroEstatus === 'todos' && filtroBanco === 'todos'
                  ? 'Crea tu primera solicitud de crédito'
                  : 'Prueba ajustando los filtros'}
              </p>
            </div>
            {!search && filtroEstatus === 'todos' && filtroBanco === 'todos' && (
              <Link href="/solicitudes/nueva">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 mt-1">
                  <Plus className="w-3.5 h-3.5" /> Crear Solicitud
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="col-span-1">Folio</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-3">Vehículo</div>
            <div className="col-span-2">Banco</div>
            <div className="col-span-1 text-right">Monto</div>
            <div className="col-span-1 text-center">Estado</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map(sol => (
              <Link key={sol.id} href={`/solicitudes/${sol.id}`}>
                <div className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors group">
                  <div className="col-span-12 md:col-span-1">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {sol.folio}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{sol.cliente_nombre}</p>
                    <p className="text-xs text-slate-400">{formatDate(sol.created_at)}</p>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <p className="text-sm text-slate-700 truncate">{sol.unidad_descripcion}</p>
                    {sol.numero_serie && (
                      <p className="text-xs text-slate-400 font-mono truncate">{sol.numero_serie}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: sol.banco_color }}
                    />
                    <span className="text-sm text-slate-600">{sol.banco_nombre}</span>
                  </div>
                  <div className="col-span-12 md:col-span-1 text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(sol.monto_financiar)}</p>
                  </div>
                  <div className="col-span-11 md:col-span-1 flex justify-center">
                    <Badge variant="secondary" className={`text-xs ${ESTATUS_SOLICITUD_COLORS[sol.estatus]}`}>
                      {ESTATUS_SOLICITUD_LABELS[sol.estatus]}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
