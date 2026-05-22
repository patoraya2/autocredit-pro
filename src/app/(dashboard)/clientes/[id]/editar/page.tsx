import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditarClienteClient } from './editar-cliente-client'

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (!cliente) notFound()
  return <EditarClienteClient cliente={cliente} />
}
