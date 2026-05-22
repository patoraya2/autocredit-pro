import { createClient } from '@/lib/supabase/server'
import { ClientesClient } from './clientes-client'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return <ClientesClient clientes={clientes || []} />
}
