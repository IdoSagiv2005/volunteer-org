'use client'

import { useState } from 'react'
import DeliveriesClient from './DeliveriesClient'
import CoordinationsClient from './CoordinationsClient'

type Delivery = { address_id: string; address: string; door_photo_url: string | null; family_id: string | null; branch_id: string; families: { full_name: string } | null }
type Family = { family_id: string; full_name: string }
type Coordination = { id: string; date: string; scheduled_time: string; address: string; volunteer_id: string | null; branch_id: string; volunteers: { name: string } | null }
type Volunteer = { volunteer_id: string; name: string }

type Props = {
  deliveries: Delivery[]
  families: Family[]
  coordinations: Coordination[]
  volunteers: Volunteer[]
  branchId: string | null
  isSuperAdmin: boolean
}

export default function DeliveriesTabsClient({ deliveries, families, coordinations, volunteers, branchId, isSuperAdmin }: Props) {
  const [tab, setTab] = useState<'addresses' | 'coordination'>('addresses')

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">משלוחים</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('addresses')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'addresses' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            כתובות
          </button>
          <button
            onClick={() => setTab('coordination')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'coordination' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            תיאום
          </button>
        </div>
      </div>

      {tab === 'addresses'
        ? <DeliveriesClient deliveries={deliveries} families={families} branchId={branchId} isSuperAdmin={isSuperAdmin} />
        : <CoordinationsClient coordinations={coordinations} volunteers={volunteers} branchId={branchId} isSuperAdmin={isSuperAdmin} />
      }
    </div>
  )
}
