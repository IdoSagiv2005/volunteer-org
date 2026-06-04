'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, X } from 'lucide-react'

type Manager = { id: string; name: string; email: string; phone: string | null; branch_id: string | null; is_super_admin: boolean; branches: { name: string } | null }
type Branch = { id: string; name: string }
type Props = { managers: Manager[]; branches: Branch[] }
const empty = { name: '', email: '', phone: '', branch_id: '', password: '', is_super_admin: false }

export default function ManagersClient({ managers: initial, branches }: Props) {
  const [managers, setManagers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [replacingManager, setReplacingManager] = useState<Manager | null>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const supabase = createClient()

  const takenBranchIds = new Set(managers.filter(m => !m.is_super_admin && m.branch_id).map(m => m.branch_id!))
  const availableBranches = branches.filter(b => !takenBranchIds.has(b.id))

  function openAdd() {
    setReplacingManager(null)
    setForm(empty)
    setError('')
    setShowForm(true)
  }

  function openReplace(m: Manager) {
    setReplacingManager(m)
    setForm({ name: '', email: '', phone: '', branch_id: m.branch_id ?? '', password: '', is_super_admin: false })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (replacingManager) {
      // Delete old manager first, then create new one
      await supabase.from('managers').delete().eq('id', replacingManager.id)
    }

    const res = await fetch('/api/create-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error); return }

    if (replacingManager) {
      setManagers(prev => prev.filter(m => m.id !== replacingManager.id).concat(result.manager))
    } else {
      setManagers(prev => [...prev, result.manager])
    }
    setShowForm(false)
    setForm(empty)
    setReplacingManager(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this manager?')) return
    await supabase.from('managers').delete().eq('id', id)
    setManagers(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Managers</h2>
        {availableBranches.length > 0 && (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Add Manager
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Name', 'Email', 'Phone', 'Branch', 'Role', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {managers.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                <td className="px-4 py-3 text-gray-600">{m.branches?.name ?? '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.is_super_admin ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{m.is_super_admin ? 'Super Admin' : 'Manager'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    {!m.is_super_admin && (
                      <button onClick={() => openReplace(m)} className="text-xs text-blue-600 hover:underline">Replace</button>
                    )}
                    <button onClick={() => handleDelete(m.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{replacingManager ? `Replace Manager — ${replacingManager.branches?.name}` : 'Add Manager'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[{ key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', type: 'email', required: true }, { key: 'password', label: 'Password', type: 'password', required: true }, { key: 'phone', label: 'Phone' }].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type ?? 'text'} value={form[key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required={required} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                {replacingManager ? (
                  <input type="text" value={replacingManager.branches?.name ?? ''} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                ) : (
                  <select value={form.branch_id} onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select branch —</option>
                    {availableBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_super_admin} onChange={e => setForm(p => ({ ...p, is_super_admin: e.target.checked }))} />
                Super Admin
              </label>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">{replacingManager ? 'Replace Manager' : 'Create Manager'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
