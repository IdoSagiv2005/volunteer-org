'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type Activity = { activity_id: string; type_id: string | null; date: string; volunteer_id: string | null; branch_id: string; status: 'upcoming' | 'completed'; activity_types: { type_name: string } | null; volunteers: { name: string } | null }
type Volunteer = { volunteer_id: string; name: string }
type ActivityType = { type_id: string; type_name: string }
type Props = { activities: Activity[]; volunteers: Volunteer[]; activityTypes: ActivityType[]; branchId: string | null; isSuperAdmin: boolean }
type FormStatus = 'upcoming' | 'completed'
const empty: { type_id: string; date: string; volunteer_id: string; status: FormStatus } = { type_id: '', date: '', volunteer_id: '', status: 'upcoming' }

export default function ActivitiesClient({ activities: initial, volunteers, activityTypes, branchId, isSuperAdmin }: Props) {
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
    setForm({ type_id: a.type_id ?? '', date: a.date, volunteer_id: a.volunteer_id ?? '', status: a.status })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const common = { type_id: form.type_id || null, date: form.date, volunteer_id: form.volunteer_id || null, status: form.status as 'upcoming' | 'completed' }
    if (editing) {
      const { data } = await supabase.from('activities').update(common).eq('activity_id', editing.activity_id).select('*, activity_types(type_name), volunteers(name)').single()
      if (data) setActivities(prev => prev.map((a: Activity) => a.activity_id === data.activity_id ? data : a))
    } else {
      const { data } = await supabase.from('activities').insert({ ...common, branch_id: branchId! }).select('*, activity_types(type_name), volunteers(name)').single()
      if (data) setActivities(prev => [...prev, data])
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this activity?')) return
    await supabase.from('activities').delete().eq('activity_id', id)
    setActivities(prev => prev.filter(a => a.activity_id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Activities</h2>
        {!isSuperAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Add Activity
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'upcoming', 'completed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Type', 'Date', 'Volunteer', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(a => (
              <tr key={a.activity_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{a.activity_types?.type_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{a.date}</td>
                <td className="px-4 py-3 text-gray-600">{a.volunteers?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  {!isSuperAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(a.activity_id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No activities found</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'Edit Activity' : 'Add Activity'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                <select value={form.type_id} onChange={e => setForm(p => ({ ...p, type_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select type —</option>
                  {activityTypes.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volunteer</label>
                <select value={form.volunteer_id} onChange={e => setForm(p => ({ ...p, volunteer_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select volunteer —</option>
                  {volunteers.map(v => <option key={v.volunteer_id} value={v.volunteer_id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'upcoming' | 'completed' }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">{editing ? 'Save Changes' : 'Add Activity'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
