import { createClient } from '@/lib/supabase/server'
import VolunteersClient from './VolunteersClient'

export default async function VolunteersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('branch_id, is_super_admin').eq('user_id', user!.id).single()

  const query = supabase.from('volunteers').select('*').order('name')
  if (!manager?.is_super_admin && manager?.branch_id) query.eq('branch_id', manager.branch_id)
  const { data: volunteers } = await query

  return <VolunteersClient volunteers={volunteers ?? []} branchId={manager?.branch_id ?? null} isSuperAdmin={manager?.is_super_admin ?? false} />
}
