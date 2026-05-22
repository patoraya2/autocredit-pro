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

export default function NuevaUnidadPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    marca: '', modelo: '', anio: '', version: '', color: '',
    numero_serie: '', numero_motor: '', placas: '',
    precio: '', precio_lista: '', tipo: 'nuevo',
    transmision: '', combustible: 'gasolina', kilometraje: '0', notas: '',
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
    const { error } = await supabase.from('unidades').insert({
      marca: form.marca,
      modelo: form.modelo,
      anio: parseInt(form.anio),
      version: form.version || undefined,
      color: form.color || undefined,
      numero_serie: form.numero_serie || undefined,
      numero_motor: form.numero_motor || undefined,
      placas: form.placas || undefined,
      precio: parseFloat(form.precio),
      precio_lista: form.precio_lista ? parseFloat(form.precio_lista) : undefined,
      tipo: form.tipo,
      transmision: form.transmision || undefined,
      combustible: form.combustible,
      kilometraje: parseInt(form.kilometraje) || 0,
      notas: form.notas || undefined,
    })
    if (error) {
      toast.error('Error: ' + error.message)
      setLoading(false)
      return
    }
    toast.success('Unidad registrada correctamente')
    router.push('/unidades')
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
        <Link href="/unidades">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50">
            <Car className="w-5 h-5 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Nueva Unidad</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Información del Vehículo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {field('marca', 'Marca', 'text', true, 'Ford, Chevrolet...')}
            {field('modelo', 'Modelo', 'text', true, 'Lobo, Suburban...')}
            {field('anio', 'Año', 'number', true, '2024')}
            {field('version', 'Versión / Trim', 'text', false, 'Platinum, XLT...')}
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
              <Select onValueChange={v => handleChange('transmision', v)}>
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
            {field('kilometraje', 'Kilometraje', 'number', false, '0')}
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
            {field('precio', 'Precio de Venta ($)', 'number', true, '500000')}
            {field('precio_lista', 'Precio de Lista ($)', 'number', false, 'opcional')}
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
          <Link href="/unidades"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-36">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar Unidad'}
          </Button>
        </div>
      </form>
    </div>
  )
}
