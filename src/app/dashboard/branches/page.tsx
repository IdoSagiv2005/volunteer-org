import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BranchesClient from './BranchesClient'

export default async function BranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('is_super_admin').eq('user_id', user!.id).single()
  if (!manager?.is_super_admin) redirect('/dashboard')

  const { data: branches } = await supabase
    .from('branches')
    .select('*, managers(name, email, phone)')
    .order('name')

  return <BranchesClient branches={branches ?? []} />
}
