'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type Coordination = {
  id: string
  date: string
  time: string
  address: string
  volunteer_id: string | null
  branch_id: string
  volunteers: { name: string } | null
}

type Volunteer = { volunteer_id: string; name: string }
type Props = { coordinations: Coordination[]; volunteers: Volunteer[]; branchId: string | null; isSuperAdmin: boolean }

const empty = { date: '', time: '', address: '', volunteer_id: '' }

export default function CoordinationsClient({ coordinations: initial, volunteers, branchId, isSuperAdmin }: Props) {
  const [coordinations, setCoordinations] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coordination | null>(null)
  const [form, setForm] = useState(empty)
  const supabase = createClient()

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(c: Coordination) {
    setEditing(c)
    setForm({ date: c.date, time: c.time.slice(0, 5), address: c.address, volunteer_id: c.volunteer_id ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      date: form.date,
      time: form.time,
      address: form.address,
      volunteer_id: form.volunteer_id || null,
      branch_id: branchId!,
    }
    if (editing) {
      const { data } = await supabase.from('coordinations').update(payload).eq('id', editing.id).select('*, volunteers(name)').single()
      if (data) setCoordinations(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      const { data } = await supabase.from('coordinations').insert(payload).select('*, volunteers(name)').single()
      if (data) setCoordinations(prev => [...prev, data])
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק תיאום זה?')) return
    await supabase.from('coordinations').delete().eq('id', id)
    setCoordinations(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      {!isSuperAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> הוסף תיאום
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['תאריך', 'שעה', 'כתובת', 'מתנדב', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coordinations.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{c.date}</td>
                  <td className="px-4 py-3 text-gray-600">{c.time.slice(0, 5)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.address}</td>
                  <td className="px-4 py-3 text-gray-600">{c.volunteers?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {!isSuperAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {coordinations.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">אין תיאומים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'עריכת תיאום' : 'הוספת תיאום'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעה</label>
                <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
                <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מתנדב</label>
                <select value={form.volunteer_id} onChange={e => setForm(p => ({ ...p, volunteer_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— בחר מתנדב —</option>
                  {volunteers.map(v => <option key={v.volunteer_id} value={v.volunteer_id}>{v.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                {editing ? 'שמור שינויים' : 'הוסף תיאום'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
