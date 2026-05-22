'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Car } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Unidad } from '@/types/database'

export function EditarUnidadClient({ unidad }: { unidad: Unidad }) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    marca: unidad.marca ?? '',
    modelo: unidad.modelo ?? '',
    anio: String(unidad.anio ?? ''),
    version: unidad.version ?? '',
    color: unidad.color ?? '',
    numero_serie: unidad.numero_serie ?? '',
    numero_motor: unidad.numero_motor ?? '',
    placas: unidad.placas ?? '',
    precio: String(unidad.precio ?? ''),
    precio_lista: unidad.precio_lista ? String(unidad.precio_lista) : '',
    tipo: unidad.tipo ?? 'nuevo',
    transmision: unidad.transmision ?? '',
    combustible: unidad.combustible ?? 'gasolina',
    kilometraje: String(unidad.kilometraje ?? 0),
    estatus: unidad.estatus ?? 'disponible',
    notas: unidad.notas ?? '',
  })

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.marca || !form.modelo || !form.anio || !form.precio) {
      toast.error('Marca, modelo, año y precio son requeridos')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('unidades').update({
      marca: form.marca,
      modelo: form.modelo,
      anio: parseInt(form.anio),
      version: form.version || null,
      color: form.color || null,
      numero_serie: form.numero_serie || null,
      numero_motor: form.numero_motor || null,
      placas: form.placas || null,
      precio: parseFloat(form.precio),
      precio_lista: form.precio_lista ? parseFloat(form.precio_lista) : null,
      tipo: form.tipo,
      transmision: form.transmision || null,
      combustible: form.combustible,
      kilometraje: parseInt(form.kilometraje) || 0,
      estatus: form.estatus,
      notas: form.notas || null,
    }).eq('id', unidad.id)

    if (error) {
      toast.error('Error al guardar: ' + error.message)
      setLoading(false)
      return
    }
    toast.success('Unidad actualizada')
    router.push(`/unidades/${unidad.id}`)
    router.refresh()
  }

  const field = (id: string, label: string, type = 'text', required = false, placeholder = '') => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={(form as Record<string, string>)[id]}
        onChange={e => handleChange(id, e.target.value)}
        required={required}
        className="bg-white border-slate-200"
      />
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/unidades/${unidad.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50">
            <Car className="w-5 h-5 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Editar Unidad</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Información del Vehículo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {field('marca', 'Marca', 'text', true)}
            {field('modelo', 'Modelo', 'text', true)}
            {field('anio', 'Año', 'number', true)}
            {field('version', 'Versión / Trim')}
            {field('color', 'Color')}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => handleChange('tipo', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="seminuevo">Seminuevo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Transmisión</Label>
              <Select value={form.transmision} onValueChange={v => handleChange('transmision', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatica">Automática</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Combustible</Label>
              <Select value={form.combustible} onValueChange={v => handleChange('combustible', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diésel</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="electrico">Eléctrico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field('kilometraje', 'Kilometraje', 'number')}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Estatus</Label>
              <Select value={form.estatus} onValueChange={v => handleChange('estatus', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="apartada">Apartada</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="vendida">Vendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Identificación y Precios</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {field('numero_serie', 'Número de Serie (VIN)')}
            {field('numero_motor', 'Número de Motor')}
            {field('placas', 'Placas')}
            {field('precio', 'Precio de Venta ($)', 'number', true)}
            {field('precio_lista', 'Precio de Lista ($)', 'number')}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Notas</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.notas}
              onChange={e => handleChange('notas', e.target.value)}
              placeholder="Observaciones, equipamiento especial, estado general..."
              className="bg-white border-slate-200 resize-none" rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href={`/unidades/${unidad.id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-36">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
