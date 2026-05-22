'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Car, Plus, Search, ChevronRight, Hash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatMoney, ESTATUS_UNIDAD_LABELS, ESTATUS_UNIDAD_COLORS } from '@/lib/utils'
import type { Unidad } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function UnidadesClient({ unidades }: { unidades: Unidad[] }) {
  const [search, setSearch] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('todos')

  const filtered = unidades.filter(u => {
    const text = `${u.marca} ${u.modelo} ${u.anio} ${u.version || ''} ${u.numero_serie || ''}`.toLowerCase()
    const matchSearch = !search || text.includes(search.toLowerCase())
    const matchEstatus = filtroEstatus === 'todos' || u.estatus === filtroEstatus
    return matchSearch && matchEstatus
  })

  const disponibles = unidades.filter(u => u.estatus === 'disponible').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50">
            <Car className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Unidades</h1>
            <p className="text-slate-500 text-xs">{disponibles} disponibles de {unidades.length} registradas</p>
          </div>
        </div>
        <Link href="/unidades/nueva">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nueva Unidad
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por marca, modelo, año o N° de serie..."
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
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="apartada">Apartada</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="vendida">Vendida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-slate-100">
              <Car className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                {search || filtroEstatus !== 'todos' ? 'Sin resultados' : 'No hay unidades registradas'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {search ? 'Prueba con otros términos' : 'Registra tu primer vehículo'}
              </p>
            </div>
            {!search && filtroEstatus === 'todos' && (
              <Link href="/unidades/nueva">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 mt-1">
                  <Plus className="w-3.5 h-3.5" /> Registrar Unidad
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(unidad => (
            <Link key={unidad.id} href={`/unidades/${unidad.id}`}>
              <Card className="border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  {/* Top */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100">
                      <Car className="w-5 h-5 text-slate-600" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${ESTATUS_UNIDAD_COLORS[unidad.estatus]}`}
                    >
                      {ESTATUS_UNIDAD_LABELS[unidad.estatus]}
                    </Badge>
                  </div>

                  {/* Vehicle info */}
                  <div className="space-y-1 mb-3">
                    <p className="font-bold text-slate-900">
                      {unidad.marca} {unidad.modelo}
                    </p>
                    <p className="text-sm text-slate-500">
                      {unidad.anio}{unidad.version ? ` · ${unidad.version}` : ''}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="text-xl font-bold text-blue-600 mb-3">
                    {formatMoney(unidad.precio)}
                  </p>

                  {/* Serie */}
                  {unidad.numero_serie && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono truncate">{unidad.numero_serie}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
