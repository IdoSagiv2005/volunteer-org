import { createClient } from '@/lib/supabase/server'
import DeliveriesClient from './DeliveriesClient'

export default async function DeliveriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('branch_id, is_super_admin').eq('user_id', user!.id).single()

  const deliveriesQuery = supabase.from('deliveries').select('*, families(full_name)').order('created_at', { ascending: false })
  const familiesQuery = supabase.from('families').select('family_id, full_name').order('full_name')

  if (!manager?.is_super_admin && manager?.branch_id) {
    deliveriesQuery.eq('branch_id', manager.branch_id)
    familiesQuery.eq('branch_id', manager.branch_id)
  }

  const [{ data: deliveries }, { data: families }] = await Promise.all([deliveriesQuery, familiesQuery])

  return <DeliveriesClient deliveries={deliveries ?? []} families={families ?? []} branchId={manager?.branch_id ?? null} isSuperAdmin={manager?.is_super_admin ?? false} />
}
