'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Cliente } from '@/types/database'

export function EditarClienteClient({ cliente }: { cliente: Cliente }) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nombre: cliente.nombre ?? '',
    apellido_paterno: cliente.apellido_paterno ?? '',
    apellido_materno: cliente.apellido_materno ?? '',
    curp: cliente.curp ?? '',
    rfc: cliente.rfc ?? '',
    nss: cliente.nss ?? '',
    fecha_nacimiento: cliente.fecha_nacimiento ?? '',
    telefono: cliente.telefono ?? '',
    telefono_alternativo: cliente.telefono_alternativo ?? '',
    email: cliente.email ?? '',
    estado_civil: cliente.estado_civil ?? '',
    domicilio: cliente.domicilio ?? '',
    colonia: cliente.colonia ?? '',
    ciudad: cliente.ciudad ?? '',
    estado: cliente.estado ?? '',
    cp: cliente.cp ?? '',
    ocupacion: cliente.ocupacion ?? '',
    empresa: cliente.empresa ?? '',
    ingreso_mensual: cliente.ingreso_mensual ? String(cliente.ingreso_mensual) : '',
    antiguedad_laboral: cliente.antiguedad_laboral ?? '',
    tipo_empleado: cliente.tipo_empleado ?? '',
    notas: cliente.notas ?? '',
  })

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.apellido_paterno) {
      toast.error('Nombre y apellido paterno son requeridos')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('clientes').update({
      nombre: form.nombre,
      apellido_paterno: form.apellido_paterno,
      apellido_materno: form.apellido_materno || null,
      curp: form.curp || null,
      rfc: form.rfc || null,
      nss: form.nss || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      telefono: form.telefono || null,
      telefono_alternativo: form.telefono_alternativo || null,
      email: form.email || null,
      estado_civil: form.estado_civil || null,
      domicilio: form.domicilio || null,
      colonia: form.colonia || null,
      ciudad: form.ciudad || null,
      estado: form.estado || null,
      cp: form.cp || null,
      ocupacion: form.ocupacion || null,
      empresa: form.empresa || null,
      ingreso_mensual: form.ingreso_mensual ? parseFloat(form.ingreso_mensual) : null,
      antiguedad_laboral: form.antiguedad_laboral || null,
      tipo_empleado: form.tipo_empleado || null,
      notas: form.notas || null,
    }).eq('id', cliente.id)

    if (error) {
      toast.error('Error al guardar: ' + error.message)
      setLoading(false)
      return
    }
    toast.success('Cliente actualizado')
    router.push(`/clientes/${cliente.id}`)
    router.refresh()
  }

  const field = (id: string, label: string, type = 'text', required = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={(form as Record<string, string>)[id]}
        onChange={e => handleChange(id, e.target.value)}
        required={required}
        className="bg-white border-slate-200 focus:border-blue-400"
      />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${cliente.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Editar Cliente</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {field('nombre', 'Nombre(s)', 'text', true)}
            {field('apellido_paterno', 'Apellido Paterno', 'text', true)}
            {field('apellido_materno', 'Apellido Materno')}
            {field('curp', 'CURP')}
            {field('rfc', 'RFC')}
            {field('nss', 'NSS (Núm. Seguro Social)')}
            {field('fecha_nacimiento', 'Fecha de Nacimiento', 'date')}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Estado Civil</Label>
              <Select value={form.estado_civil} onValueChange={v => handleChange('estado_civil', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Contacto y Domicilio</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {field('telefono', 'Teléfono')}
            {field('telefono_alternativo', 'Teléfono Alternativo')}
            {field('email', 'Correo Electrónico', 'email')}
            {field('domicilio', 'Domicilio (calle y número)')}
            {field('colonia', 'Colonia')}
            {field('ciudad', 'Ciudad')}
            {field('estado', 'Estado')}
            {field('cp', 'C.P.')}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Tipo de Empleado</Label>
              <Select value={form.tipo_empleado} onValueChange={v => handleChange('tipo_empleado', v)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asalariado">Asalariado</SelectItem>
                  <SelectItem value="independiente">Independiente</SelectItem>
                  <SelectItem value="empresario">Empresario</SelectItem>
                  <SelectItem value="pensionado">Pensionado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field('ocupacion', 'Ocupación / Puesto')}
            {field('empresa', 'Empresa')}
            {field('ingreso_mensual', 'Ingreso Mensual ($)', 'number')}
            {field('antiguedad_laboral', 'Antigüedad Laboral')}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.notas}
              onChange={e => handleChange('notas', e.target.value)}
              placeholder="Observaciones, referencias, información adicional..."
              className="bg-white border-slate-200 resize-none"
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href={`/clientes/${cliente.id}`}>
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
