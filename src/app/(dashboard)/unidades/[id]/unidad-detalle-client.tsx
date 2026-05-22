'use client'

import Link from 'next/link'
import { ArrowLeft, Car, Hash, DollarSign, FileText, Edit, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatDate, ESTATUS_UNIDAD_LABELS, ESTATUS_UNIDAD_COLORS, ESTATUS_SOLICITUD_LABELS, ESTATUS_SOLICITUD_COLORS } from '@/lib/utils'
import type { Unidad, SolicitudCompleta } from '@/types/database'

interface Props {
  unidad: Unidad
  solicitudes: SolicitudCompleta[]
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{String(value)}</span>
    </div>
  )
}

export function UnidadDetalleClient({ unidad, solicitudes }: Props) {
  const descripcion = `${unidad.marca} ${unidad.modelo} ${unidad.anio}${unidad.version ? ' ' + unidad.version : ''}`

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/unidades">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{descripcion}</h1>
                <Badge variant="secondary" className={ESTATUS_UNIDAD_COLORS[unidad.estatus]}>
                  {ESTATUS_UNIDAD_LABELS[unidad.estatus]}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Registrada el {formatDate(unidad.created_at)}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/unidades/${unidad.id}/editar`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Identificación */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-500" /> Identificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Número de serie" value={unidad.numero_serie} />
            <InfoRow label="Número de motor" value={unidad.numero_motor} />
            <InfoRow label="Placas" value={unidad.placas} />
          </CardContent>
        </Card>

        {/* Precios */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500" /> Precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Precio de venta" value={formatMoney(unidad.precio)} />
            <InfoRow label="Precio de lista" value={unidad.precio_lista ? formatMoney(unidad.precio_lista) : null} />
          </CardContent>
        </Card>

        {/* Características */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" /> Características
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-x-8">
            <InfoRow label="Tipo" value={unidad.tipo} />
            <InfoRow label="Color" value={unidad.color} />
            <InfoRow label="Transmisión" value={unidad.transmision} />
            <InfoRow label="Combustible" value={unidad.combustible} />
            <InfoRow label="Kilometraje" value={unidad.kilometraje ? `${unidad.kilometraje.toLocaleString('es-MX')} km` : null} />
          </CardContent>
        </Card>
      </div>

      {/* Notas */}
      {unidad.notas && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{unidad.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Solicitudes */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" /> Solicitudes ({solicitudes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin solicitudes registradas</p>
          ) : (
            <div className="space-y-2">
              {solicitudes.map(s => (
                <Link key={s.id} href={`/solicitudes/${s.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ background: s.banco_color }} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{s.cliente_nombre}</p>
                        <p className="text-xs text-slate-400">{s.banco_nombre} · {s.folio}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">{formatMoney(s.monto_financiar)}</span>
                      <Badge variant="secondary" className={`text-xs ${ESTATUS_SOLICITUD_COLORS[s.estatus]}`}>
                        {ESTATUS_SOLICITUD_LABELS[s.estatus]}
                      </Badge>
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
