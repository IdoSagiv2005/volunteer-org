'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Upload, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

type Volunteer = { volunteer_id: string; name: string; phone: string | null; address: string | null; national_id: string; branch_id: string; skills: string[] | null; type: string | null; branches: { name: string } | null }
type Props = { volunteers: Volunteer[]; branchId: string | null; isSuperAdmin: boolean }
const VOLUNTEER_TYPES = ['שטח', 'חונכות', 'עונתיים'] as const
const empty = { name: '', phone: '', address: '', national_id: '', skills: '', type: '' }

export default function VolunteersClient({ volunteers: initial, branchId, isSuperAdmin }: Props) {
  const [volunteers, setVolunteers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Volunteer | null>(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const filtered = volunteers.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.national_id.includes(search))

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(v: Volunteer) {
    setEditing(v)
    setForm({ name: v.name, phone: v.phone ?? '', address: v.address ?? '', national_id: v.national_id, skills: (v.skills ?? []).join(', '), type: v.type ?? '' })
    setShowForm(true)
  }

  function parseSkills(s: string): string[] {
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const skills = parseSkills(form.skills)
    const type = form.type || null
    const payload = { name: form.name, phone: form.phone, address: form.address, national_id: form.national_id, skills, type, branch_id: branchId! }
    if (editing) {
      const { error } = await supabase.from('volunteers').update(payload).eq('volunteer_id', editing.volunteer_id)
      if (!error) {
        const updated: Volunteer = { ...editing, name: form.name, phone: form.phone || null, address: form.address || null, national_id: form.national_id, skills, type }
        setVolunteers(prev => prev.map(v => v.volunteer_id === editing.volunteer_id ? updated : v))
      }
    } else {
      const { data } = await supabase.from('volunteers').insert(payload).select('volunteer_id').single()
      if (data) {
        const created: Volunteer = { volunteer_id: data.volunteer_id, name: form.name, phone: form.phone || null, address: form.address || null, national_id: form.national_id, skills, type, branch_id: branchId!, branches: null }
        setVolunteers(prev => [...prev, created])
      }
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק מתנדב זה?')) return
    await supabase.from('volunteers').delete().eq('volunteer_id', id)
    setVolunteers(prev => prev.filter(v => v.volunteer_id !== id))
  }

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !branchId) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    const payload = rows.map(r => ({
      name: String(r['name'] ?? r['full_name'] ?? ''),
      national_id: String(r['national_id'] ?? r['id'] ?? ''),
      phone: String(r['phone'] ?? ''),
      address: String(r['address'] ?? ''),
      type: r['סוג'] ? String(r['סוג']) : null,
      skills: r['skills'] ? String(r['skills']).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      branch_id: branchId,
    })).filter(r => r.name && r.national_id)
    const { data } = await supabase.from('volunteers').upsert(payload, { onConflict: 'national_id' }).select('*, branches(name)')
    if (data) {
      setVolunteers(prev => {
        const map = new Map(prev.map(v => [v.volunteer_id, v]))
        data.forEach(v => map.set(v.volunteer_id, v))
        return Array.from(map.values())
      })
    }
    e.target.value = ''
  }

  function handleExcelExport() {
    const rows = filtered.map(v => ({
      'שם': v.name,
      'תעודת זהות': v.national_id,
      'טלפון': v.phone ?? '',
      'כתובת': v.address ?? '',
      'סוג': v.type ?? '',
      'כישורים': (v.skills ?? []).join(', '),
      ...(isSuperAdmin ? { 'סניף': v.branches?.name ?? '' } : {}),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'מתנדבים')
    XLSX.writeFile(wb, 'volunteers.xlsx')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div />
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExcelExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
            <Download size={16} /> ייצוא לאקסל
          </button>
          {!isSuperAdmin && (
            <>
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 text-sm font-medium">
                <Upload size={16} /> ייבוא מאקסל
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
              </label>
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                <Plus size={16} /> הוסף מתנדב
              </button>
            </>
          )}
        </div>
      </div>

      <input type="text" placeholder="חיפוש..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4 w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[...(isSuperAdmin ? ['סניף'] : []), 'שם', 'תעודת זהות', 'טלפון', 'כתובת', 'סוג', 'כישורים', ''].map(h => (
                  <th key={h} className={`px-4 py-3 text-right text-xs font-semibold text-gray-500${h === 'כתובת' ? ' hidden md:table-cell' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.volunteer_id} className="hover:bg-gray-50">
                  {isSuperAdmin && <td className="px-4 py-3 text-gray-600">{v.branches?.name ?? '—'}</td>}
                  <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.national_id}</td>
                  <td className="px-4 py-3 text-gray-600">{v.phone}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{v.address}</td>
                  <td className="px-4 py-3">
                    {v.type && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{v.type}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(v.skills ?? []).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!isSuperAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(v.volunteer_id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-8 text-center text-gray-400">לא נמצאו מתנדבים</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'עריכת מתנדב' : 'הוספת מתנדב'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'name', label: 'שם', required: true },
                { key: 'national_id', label: 'תעודת זהות', required: true },
                { key: 'phone', label: 'טלפון' },
                { key: 'address', label: 'כתובת' },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="text" value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required={required} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— בחר סוג —</option>
                  {VOLUNTEER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כישורים <span className="text-gray-400 font-normal">(מופרד בפסיקים)</span></label>
                <input type="text" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="נהיגה, בישול, עברית" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form.skills && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parseSkills(form.skills).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">{editing ? 'שמור שינויים' : 'הוסף מתנדב'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
