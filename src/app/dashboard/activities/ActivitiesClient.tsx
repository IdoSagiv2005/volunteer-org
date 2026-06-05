'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type ActivityVolunteer = { volunteer_id: string; volunteers: { name: string } | null }
type Activity = { activity_id: string; type_id: string | null; date: string; branch_id: string; status: 'upcoming' | 'completed'; activity_types: { type_name: string } | null; activity_volunteers: ActivityVolunteer[]; branches: { name: string } | null }
type Volunteer = { volunteer_id: string; name: string }
type ActivityType = { type_id: string; type_name: string }
type Branch = { id: string; name: string }
type Props = { activities: Activity[]; volunteers: Volunteer[]; activityTypes: ActivityType[]; branches: Branch[]; branchId: string | null; isSuperAdmin: boolean }

type FormStatus = 'upcoming' | 'completed'
const empty = { type_id: '', date: '', volunteer_ids: [] as string[], status: 'upcoming' as FormStatus, branch_id: '' }

export default function ActivitiesClient({ activities: initial, volunteers, activityTypes, branches, branchId, isSuperAdmin }: Props) {
  const [activities, setActivities] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [form, setForm] = useState(empty)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const supabase = createClient()

  const filtered = activities.filter(a => filter === 'all' || a.status === filter)

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(a: Activity) {
    setEditing(a)
    setForm({
      type_id: a.type_id ?? '',
      date: a.date,
      volunteer_ids: a.activity_volunteers.map(av => av.volunteer_id),
      status: a.status,
      branch_id: a.branch_id,
    })
    setShowForm(true)
  }

  function toggleVolunteer(id: string) {
    setForm(p => ({
      ...p,
      volunteer_ids: p.volunteer_ids.includes(id)
        ? p.volunteer_ids.filter(v => v !== id)
        : [...p.volunteer_ids, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const common = { type_id: form.type_id || null, date: form.date, status: form.status }

    let activityId: string

    if (editing) {
      const { data } = await supabase.from('activities').update(common).eq('activity_id', editing.activity_id).select('activity_id').single()
      if (!data) return
      activityId = data.activity_id
      await supabase.from('activity_volunteers').delete().eq('activity_id', activityId)
    } else {
      const insertBranchId = isSuperAdmin ? form.branch_id : branchId!
      const { data } = await supabase.from('activities').insert({ ...common, branch_id: insertBranchId }).select('activity_id').single()
      if (!data) return
      activityId = data.activity_id
    }

    if (form.volunteer_ids.length > 0) {
      await supabase.from('activity_volunteers').insert(
        form.volunteer_ids.map(vid => ({ activity_id: activityId, volunteer_id: vid }))
      )
    }

    const { data: full } = await supabase
      .from('activities')
      .select('*, activity_types(type_name), activity_volunteers(volunteer_id, volunteers(name)), branches(name)')
      .eq('activity_id', activityId)
      .single()

    if (full) {
      setActivities(prev =>
        editing
          ? prev.map(a => a.activity_id === full.activity_id ? full : a)
          : [...prev, full]
      )
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק פעילות זו?')) return
    await supabase.from('activities').delete().eq('activity_id', id)
    setActivities(prev => prev.filter(a => a.activity_id !== id))
  }

  const filterLabels = { all: 'הכל', upcoming: 'עתידיות', completed: 'הושלמו' }
  const colSpan = isSuperAdmin ? 6 : 5

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">פעילויות</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> הוסף פעילות
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'upcoming', 'completed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-sm font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{filterLabels[s]}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[...(isSuperAdmin ? ['סניף'] : []), 'סוג', 'תאריך', 'מתנדבים', 'סטטוס', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.activity_id} className="hover:bg-gray-50">
                  {isSuperAdmin && <td className="px-4 py-3 text-gray-600">{a.branches?.name ?? '—'}</td>}
                  <td className="px-4 py-3 font-medium text-gray-800">{a.activity_types?.type_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.date}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.activity_volunteers.length > 0
                      ? a.activity_volunteers.map(av => av.volunteers?.name).filter(Boolean).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {a.status === 'upcoming' ? 'עתידי' : 'הושלם'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(a.activity_id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">לא נמצאו פעילויות</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'עריכת פעילות' : 'הוספת פעילות'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSuperAdmin && !editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סניף</label>
                  <select value={form.branch_id} onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— בחר סניף —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג פעילות</label>
                <select value={form.type_id} onChange={e => setForm(p => ({ ...p, type_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— בחר סוג —</option>
                  {activityTypes.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מתנדבים</label>
                <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                  {volunteers.length === 0 && <p className="text-xs text-gray-400 px-1">אין מתנדבים זמינים</p>}
                  {volunteers.map(v => (
                    <label key={v.volunteer_id} className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={form.volunteer_ids.includes(v.volunteer_id)}
                        onChange={() => toggleVolunteer(v.volunteer_id)}
                      />
                      {v.name}
                    </label>
                  ))}
                </div>
                {form.volunteer_ids.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{form.volunteer_ids.length} נבחרו</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as FormStatus }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="upcoming">עתידי</option>
                  <option value="completed">הושלם</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">{editing ? 'שמור שינויים' : 'הוסף פעילות'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
