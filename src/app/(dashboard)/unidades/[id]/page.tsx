import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { UnidadDetalleClient } from './unidad-detalle-client'

export default async function UnidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const [{ data: unidad }, { data: solicitudes }] = await Promise.all([
    supabase.from('unidades').select('*').eq('id', id).single(),
    supabase
      .from('solicitudes_completas')
      .select('*')
      .eq('unidad_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!unidad) notFound()

  return <UnidadDetalleClient unidad={unidad} solicitudes={solicitudes || []} />
}
