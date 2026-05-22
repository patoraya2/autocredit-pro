import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const [
    { count: totalClientes },
    { count: totalUnidades },
    { count: totalSolicitudes },
    { data: solicitudesRecientes },
    { data: solicitudesPorEstatus },
    { data: solicitudesPorBanco },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('unidades').select('*', { count: 'exact', head: true }).eq('estatus', 'disponible'),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }),
    supabase.from('solicitudes_completas').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('solicitudes').select('estatus').then(({ data }: { data: Array<{ estatus: string }> | null }) => {
      const counts: Record<string, number> = {}
      data?.forEach(s => { counts[s.estatus] = (counts[s.estatus] || 0) + 1 })
      return { data: Object.entries(counts).map(([estatus, total]) => ({ estatus, total })) }
    }),
    supabase.from('solicitudes_completas').select('banco_nombre, banco_color, monto_financiar').then(
      ({ data }: { data: Array<{ banco_nombre: string; banco_color: string; monto_financiar: number }> | null }) => {
        const bancos: Record<string, { nombre: string; color: string; total: number; monto: number }> = {}
        data?.forEach(s => {
          if (!bancos[s.banco_nombre]) bancos[s.banco_nombre] = { nombre: s.banco_nombre, color: s.banco_color, total: 0, monto: 0 }
          bancos[s.banco_nombre].total++
          bancos[s.banco_nombre].monto += s.monto_financiar || 0
        })
        return { data: Object.values(bancos) }
      }
    ),
  ])

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const { data: comisionesMes } = await supabase
    .from('solicitudes')
    .select('comision')
    .eq('comision_pagada', true)
    .gte('fecha_pago_comision', inicioMes.slice(0, 10))

  const totalComisionesMes = (comisionesMes as Array<{ comision: number }> | null)
    ?.reduce((sum, s) => sum + (s.comision || 0), 0) || 0

  return (
    <DashboardClient
      stats={{
        totalClientes: totalClientes || 0,
        totalUnidades: totalUnidades || 0,
        totalSolicitudes: totalSolicitudes || 0,
        comisionesMes: totalComisionesMes,
      }}
      solicitudesRecientes={solicitudesRecientes || []}
      solicitudesPorEstatus={solicitudesPorEstatus || []}
      solicitudesPorBanco={solicitudesPorBanco || []}
    />
  )
}
