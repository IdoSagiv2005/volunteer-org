import { createClient } from '@/lib/supabase/server'
import ManagersClient from './ManagersClient'
import { redirect } from 'next/navigation'

export default async function ManagersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('managers').select('is_super_admin').eq('user_id', user!.id).single()
  if (!me?.is_super_admin) redirect('/dashboard')

  const [{ data: managers }, { data: branches }] = await Promise.all([
    supabase.from('managers').select('*, branches(name)').order('name'),
    supabase.from('branches').select('*').order('name'),
  ])

  return <ManagersClient managers={managers ?? []} branches={branches ?? []} />
}
