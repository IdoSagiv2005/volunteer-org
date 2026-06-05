import { createClient } from '@/lib/supabase/server'
import ActivitiesClient from './ActivitiesClient'

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('branch_id, is_super_admin').eq('user_id', user!.id).single()

  const activitiesQuery = supabase.from('activities').select('*, activity_types(type_name), activity_volunteers(volunteer_id, volunteers(name)), branches(name)').order('date', { ascending: false })
  const volunteersQuery = supabase.from('volunteers').select('volunteer_id, name').order('name')

  if (!manager?.is_super_admin && manager?.branch_id) {
    activitiesQuery.eq('branch_id', manager.branch_id)
    volunteersQuery.eq('branch_id', manager.branch_id)
  }

  const [{ data: activities }, { data: volunteers }, { data: activityTypes }, { data: branches }] = await Promise.all([
    activitiesQuery,
    volunteersQuery,
    supabase.from('activity_types').select('*').order('type_name'),
    supabase.from('branches').select('id, name').order('name'),
  ])

  return <ActivitiesClient activities={activities ?? []} volunteers={volunteers ?? []} activityTypes={activityTypes ?? []} branches={branches ?? []} branchId={manager?.branch_id ?? null} isSuperAdmin={manager?.is_super_admin ?? false} />
}
