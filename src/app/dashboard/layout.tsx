import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: manager } = await supabase
    .from('managers')
    .select('*, branches(name)')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar manager={manager} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
