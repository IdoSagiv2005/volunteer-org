'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Map, Camera } from 'lucide-react'
import dynamic from 'next/dynamic'

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { ssr: false })

type Delivery = { address_id: string; address: string; door_photo_url: string | null; family_id: string | null; branch_id: string; families: { full_name: string } | null }
type Family = { family_id: string; full_name: string }
type Props = { deliveries: Delivery[]; families: Family[]; branchId: string | null; isSuperAdmin: boolean }
const empty = { address: '', family_id: '' }

export default function DeliveriesClient({ deliveries: initial, families, branchId, isSuperAdmin }: Props) {
  const [deliveries, setDeliveries] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [editing, setEditing] = useState<Delivery | null>(null)
  const [form, setForm] = useState(empty)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const supabase = createClient()

  function openCreate() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(d: Delivery) {
    setEditing(d)
    setForm({ address: d.address, family_id: d.family_id ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { address: form.address, family_id: form.family_id || null, branch_id: branchId! }
    if (editing) {
      const { data } = await supabase.from('deliveries').update(payload).eq('address_id', editing.address_id).select('*, families(full_name)').single()
      if (data) setDeliveries(prev => prev.map(d => d.address_id === data.address_id ? data : d))
    } else {
      const { data } = await supabase.from('deliveries').insert(payload).select('*, families(full_name)').single()
      if (data) setDeliveries(prev => [...prev, data])
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק משלוח זה?')) return
    await supabase.from('deliveries').delete().eq('address_id', id)
    setDeliveries(prev => prev.filter(d => d.address_id !== id))
  }

  async function handlePhotoUpload(delivery: Delivery, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingId(delivery.address_id)
    const path = `door-photos/${delivery.address_id}`
    await supabase.storage.from('deliveries').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('deliveries').getPublicUrl(path)
    const { data } = await supabase.from('deliveries').update({ door_photo_url: publicUrl }).eq('address_id', delivery.address_id).select('*, families(full_name)').single()
    if (data) setDeliveries(prev => prev.map(d => d.address_id === data.address_id ? data : d))
    setUploadingId(null)
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">משלוחים</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowMap(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
            <Map size={16} /> צפה במפה
          </button>
          {!isSuperAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={16} /> הוסף משלוח
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['משפחה', 'כתובת', 'תמונת דלת', ''].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deliveries.map(d => (
              <tr key={d.address_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{d.families?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{d.address}</td>
                <td className="px-4 py-3">
                  {d.door_photo_url ? (
                    <a href={d.door_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={d.door_photo_url} alt="door" className="h-10 w-10 object-cover rounded" />
                    </a>
                  ) : !isSuperAdmin ? (
                    <label className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                      {uploadingId === d.address_id ? 'מעלה...' : <><Camera size={13} /> הוסף תמונה</>}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(d, e)} disabled={uploadingId === d.address_id} />
                    </label>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  {!isSuperAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(d.address_id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {deliveries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">לא נמצאו משלוחים</td></tr>}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'עריכת משלוח' : 'הוספת משלוח'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
                <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">משפחה</label>
                <select value={form.family_id} onChange={e => setForm(p => ({ ...p, family_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— בחר משפחה —</option>
                  {families.map(f => <option key={f.family_id} value={f.family_id}>{f.full_name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">{editing ? 'שמור שינויים' : 'הוסף משלוח'}</button>
            </form>
          </div>
        </div>
      )}

      {showMap && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl mx-4 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">כתובות משלוחים</h3>
              <button onClick={() => setShowMap(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 rounded-lg overflow-hidden">
              <DeliveryMap addresses={deliveries.map(d => ({ id: d.address_id, address: d.address, family: d.families?.full_name }))} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
