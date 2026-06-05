import { createClient } from '@/lib/supabase/server'
import ActivityTypesClient from './ActivityTypesClient'

export default async function ActivityTypesPage() {
  const supabase = await createClient()
  const { data: types } = await supabase.from('activity_types').select('*').order('type_name')
  return <ActivityTypesClient types={types ?? []} />
}
