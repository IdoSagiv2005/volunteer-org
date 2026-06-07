'use client'

import { useState } from 'react'
import VolunteersClient from './VolunteersClient'
import AvailabilityClient from '../volunteer-availability/AvailabilityClient'

type Volunteer = { volunteer_id: string; name: string; phone: string | null; address: string | null; national_id: string; branch_id: string; skills: string[] | null; type: string | null; branches: { name: string } | null }
type AvailEntry = { id: string; volunteer_id: string; date: string }

type Props = {
  volunteers: Volunteer[]
  availability: AvailEntry[]
  branchId: string | null
  isSuperAdmin: boolean
}

export default function VolunteersTabsClient({ volunteers, availability, branchId, isSuperAdmin }: Props) {
  const [tab, setTab] = useState<'volunteers' | 'availability'>('volunteers')

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">מתנדבים</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('volunteers')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'volunteers' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            רשימה
          </button>
          <button
            onClick={() => setTab('availability')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'availability' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            זמינות
          </button>
        </div>
      </div>

      {tab === 'volunteers'
        ? <VolunteersClient volunteers={volunteers} branchId={branchId} isSuperAdmin={isSuperAdmin} />
        : <AvailabilityClient volunteers={volunteers.map(v => ({ volunteer_id: v.volunteer_id, name: v.name }))} availability={availability} branchId={branchId} isSuperAdmin={isSuperAdmin} />
      }
    </div>
  )
}
