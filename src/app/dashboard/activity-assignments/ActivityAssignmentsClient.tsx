'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Pencil, X } from 'lucide-react'

type ActivityVolunteer = { volunteer_id: string; volunteers: { name: string } | null }
type Activity = {
  activity_id: string
  type_id: string | null
  date: string
  branch_id: string
  status: 'upcoming' | 'completed'
  activity_types: { type_name: string } | null
  branches: { name: string } | null
  activity_volunteers: ActivityVolunteer[]
}

type Volunteer = { volunteer_id: string; name: string }
type Props = { activities: Activity[]; volunteers: Volunteer[]; isSuperAdmin: boolean }

export default function ActivityAssignmentsClient({ activities: initial, volunteers, isSuperAdmin }: Props) {
  const [activities, setActivities] = useState(initial)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'upcoming' | 'unassigned' | 'all'>('upcoming')
  const supabase = createClient()

  const filtered = activities.filter(a => {
    if (filter === 'upcoming') return a.status === 'upcoming'
    if (filter === 'unassigned') return a.activity_volunteers.length === 0
    return true
  })

  function openEdit(a: Activity) {
    setEditingActivity(a)
    setPendingIds(a.activity_volunteers.map(av => av.volunteer_id))
  }

  function togglePending(id: string) {
    setPendingIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  async function handleSave() {
    if (!editingActivity) return
    setSaving(true)
    const activityId = editingActivity.activity_id

    await supabase.from('activity_volunteers').delete().eq('activity_id', activityId)
    if (pendingIds.length > 0) {
      await supabase.from('activity_volunteers').insert(
        pendingIds.map(vid => ({ activity_id: activityId, volunteer_id: vid }))
      )
    }

    const updatedVolunteers: ActivityVolunteer[] = volunteers
      .filter(v => pendingIds.includes(v.volunteer_id))
      .map(v => ({ volunteer_id: v.volunteer_id, volunteers: { name: v.name } }))

    setActivities(prev =>
      prev.map(a => a.activity_id === activityId ? { ...a, activity_volunteers: updatedVolunteers } : a)
    )
    setSaving(false)
    setEditingActivity(null)
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
                {[...(isSuperAdmin ? ['סניף'] : []), 'תאריך', 'סוג פעילות', 'סטטוס', 'מתנדבים משובצים'].map(h => (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.activity_volunteers.length === 0 ? (
                        <span className="text-gray-400 text-xs">ללא שיבוץ</span>
                      ) : (
                        a.activity_volunteers.map(av => (
                          <span key={av.volunteer_id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {av.volunteers?.name ?? '—'}
                          </span>
                        ))
                      )}
                      <button
                        onClick={() => openEdit(a)}
                        className="text-gray-400 hover:text-blue-600 mr-1"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
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

      {editingActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-lg">שיבוץ מתנדבים</h3>
              <button onClick={() => setEditingActivity(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {editingActivity.activity_types?.type_name ?? '—'} · {editingActivity.date}
            </p>

            <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
              {volunteers.length === 0 && (
                <p className="px-3 py-3 text-sm text-gray-400">אין מתנדבים זמינים</p>
              )}
              {volunteers.map(v => (
                <label key={v.volunteer_id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={pendingIds.includes(v.volunteer_id)}
                    onChange={() => togglePending(v.volunteer_id)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{v.name}</span>
                </label>
              ))}
            </div>

            {pendingIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">{pendingIds.length} נבחרו</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setEditingActivity(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 text-sm"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
