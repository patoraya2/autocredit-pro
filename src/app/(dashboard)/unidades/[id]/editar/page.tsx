import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditarUnidadClient } from './editar-unidad-client'

export default async function EditarUnidadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: unidad } = await supabase.from('unidades').select('*').eq('id', id).single()
  if (!unidad) notFound()
  return <EditarUnidadClient unidad={unidad} />
}
