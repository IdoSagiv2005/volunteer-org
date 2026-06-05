'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'

type Family = {
  family_id: string
  full_name: string
  national_id: string
  address: string | null
  phone: string | null
  member_count: number | null
  disability_type: string | null
  branch_id: string
}

type Props = {
  families: Family[]
  branchId: string | null
  isSuperAdmin: boolean
}

const empty = { full_name: '', national_id: '', address: '', phone: '', member_count: '', disability_type: '' }

export default function FamiliesClient({ families: initial, branchId, isSuperAdmin }: Props) {
  const [families, setFamilies] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Family | null>(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const filtered = families.filter(f =>
    f.full_name.toLowerCase().includes(search.toLowerCase()) ||
    f.national_id.includes(search)
  )

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(f: Family) {
    setEditing(f)
    setForm({ full_name: f.full_name, national_id: f.national_id, address: f.address ?? '', phone: f.phone ?? '', member_count: String(f.member_count ?? ''), disability_type: f.disability_type ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, member_count: form.member_count ? Number(form.member_count) : null, branch_id: branchId! }

    if (editing) {
      const { data } = await supabase.from('families').update(payload).eq('family_id', editing.family_id).select().single()
      if (data) setFamilies(prev => prev.map(f => f.family_id === data.family_id ? data : f))
    } else {
      const { data } = await supabase.from('families').insert(payload).select().single()
      if (data) setFamilies(prev => [...prev, data])
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק משפחה זו?')) return
    await supabase.from('families').delete().eq('family_id', id)
    setFamilies(prev => prev.filter(f => f.family_id !== id))
  }

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !branchId) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    const payload = rows.map(r => ({
      full_name: String(r['full_name'] ?? r['name'] ?? ''),
      national_id: String(r['national_id'] ?? r['id'] ?? ''),
      address: String(r['address'] ?? ''),
      phone: String(r['phone'] ?? ''),
      member_count: r['member_count'] ? Number(r['member_count']) : null,
      disability_type: String(r['disability_type'] ?? ''),
      branch_id: branchId,
    })).filter(r => r.full_name && r.national_id)

    const { data } = await supabase.from('families').upsert(payload, { onConflict: 'national_id' }).select()
    if (data) {
      setFamilies(prev => {
        const map = new Map(prev.map(f => [f.family_id, f]))
        data.forEach(f => map.set(f.family_id, f))
        return Array.from(map.values())
      })
    }
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">משפחות</h2>
        <div className="flex gap-2">
          {!isSuperAdmin && (
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 text-sm font-medium">
              <Upload size={16} /> ייבוא מאקסל
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
            </label>
          )}
          {!isSuperAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={16} /> הוסף משפחה
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="חיפוש לפי שם או ת.ז..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['שם מלא', 'תעודת זהות', 'טלפון', 'כתובת', 'חברי משפחה', 'סוג נכות', ''].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(f => (
              <tr key={f.family_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{f.national_id}</td>
                <td className="px-4 py-3 text-gray-600">{f.phone}</td>
                <td className="px-4 py-3 text-gray-600">{f.address}</td>
                <td className="px-4 py-3 text-gray-600">{f.member_count}</td>
                <td className="px-4 py-3 text-gray-600">{f.disability_type}</td>
                <td className="px-4 py-3">
                  {!isSuperAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(f)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(f.family_id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">לא נמצאו משפחות</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'עריכת משפחה' : 'הוספת משפחה'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'full_name', label: 'שם מלא', required: true },
                { key: 'national_id', label: 'תעודת זהות', required: true },
                { key: 'address', label: 'כתובת' },
                { key: 'phone', label: 'טלפון' },
                { key: 'member_count', label: 'מספר חברי משפחה', type: 'number' },
                { key: 'disability_type', label: 'סוג נכות' },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type ?? 'text'}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    required={required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                {editing ? 'שמור שינויים' : 'הוסף משפחה'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
