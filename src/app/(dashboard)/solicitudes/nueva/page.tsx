'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatMoney, getNombreCompleto } from '@/lib/utils'
import type { Cliente, Unidad, Banco } from '@/types/database'

export default function NuevaSolicitudPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [bancos, setBancos] = useState<Banco[]>([])

  const [form, setForm] = useState({
    cliente_id: '',
    unidad_id: '',
    banco_id: '',
    enganche: '',
    plazo_meses: '48',
    precio_venta: '',
    observaciones: '',
  })

  useEffect(() => {
    async function load() {
      const [{ data: cl }, { data: un }, { data: ba }] = await Promise.all([
        supabase.from('clientes').select('*').eq('activo', true).order('apellido_paterno'),
        supabase.from('unidades').select('*').eq('estatus', 'disponible').order('marca'),
        supabase.from('bancos').select('*').eq('activo', true),
      ])
      setClientes(cl || [])
      setUnidades(un || [])
      setBancos(ba || [])
    }
    load()
  }, [])

  const unidadSeleccionada = unidades.find(u => u.id === form.unidad_id)
  const montoFinanciar = form.precio_venta
    ? parseFloat(form.precio_venta) - (parseFloat(form.enganche) || 0)
    : unidadSeleccionada
    ? unidadSeleccionada.precio - (parseFloat(form.enganche) || 0)
    : 0

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cliente_id || !form.unidad_id || !form.banco_id) {
      toast.error('Cliente, unidad y banco son requeridos')
      return
    }
    setLoading(true)

    const precioVenta = form.precio_venta
      ? parseFloat(form.precio_venta)
      : unidadSeleccionada?.precio || 0

    const { error } = await supabase.from('solicitudes').insert({
      folio: '',
      cliente_id: form.cliente_id,
      unidad_id: form.unidad_id,
      banco_id: form.banco_id,
      precio_venta: precioVenta,
      enganche: parseFloat(form.enganche) || 0,
      plazo_meses: parseInt(form.plazo_meses) || 48,
      observaciones: form.observaciones || undefined,
    })

    if (error) {
      toast.error('Error: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Solicitud creada correctamente')
    router.push('/solicitudes')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/solicitudes">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Nueva Solicitud de Crédito</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Datos de la Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente */}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Cliente <span className="text-red-500">*</span></Label>
              <Select onValueChange={v => handleChange('cliente_id', v)}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{getNombreCompleto(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unidad */}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Unidad / Vehículo <span className="text-red-500">*</span></Label>
              <Select onValueChange={v => handleChange('unidad_id', v)}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Seleccionar vehículo disponible..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.marca} {u.modelo} {u.anio} — {formatMoney(u.precio)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Banco */}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Banco <span className="text-red-500">*</span></Label>
              <Select onValueChange={v => handleChange('banco_id', v)}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Seleccionar banco..." />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Condiciones del Crédito</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Precio de Venta ($)</Label>
              <Input
                type="number"
                placeholder={unidadSeleccionada ? formatMoney(unidadSeleccionada.precio) : 'Auto del vehículo'}
                value={form.precio_venta}
                onChange={e => handleChange('precio_venta', e.target.value)}
                className="bg-white border-slate-200"
              />
              {unidadSeleccionada && !form.precio_venta && (
                <p className="text-xs text-slate-400">Se usará: {formatMoney(unidadSeleccionada.precio)}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Enganche ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.enganche}
                onChange={e => handleChange('enganche', e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Plazo (meses)</Label>
              <Select value={form.plazo_meses} onValueChange={v => handleChange('plazo_meses', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[12, 24, 36, 48, 60, 72, 84].map(p => (
                    <SelectItem key={p} value={String(p)}>{p} meses</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Monto a financiar */}
            {montoFinanciar > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-500">Monto a Financiar</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-blue-50 border border-blue-200">
                  <span className="text-blue-700 font-semibold text-sm">{formatMoney(montoFinanciar)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Observaciones</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.observaciones}
              onChange={e => handleChange('observaciones', e.target.value)}
              placeholder="Notas sobre la solicitud, condiciones especiales, documentación pendiente..."
              className="bg-white border-slate-200 resize-none" rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/solicitudes"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-36">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creando...</> : 'Crear Solicitud'}
          </Button>
        </div>
      </form>
    </div>
  )
}
