'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Car, User, Building2, DollarSign, Calendar, Hash, CheckCircle, Clock, Edit, FileDown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatMoney, formatDateTime, ESTATUS_SOLICITUD_LABELS, ESTATUS_SOLICITUD_COLORS } from '@/lib/utils'
import type { SolicitudCompleta, SolicitudHistorial } from '@/types/database'

interface Props {
  solicitud: SolicitudCompleta
  historial: SolicitudHistorial[]
}

const FLUJO_ESTATUS = ['nueva', 'preparando', 'enviada', 'en_revision', 'aprobada', 'fondeada']

export function SolicitudDetalleClient({ solicitud, historial }: Props) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [nuevoEstatus, setNuevoEstatus] = useState('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCambioEstatus, setShowCambioEstatus] = useState(false)

  const currentStep = FLUJO_ESTATUS.indexOf(solicitud.estatus)

  async function actualizarEstatus() {
    if (!nuevoEstatus) return
    setLoading(true)

    const update: Record<string, unknown> = { estatus: nuevoEstatus }
    if (nuevoEstatus === 'enviada') update.fecha_envio = new Date().toISOString()
    if (nuevoEstatus === 'fondeada') update.fecha_fondeo = new Date().toISOString()
    if (['aprobada', 'rechazada'].includes(nuevoEstatus)) update.fecha_respuesta = new Date().toISOString()

    const { error } = await supabase.from('solicitudes').update(update).eq('id', solicitud.id)

    if (nota) {
      await supabase.from('solicitud_historial').insert({
        solicitud_id: solicitud.id,
        estatus_nuevo: nuevoEstatus,
        nota,
      })
    }

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success('Estatus actualizado')
      router.refresh()
      setShowCambioEstatus(false)
      setNota('')
      setNuevoEstatus('')
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/solicitudes">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {solicitud.folio}
              </span>
              <Badge variant="secondary" className={`${ESTATUS_SOLICITUD_COLORS[solicitud.estatus]}`}>
                {ESTATUS_SOLICITUD_LABELS[solicitud.estatus]}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{solicitud.cliente_nombre}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/api/solicitudes/${solicitud.id}/pdf`} download>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileDown className="w-3.5 h-3.5" /> Generar PDF
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCambioEstatus(!showCambioEstatus)}
            className="gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Cambiar Estado
          </Button>
        </div>
      </div>

      {/* Cambio de estatus */}
      {showCambioEstatus && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800">Actualizar Estado de Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select onValueChange={setNuevoEstatus}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Seleccionar nuevo estado..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ESTATUS_SOLICITUD_LABELS)
                  .filter(([v]) => v !== solicitud.estatus)
                  .map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Nota del cambio (opcional)..."
              value={nota}
              onChange={e => setNota(e.target.value)}
              className="bg-white border-slate-200 resize-none text-sm" rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={actualizarEstatus}
                disabled={loading || !nuevoEstatus}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCambioEstatus(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress tracker */}
      {currentStep >= 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {FLUJO_ESTATUS.map((est, i) => (
                <div key={est} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1 ${i <= currentStep ? 'text-blue-600' : 'text-slate-300'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                      ${i < currentStep ? 'bg-blue-600 text-white' : i === currentStep ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                      {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="text-xs hidden sm:block text-center" style={{ maxWidth: 60 }}>
                      {ESTATUS_SOLICITUD_LABELS[est]}
                    </span>
                  </div>
                  {i < FLUJO_ESTATUS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-blue-400' : 'bg-slate-200'}`} style={{ minWidth: 20 }} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cliente */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-slate-900">{solicitud.cliente_nombre}</p>
            {solicitud.cliente_telefono && <p className="text-slate-500">📞 {solicitud.cliente_telefono}</p>}
            {solicitud.cliente_email && <p className="text-slate-500">✉️ {solicitud.cliente_email}</p>}
            <Link href={`/clientes/${solicitud.cliente_id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 px-0 mt-1">
                Ver perfil completo →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Vehículo */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-500" /> Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-slate-900">{solicitud.unidad_descripcion}</p>
            {solicitud.numero_serie && (
              <p className="text-slate-500 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-mono">{solicitud.numero_serie}</span>
              </p>
            )}
            <p className="text-slate-500">Precio lista: {formatMoney(solicitud.unidad_precio)}</p>
          </CardContent>
        </Card>

        {/* Banco */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" /> Banco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 rounded-full" style={{ background: solicitud.banco_color }} />
              <p className="font-medium text-slate-900">{solicitud.banco_nombre}</p>
            </div>
          </CardContent>
        </Card>

        {/* Finanzas */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500" /> Condiciones del Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {([
              { label: 'Precio de Venta', value: formatMoney(solicitud.precio_venta) },
              { label: 'Enganche', value: formatMoney(solicitud.enganche) },
              { label: 'Monto a Financiar', value: formatMoney(solicitud.monto_financiar), highlight: true },
              { label: 'Plazo', value: `${solicitud.plazo_meses} meses` },
              ...(solicitud.pago_mensual ? [{ label: 'Pago Mensual', value: formatMoney(solicitud.pago_mensual) }] : []),
            ] as { label: string; value: string; highlight?: boolean }[]).map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className={`font-semibold ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fechas */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" /> Línea de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Creada', date: solicitud.created_at },
              { label: 'Enviada al banco', date: solicitud.fecha_envio },
              { label: 'Respuesta', date: solicitud.fecha_respuesta },
              { label: 'Fondeada', date: solicitud.fecha_fondeo },
            ].map(item => (
              <div key={item.label} className={`space-y-1 ${!item.date ? 'opacity-40' : ''}`}>
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className="text-slate-700 font-medium text-xs">
                  {item.date ? formatDateTime(item.date) : '—'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      {historial.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Historial de Cambios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historial.map(h => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {h.estatus_anterior && (
                        <>
                          <Badge variant="secondary" className={`text-xs ${ESTATUS_SOLICITUD_COLORS[h.estatus_anterior]}`}>
                            {ESTATUS_SOLICITUD_LABELS[h.estatus_anterior]}
                          </Badge>
                          <span className="text-slate-400">→</span>
                        </>
                      )}
                      <Badge variant="secondary" className={`text-xs ${ESTATUS_SOLICITUD_COLORS[h.estatus_nuevo]}`}>
                        {ESTATUS_SOLICITUD_LABELS[h.estatus_nuevo]}
                      </Badge>
                      <span className="text-slate-400 text-xs ml-auto">{formatDateTime(h.created_at)}</span>
                    </div>
                    {h.nota && <p className="text-slate-500 text-xs mt-0.5">{h.nota}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
