'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

type ActivityType = { type_id: string; type_name: string }

export default function ActivityTypesClient({ types: initial }: { types: ActivityType[] }) {
  const [types, setTypes] = useState(initial)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const { data } = await supabase.from('activity_types').insert({ type_name: newName.trim() }).select().single()
    if (data) { setTypes(prev => [...prev, data].sort((a, b) => a.type_name.localeCompare(b.type_name))) }
    setNewName('')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this activity type?')) return
    await supabase.from('activity_types').delete().eq('type_id', id)
    setTypes(prev => prev.filter(t => t.type_id !== id))
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity Types</h2>
      <p className="text-sm text-gray-500 mb-4">These types are shared across all branches.</p>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="New activity type..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"><Plus size={16} /> Add</button>
      </form>
      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
        {types.map(t => (
          <div key={t.type_id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-800">{t.type_name}</span>
            <button onClick={() => handleDelete(t.type_id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        ))}
        {types.length === 0 && <div className="px-4 py-6 text-center text-gray-400 text-sm">No activity types yet</div>}
      </div>
    </div>
  )
}
