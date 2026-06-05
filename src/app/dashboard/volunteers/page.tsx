import { createClient } from '@/lib/supabase/server'
import VolunteersTabsClient from './VolunteersTabsClient'

export default async function VolunteersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('branch_id, is_super_admin').eq('user_id', user!.id).single()

  const volunteersQuery = supabase.from('volunteers').select('*, branches(name)').order('name')
  const availabilityQuery = supabase.from('volunteer_availability').select('id, volunteer_id, date').order('date')

  if (!manager?.is_super_admin && manager?.branch_id) {
    volunteersQuery.eq('branch_id', manager.branch_id)
    availabilityQuery.eq('branch_id', manager.branch_id)
  }

  const [{ data: volunteers }, { data: availability }] = await Promise.all([volunteersQuery, availabilityQuery])

  return (
    <VolunteersTabsClient
      volunteers={volunteers ?? []}
      availability={availability ?? []}
      branchId={manager?.branch_id ?? null}
      isSuperAdmin={manager?.is_super_admin ?? false}
    />
  )
}
