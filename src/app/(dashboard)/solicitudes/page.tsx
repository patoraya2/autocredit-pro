import { createClient } from '@/lib/supabase/server'
import { SolicitudesClient } from './solicitudes-client'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: solicitudes } = await supabase
    .from('solicitudes_completas')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: bancos } = await supabase.from('bancos').select('*').eq('activo', true)

  return <SolicitudesClient solicitudes={solicitudes || []} bancos={bancos || []} />
}
