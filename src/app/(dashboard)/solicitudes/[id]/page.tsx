import { createClient } from '@/lib/supabase/server'
import { SolicitudDetalleClient } from './solicitud-detalle-client'
import { notFound } from 'next/navigation'

export default async function SolicitudDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: solicitud }, { data: historial }] = await Promise.all([
    supabase.from('solicitudes_completas').select('*').eq('id', id).single(),
    supabase.from('solicitud_historial').select('*').eq('solicitud_id', id).order('created_at', { ascending: false }),
  ])

  if (!solicitud) notFound()

  return <SolicitudDetalleClient solicitud={solicitud} historial={historial || []} />
}
