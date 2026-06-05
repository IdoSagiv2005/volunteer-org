import { createClient } from '@/lib/supabase/server'
import DeliveriesTabsClient from './DeliveriesTabsClient'

export default async function DeliveriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('branch_id, is_super_admin').eq('user_id', user!.id).single()

  const deliveriesQuery = supabase.from('deliveries').select('*, families(full_name)').order('created_at', { ascending: false })
  const familiesQuery = supabase.from('families').select('family_id, full_name').order('full_name')
  const coordinationsQuery = supabase.from('coordinations').select('*, volunteers(name)').order('date').order('scheduled_time')
  const volunteersQuery = supabase.from('volunteers').select('volunteer_id, name').order('name')

  if (!manager?.is_super_admin && manager?.branch_id) {
    deliveriesQuery.eq('branch_id', manager.branch_id)
    familiesQuery.eq('branch_id', manager.branch_id)
    coordinationsQuery.eq('branch_id', manager.branch_id)
    volunteersQuery.eq('branch_id', manager.branch_id)
  }

  const messageLogQuery = supabase
    .from('message_log')
    .select('id, volunteer_name, address, photo_sent, sent_at')
    .order('sent_at', { ascending: false })
    .limit(50)
  if (!manager?.is_super_admin && manager?.branch_id) messageLogQuery.eq('branch_id', manager.branch_id)

  const [{ data: deliveries }, { data: families }, { data: coordinations }, { data: volunteers }, { data: messageLog }] = await Promise.all([
    deliveriesQuery,
    familiesQuery,
    coordinationsQuery,
    volunteersQuery,
    messageLogQuery,
  ])

  return (
    <DeliveriesTabsClient
      deliveries={deliveries ?? []}
      families={families ?? []}
      coordinations={coordinations ?? []}
      volunteers={volunteers ?? []}
      messageLog={messageLog ?? []}
      branchId={manager?.branch_id ?? null}
      isSuperAdmin={manager?.is_super_admin ?? false}
    />
  )
}
