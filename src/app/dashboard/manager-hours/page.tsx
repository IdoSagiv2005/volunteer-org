import { createClient } from '@/lib/supabase/server'
import ManagerHoursClient from './ManagerHoursClient'

export default async function ManagerHoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('id, branch_id, name, is_super_admin').eq('user_id', user!.id).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hours: any[] = []
  let allManagers: { id: string; name: string; branches: { name: string } | null }[] = []

  if (manager?.is_super_admin) {
    const { data } = await supabase
      .from('manager_hours')
      .select('*, managers(name, branches(name))')
      .order('date', { ascending: false })
    hours = data ?? []

    const { data: mgrs } = await supabase
      .from('managers')
      .select('id, name, branch_id, branches(id, name)')
      .eq('is_super_admin', false)
      .order('name')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allManagers = (mgrs ?? []) as any[]
  } else {
    const { data } = await supabase
      .from('manager_hours')
      .select('*')
      .eq('manager_id', manager?.id)
      .order('date', { ascending: false })
    hours = data ?? []
  }

  return (
    <ManagerHoursClient
      hours={hours ?? []}
      managerId={manager?.id ?? null}
      managerName={manager?.name ?? ''}
      branchId={manager?.branch_id ?? null}
      isSuperAdmin={manager?.is_super_admin ?? false}
      allManagers={allManagers ?? []}
    />
  )
}
