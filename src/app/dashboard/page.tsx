import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: manager } = await supabase.from('managers').select('*, branches(name)').eq('user_id', user!.id).single()

  const branchId = manager?.branch_id
  const isSuperAdmin = manager?.is_super_admin ?? false
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Stat cards
  const [families, volunteers, deliveries, activities] = await Promise.all([
    supabase.from('families').select('family_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? ''),
    supabase.from('volunteers').select('volunteer_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? ''),
    supabase.from('deliveries').select('address_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? ''),
    supabase.from('activities').select('activity_id', { count: 'exact', head: true }).eq('branch_id', branchId ?? '').eq('status', 'upcoming'),
  ])

  // Today's coordinations
  const todayQuery = supabase
    .from('coordinations')
    .select('id, scheduled_time, address, volunteers(name)')
    .eq('date', today)
    .order('scheduled_time')
  if (!isSuperAdmin && branchId) todayQuery.eq('branch_id', branchId)
  const { data: todayCoordinations } = await todayQuery

  // Upcoming activities without any volunteer assigned (next 7 days)
  const activitiesQuery = supabase
    .from('activities')
    .select('activity_id, date, activity_types(type_name), activity_volunteers(volunteer_id), branches(name)')
    .eq('status', 'upcoming')
    .gte('date', today)
    .lte('date', nextWeek)
    .order('date')
  if (!isSuperAdmin && branchId) activitiesQuery.eq('branch_id', branchId)
  const { data: upcomingActivities } = await activitiesQuery
  const unassignedActivities = (upcomingActivities ?? []).filter(a =>
    (a.activity_volunteers as { volunteer_id: string }[]).length === 0
  )

  // Upcoming coordinations missing a volunteer
  const missingQuery = supabase
    .from('coordinations')
    .select('id, date, scheduled_time, address, branches(name)')
    .gte('date', today)
    .is('volunteer_id', null)
    .order('date')
    .order('scheduled_time')
    .limit(5)
  if (!isSuperAdmin && branchId) missingQuery.eq('branch_id', branchId)
  const { data: missingVolunteer } = await missingQuery

  const stats = [
    { label: 'משפחות', value: families.count ?? 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'מתנדבים', value: volunteers.count ?? 0, color: 'bg-green-50 text-green-700' },
    { label: 'משלוחים', value: deliveries.count ?? 0, color: 'bg-orange-50 text-orange-700' },
    { label: 'פעילויות קרובות', value: activities.count ?? 0, color: 'bg-purple-50 text-purple-700' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isSuperAdmin ? 'סקירה כללית — כל הסניפים' : `סניף ${manager?.branches?.name ?? ''}`}
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

      {/* Today's coordinations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">משלוחים להיום</h3>
          <Link href="/dashboard/deliveries" className="text-sm text-blue-600 hover:underline">לכל המשלוחים ←</Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {!todayCoordinations?.length ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">אין משלוחים מתוזמנים להיום</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['שעה', 'כתובת', 'מתנדב'].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayCoordinations.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{(c.scheduled_time as string).slice(0, 5)}</td>
                    <td className="px-4 py-3 text-gray-800">{c.address}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {(c.volunteers as unknown as { name: string } | null)?.name ?? (
                        <span className="text-red-400 text-xs font-medium">ללא שיבוץ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Upcoming activities without volunteers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800">פעילויות ללא שיבוץ <span className="text-sm font-normal text-gray-400">(7 ימים)</span></h3>
            <Link href="/dashboard/activity-assignments" className="text-sm text-blue-600 hover:underline">לשיבוץ ←</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {unassignedActivities.length === 0 ? (
              <p className="px-4 py-6 text-sm text-green-600 text-center font-medium">✓ כל הפעילויות מכוסות</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {unassignedActivities.map(a => (
                  <li key={a.activity_id} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-800">
                      {(a.activity_types as unknown as { type_name: string } | null)?.type_name ?? '—'}
                    </span>
                    <span className="text-xs text-gray-400">{a.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Coordinations missing a volunteer */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800">תיאומים ללא מתנדב</h3>
            <Link href="/dashboard/deliveries" className="text-sm text-blue-600 hover:underline">לתיאום ←</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {!missingVolunteer?.length ? (
              <p className="px-4 py-6 text-sm text-green-600 text-center font-medium">✓ כל התיאומים מכוסים</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {missingVolunteer.map(c => (
                  <li key={c.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-800 truncate">{c.address}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{c.date} {(c.scheduled_time as string).slice(0, 5)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
