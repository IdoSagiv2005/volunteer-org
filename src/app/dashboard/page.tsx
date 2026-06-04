import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: manager } = await supabase
    .from('managers')
    .select('*, branches(name)')
    .eq('user_id', user!.id)
    .single()

  const branchId = manager?.branch_id

  const [families, volunteers, deliveries, activities] = await Promise.all([
    supabase.from('families').select('family_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? ''),
    supabase.from('volunteers').select('volunteer_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? ''),
    supabase.from('deliveries').select('address_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? ''),
    supabase.from('activities').select('activity_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? '').eq('status', 'upcoming'),
  ])

  const stats = [
    { label: 'משפחות', value: families.count ?? 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'מתנדבים', value: volunteers.count ?? 0, color: 'bg-green-50 text-green-700' },
    { label: 'משלוחים', value: deliveries.count ?? 0, color: 'bg-orange-50 text-orange-700' },
    { label: 'פעילויות קרובות', value: activities.count ?? 0, color: 'bg-purple-50 text-purple-700' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {manager?.is_super_admin ? 'סקירה כללית — כל הסניפים' : `סניף ${manager?.branches?.name ?? ''}`}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-5 ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
