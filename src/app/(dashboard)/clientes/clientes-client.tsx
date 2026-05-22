'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, Phone, Mail, ChevronRight, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate, getNombreCompleto } from '@/lib/utils'
import type { Cliente } from '@/types/database'

export function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const [search, setSearch] = useState('')

  const filtered = clientes.filter(c => {
    const nombre = getNombreCompleto(c).toLowerCase()
    const q = search.toLowerCase()
    return nombre.includes(q) || c.telefono?.includes(q) || c.email?.toLowerCase().includes(q) || c.rfc?.toLowerCase().includes(q)
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-500 text-xs">{clientes.length} clientes registrados</p>
          </div>
        </div>
        <Link href="/clientes/nuevo">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, teléfono, correo o RFC..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-slate-100">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                {search ? 'Sin resultados' : 'No hay clientes aún'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {search ? 'Prueba con otros términos de búsqueda' : 'Agrega tu primer cliente para comenzar'}
              </p>
            </div>
            {!search && (
              <Link href="/clientes/nuevo">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 mt-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar Cliente
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(cliente => (
              <Link key={cliente.id} href={`/clientes/${cliente.id}`}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-semibold text-sm">
                      {cliente.nombre[0]}{cliente.apellido_paterno[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                      {getNombreCompleto(cliente)}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {cliente.telefono && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {cliente.telefono}
                        </span>
                      )}
                      {cliente.email && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" /> {cliente.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="flex items-center gap-3 shrink-0">
                    {cliente.ciudad && (
                      <span className="text-xs text-slate-400 hidden md:block">{cliente.ciudad}</span>
                    )}
                    {cliente.tipo_empleado && (
                      <Badge variant="secondary" className="text-xs capitalize hidden sm:flex">
                        {cliente.tipo_empleado}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 hidden lg:block">
                      {formatDate(cliente.created_at)}
                    </span>
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
