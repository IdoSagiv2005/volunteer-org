'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, Truck, Calendar, UserCheck, Home, Settings, LogOut, Clock, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'סקירה כללית', icon: Home },
  { href: '/dashboard/families', label: 'משפחות', icon: Users },
  { href: '/dashboard/volunteers', label: 'מתנדבים', icon: UserCheck },
  { href: '/dashboard/manager-hours', label: 'שעות מנהלים', icon: Clock },
  { href: '/dashboard/deliveries', label: 'משלוחים', icon: Truck },
  { href: '/dashboard/activities', label: 'פעילויות', icon: Calendar },
]

const superAdminItems = [
  { href: '/dashboard/activity-types', label: 'סוגי פעילות', icon: Settings },
  { href: '/dashboard/branches', label: 'סניפים', icon: Settings },
  { href: '/dashboard/managers', label: 'מנהלים', icon: Users },
]

type Manager = {
  name: string
  is_super_admin: boolean
  branches: { name: string } | null
} | null

export default function Sidebar({ manager, onClose }: { manager: Manager; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="font-bold text-gray-800 text-lg">מאירים</h1>
          {manager && (
            <div className="mt-1">
              <p className="text-sm font-medium text-gray-700">{manager.name}</p>
              <p className="text-xs text-gray-500">
                {manager.is_super_admin ? 'מנהל על' : manager.branches?.name}
              </p>
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 p-1 -mt-1 -ml-1">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {manager?.is_super_admin && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ניהול
            </div>
            {superAdminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
        >
          <LogOut size={16} />
          התנתק
        </button>
      </div>
    </aside>
  )
}
