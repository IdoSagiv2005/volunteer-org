'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

type Volunteer = { volunteer_id: string; name: string }
type AvailEntry = { id: string; volunteer_id: string; date: string }
type Props = { volunteers: Volunteer[]; availability: AvailEntry[]; branchId: string | null; isSuperAdmin: boolean }

export default function AvailabilityClient({ volunteers, availability: initial, branchId, isSuperAdmin }: Props) {
  const [availability, setAvailability] = useState(initial)
  const [newDates, setNewDates] = useState<Record<string, string>>({})
  const supabase = createClient()

  function getDates(volunteerId: string) {
    return availability.filter(a => a.volunteer_id === volunteerId).sort((a, b) => a.date.localeCompare(b.date))
  }

  async function handleAdd(volunteerId: string) {
    const date = newDates[volunteerId]
    if (!date || !branchId) return
    const { data, error } = await supabase
      .from('volunteer_availability')
      .insert({ volunteer_id: volunteerId, date, branch_id: branchId })
      .select('id, volunteer_id, date')
      .single()
    if (error) return
    if (data) {
      setAvailability(prev => [...prev, data])
      setNewDates(p => ({ ...p, [volunteerId]: '' }))
    }
  }

  async function handleRemove(id: string) {
    await supabase.from('volunteer_availability').delete().eq('id', id)
    setAvailability(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">זמינות מתנדבים</h2>

      {isSuperAdmin && (
        <p className="mb-4 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          מנהל-על — ניתן לצפייה בלבד. זמינות מוגדרת על ידי מנהלי הסניפים.
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 w-40">מתנדב</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">תאריכים זמינים</th>
              {!isSuperAdmin && <th className="px-4 py-3 w-48"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {volunteers.map(v => (
              <tr key={v.volunteer_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 align-top pt-4">{v.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {getDates(v.volunteer_id).map(a => (
                      <span key={a.id} className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {a.date}
                        {!isSuperAdmin && (
                          <button onClick={() => handleRemove(a.id)} className="hover:text-red-500 leading-none">
                            <X size={11} />
                          </button>
                        )}
                      </span>
                    ))}
                    {getDates(v.volunteer_id).length === 0 && (
                      <span className="text-gray-400 text-xs">לא הוגדרה זמינות</span>
                    )}
                  </div>
                </td>
                {!isSuperAdmin && (
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={newDates[v.volunteer_id] ?? ''}
                        onChange={e => setNewDates(p => ({ ...p, [v.volunteer_id]: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleAdd(v.volunteer_id)}
                        disabled={!newDates[v.volunteer_id]}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-40"
                      >
                        <Plus size={12} /> הוסף
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {volunteers.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">אין מתנדבים</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
