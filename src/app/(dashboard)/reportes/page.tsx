import { createClient } from '@/lib/supabase/server'
import { ReportesClient } from './reportes-client'

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: solicitudes } = await supabase
    .from('solicitudes_completas')
    .select('*')
    .order('created_at', { ascending: false })

  return <ReportesClient solicitudes={solicitudes || []} />
}
