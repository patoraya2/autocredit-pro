import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClienteDetalleClient } from './cliente-detalle-client'

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const [{ data: cliente }, { data: solicitudes }] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', id).single(),
    supabase
      .from('solicitudes_completas')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!cliente) notFound()

  return <ClienteDetalleClient cliente={cliente} solicitudes={solicitudes || []} />
}
