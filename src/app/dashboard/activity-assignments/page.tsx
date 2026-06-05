import { createClient } from '@/lib/supabase/server'
import ActivityAssignmentsClient from './ActivityAssignmentsClient'

export default async function ActivityAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('branch_id, is_super_admin').eq('user_id', user!.id).single()

  const activitiesQuery = supabase
    .from('activities')
    .select('*, activity_types(type_name), branches(name), activity_volunteers(volunteer_id, volunteers(name))')
    .order('date', { ascending: false })

  const volunteersQuery = supabase.from('volunteers').select('volunteer_id, name, skills').order('name')
  const availabilityQuery = supabase.from('volunteer_availability').select('volunteer_id, date')

  if (!manager?.is_super_admin && manager?.branch_id) {
    activitiesQuery.eq('branch_id', manager.branch_id)
    volunteersQuery.eq('branch_id', manager.branch_id)
    availabilityQuery.eq('branch_id', manager.branch_id)
  }

  const [{ data: activities }, { data: volunteers }, { data: availability }] = await Promise.all([
    activitiesQuery,
    volunteersQuery,
    availabilityQuery,
  ])

  return (
    <ActivityAssignmentsClient
      activities={activities ?? []}
      volunteers={volunteers ?? []}
      availability={availability ?? []}
      isSuperAdmin={manager?.is_super_admin ?? false}
    />
  )
}
