import { createClient } from '@/lib/supabase/server'
import { UnidadesClient } from './unidades-client'

export default async function UnidadesPage() {
  const supabase = await createClient()
  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .order('created_at', { ascending: false })

  return <UnidadesClient unidades={unidades || []} />
}
