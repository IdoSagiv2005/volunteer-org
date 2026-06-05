'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

type Activity = {
  activity_id: string
  type_id: string | null
  date: string
  branch_id: string
  volunteer_id: string | null
  status: 'upcoming' | 'completed'
  activity_types: { type_name: string } | null
  branches: { name: string } | null
}

type Volunteer = { volunteer_id: string; name: string }
type Props = { activities: Activity[]; volunteers: Volunteer[]; isSuperAdmin: boolean }

export default function ActivityAssignmentsClient({ activities: initial, volunteers, isSuperAdmin }: Props) {
  const [activities, setActivities] = useState(initial)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'upcoming'>('upcoming')
  const supabase = createClient()

  const filtered = activities.filter(a => {
    if (filter === 'upcoming') return a.status === 'upcoming'
    if (filter === 'unassigned') return !a.volunteer_id
    return true
  })

  async function handleAssign(activityId: string, volunteerId: string) {
    setSavingId(activityId)
    await supabase
      .from('activities')
      .update({ volunteer_id: volunteerId || null })
      .eq('activity_id', activityId)
    setActivities(prev =>
      prev.map(a => a.activity_id === activityId ? { ...a, volunteer_id: volunteerId || null } : a)
    )
    setSavingId(null)
  }

  const filterLabels = { upcoming: 'עתידיות', unassigned: 'ללא שיבוץ', all: 'הכל' }
  const colSpan = isSuperAdmin ? 5 : 4

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">שיבוץ פעילויות</h2>
        <button
          disabled
          title="בקרוב — שיבוץ אוטומטי על ידי AI"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed select-none"
        >
          <Sparkles size={16} /> שיבוץ אוטומטי
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['upcoming', 'unassigned', 'all'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-sm font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {filterLabels[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[...(isSuperAdmin ? ['סניף'] : []), 'תאריך', 'סוג פעילות', 'סטטוס', 'מתנדב משובץ'].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.activity_id} className="hover:bg-gray-50">
                  {isSuperAdmin && <td className="px-4 py-3 text-gray-600">{a.branches?.name ?? '—'}</td>}
                  <td className="px-4 py-3 text-gray-600">{a.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{a.activity_types?.type_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {a.status === 'upcoming' ? 'עתידי' : 'הושלם'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.volunteer_id ?? ''}
                      onChange={e => handleAssign(a.activity_id, e.target.value)}
                      disabled={savingId === a.activity_id}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[160px]"
                    >
                      <option value="">— ללא שיבוץ —</option>
                      {volunteers.map(v => (
                        <option key={v.volunteer_id} value={v.volunteer_id}>{v.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">אין פעילויות להצגה</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
