import { createClient } from '@/lib/supabase/server'
import { BancosClient } from './bancos-client'

export default async function BancosPage() {
  const supabase = await createClient()

  const { data: solicitudes } = await supabase
    .from('solicitudes_completas')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: bancos } = await supabase.from('bancos').select('*').eq('activo', true)

  return <BancosClient solicitudes={solicitudes || []} bancos={bancos || []} />
}
