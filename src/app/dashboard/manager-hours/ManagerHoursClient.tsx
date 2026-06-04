'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

type HoursEntry = {
  id: string
  manager_id: string
  branch_id: string
  date: string
  hours: number
  notes: string | null
  managers?: { name: string; branches: { name: string } | null } | null
}

type ManagerRef = { id: string; name: string; branches: { name: string } | null }

type Props = {
  hours: HoursEntry[]
  managerId: string | null
  managerName: string
  branchId: string | null
  isSuperAdmin: boolean
  allManagers: ManagerRef[]
}

const empty = { date: '', hours: '', notes: '' }

export default function ManagerHoursClient({ hours: initial, managerId, managerName, branchId, isSuperAdmin, allManagers }: Props) {
  const [hours, setHours] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<HoursEntry | null>(null)
  const [form, setForm] = useState(empty)
  const [filterManager, setFilterManager] = useState('')
  const supabase = createClient()

  const filtered = hours.filter(h => !filterManager || h.manager_id === filterManager)
  const totalHours = filtered.reduce((sum, h) => sum + Number(h.hours), 0)

  const managerTotals = useMemo(() => {
    const map: Record<string, { name: string; branch: string; total: number }> = {}
    hours.forEach(h => {
      const name = h.managers?.name ?? managerName
      const branch = h.managers?.branches?.name ?? ''
      if (!map[h.manager_id]) map[h.manager_id] = { name, branch, total: 0 }
      map[h.manager_id].total += Number(h.hours)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [hours, managerName])

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(h: HoursEntry) {
    setEditing(h)
    setForm({ date: h.date, hours: String(h.hours), notes: h.notes ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { manager_id: managerId!, branch_id: branchId!, date: form.date, hours: Number(form.hours), notes: form.notes || null }
    if (editing) {
      const { data } = await supabase.from('manager_hours').update(payload).eq('id', editing.id).select().single()
      if (data) setHours(prev => prev.map(h => h.id === data.id ? data : h))
    } else {
      const { data } = await supabase.from('manager_hours').insert(payload).select().single()
      if (data) setHours(prev => [data, ...prev])
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק רשומה זו?')) return
    await supabase.from('manager_hours').delete().eq('id', id)
    setHours(prev => prev.filter(h => h.id !== id))
  }

  function handleExcelExport() {
    const rows = filtered.map(h => ({
      'מנהל': h.managers?.name ?? managerName,
      'סניף': h.managers?.branches?.name ?? '',
      'תאריך': h.date,
      'שעות': h.hours,
      'הערות': h.notes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'שעות מנהלים')
    XLSX.writeFile(wb, 'manager_hours.xlsx')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">שעות מנהלים</h2>
        <div className="flex gap-2">
          <button onClick={handleExcelExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
            <Download size={16} /> ייצוא לאקסל
          </button>
          {!isSuperAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={16} /> הוסף שעות
            </button>
          )}
        </div>
      </div>

      {isSuperAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-700">{totalHours.toFixed(1)}</p>
            <p className="text-sm text-blue-600 font-medium mt-1">{filterManager ? 'שעות (מסונן)' : 'סה"כ שעות'}</p>
          </div>
          {managerTotals.slice(0, 3).map(m => (
            <div key={m.name} className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-700">{m.total.toFixed(1)}ש׳</p>
              <p className="text-sm text-gray-500 font-medium mt-1 truncate">{m.name}</p>
              <p className="text-xs text-gray-400">{m.branch}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-700">{totalHours.toFixed(1)}</p>
            <p className="text-sm text-blue-600 font-medium mt-1">סה"כ שעות שלך</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{hours.length}</p>
            <p className="text-sm text-green-600 font-medium mt-1">רשומות</p>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="mb-4">
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">כל המנהלים</option>
            {allManagers.map(m => (
              <option key={m.id} value={m.id}>{m.name} — {m.branches?.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[...(isSuperAdmin ? ['מנהל', 'סניף'] : []), 'תאריך', 'שעות', 'הערות', ''].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(h => (
              <tr key={h.id} className="hover:bg-gray-50">
                {isSuperAdmin && (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{h.managers?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{h.managers?.branches?.name ?? '—'}</td>
                  </>
                )}
                <td className="px-4 py-3 text-gray-600">{h.date}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{h.hours}ש׳</td>
                <td className="px-4 py-3 text-gray-500">{h.notes ?? '—'}</td>
                <td className="px-4 py-3">
                  {!isSuperAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(h)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(h.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={isSuperAdmin ? 6 : 4} className="px-4 py-8 text-center text-gray-400">אין רשומות עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'עריכת רשומה' : 'הוספת שעות'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">רישום שעות עבור: <span className="font-medium text-gray-700">{managerName}</span></p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעות</label>
                <input type="number" min="0.5" step="0.5" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                {editing ? 'שמור שינויים' : 'הוסף רשומה'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
