'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, X } from 'lucide-react'

type Manager = { name: string; email: string; phone: string | null } | null
type Branch = { id: string; name: string; managers: Manager | Manager[] }

export default function BranchesClient({ branches: initial }: { branches: Branch[] }) {
  const [branches, setBranches] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleDelete(id: string) {
    if (!confirm('למחוק סניף זה? פעולה זו תמחק את כל הנתונים המשויכים אליו.')) return
    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (!error) setBranches(prev => prev.filter(b => b.id !== id))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const name = newName.trim()
    if (!name) return

    const { data, error: err } = await supabase.from('branches').insert({ name }).select('*, managers(name, email, phone)').single()
    if (err) {
      setError(err.message.includes('unique') ? 'סניף בשם זה כבר קיים.' : err.message)
      return
    }
    setBranches(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">סניפים</h2>
        <button
          onClick={() => { setShowForm(true); setError(''); setNewName('') }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} /> הוסף סניף
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['סניף', 'מנהל', 'אימייל', 'טלפון', ''].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {branches.map(b => {
              const mgr = Array.isArray(b.managers) ? b.managers[0] : b.managers
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600">{mgr?.name ?? <span className="text-orange-500">אין מנהל</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{mgr?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{mgr?.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              )
            })}
            {branches.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">אין סניפים עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">הוספת סניף</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם הסניף</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">הוסף סניף</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
