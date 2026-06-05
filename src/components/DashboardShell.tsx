'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

type Manager = {
  name: string
  is_super_admin: boolean
  branches: { name: string } | null
} | null

export default function DashboardShell({ manager, children }: { manager: Manager; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className={`fixed inset-y-0 right-0 z-50 transition-transform duration-200 md:static md:z-auto ${open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <Sidebar manager={manager} onClose={() => setOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 md:hidden">
          <button onClick={() => setOpen(true)} className="text-gray-600 p-1">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-800 text-lg">מאירים</span>
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
