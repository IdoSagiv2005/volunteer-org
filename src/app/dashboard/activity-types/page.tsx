import { createClient } from '@/lib/supabase/server'
import ActivityTypesClient from './ActivityTypesClient'
import { redirect } from 'next/navigation'

export default async function ActivityTypesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('is_super_admin').eq('user_id', user!.id).single()
  if (!manager?.is_super_admin) redirect('/dashboard')

  const { data: types } = await supabase.from('activity_types').select('*').order('type_name')
  return <ActivityTypesClient types={types ?? []} />
}
