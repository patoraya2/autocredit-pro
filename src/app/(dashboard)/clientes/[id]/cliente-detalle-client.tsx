'use client'

import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, FileText, User, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatDate, getNombreCompleto, ESTATUS_SOLICITUD_LABELS, ESTATUS_SOLICITUD_COLORS } from '@/lib/utils'
import type { Cliente, SolicitudCompleta } from '@/types/database'

interface Props {
  cliente: Cliente
  solicitudes: SolicitudCompleta[]
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right max-w-[60%]">{String(value)}</span>
    </div>
  )
}

export function ClienteDetalleClient({ cliente, solicitudes }: Props) {
  const nombreCompleto = getNombreCompleto(cliente)
  const initials = [cliente.nombre[0], cliente.apellido_paterno[0]].join('').toUpperCase()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{nombreCompleto}</h1>
              <p className="text-xs text-slate-400">
                Cliente desde {formatDate(cliente.created_at)}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/clientes/${cliente.id}/editar`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Datos personales */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="RFC" value={cliente.rfc} />
            <InfoRow label="CURP" value={cliente.curp} />
            <InfoRow label="NSS" value={cliente.nss} />
            <InfoRow label="Fecha de nacimiento" value={cliente.fecha_nacimiento ? formatDate(cliente.fecha_nacimiento) : null} />
            <InfoRow label="Estado civil" value={cliente.estado_civil} />
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" /> Contacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Celular" value={cliente.telefono} />
            <InfoRow label="Tel. alternativo" value={cliente.telefono_alternativo} />
            <InfoRow label="Correo" value={cliente.email} />
          </CardContent>
        </Card>

        {/* Domicilio */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" /> Domicilio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Calle y número" value={cliente.domicilio} />
            <InfoRow label="Colonia" value={cliente.colonia} />
            <InfoRow label="Ciudad" value={cliente.ciudad} />
            <InfoRow label="Estado" value={cliente.estado} />
            <InfoRow label="C.P." value={cliente.cp} />
          </CardContent>
        </Card>

        {/* Información laboral */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" /> Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Empresa" value={cliente.empresa} />
            <InfoRow label="Puesto" value={cliente.ocupacion} />
            <InfoRow label="Ingreso mensual" value={cliente.ingreso_mensual ? formatMoney(cliente.ingreso_mensual) : null} />
            <InfoRow label="Tipo de empleado" value={cliente.tipo_empleado} />
            <InfoRow label="Antigüedad" value={cliente.antiguedad_laboral} />
          </CardContent>
        </Card>
      </div>

      {/* Notas */}
      {cliente.notas && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{cliente.notas}</p>
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
                        <p className="text-sm font-medium text-slate-900">{s.unidad_descripcion}</p>
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
