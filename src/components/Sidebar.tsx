'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, Truck, Calendar, UserCheck, Home, Settings, LogOut, Clock } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/families', label: 'Families', icon: Users },
  { href: '/dashboard/volunteers', label: 'Volunteers', icon: UserCheck },
  { href: '/dashboard/manager-hours', label: 'Manager Hours', icon: Clock },
  { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/dashboard/activities', label: 'Activities', icon: Calendar },
]

const superAdminItems = [
  { href: '/dashboard/activity-types', label: 'Activity Types', icon: Settings },
  { href: '/dashboard/branches', label: 'Branches', icon: Settings },
  { href: '/dashboard/managers', label: 'Managers', icon: Users },
]

type Manager = {
  name: string
  is_super_admin: boolean
  branches: { name: string } | null
} | null

export default function Sidebar({ manager }: { manager: Manager }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="font-bold text-gray-800 text-lg">Volunteer Org</h1>
        {manager && (
          <div className="mt-1">
            <p className="text-sm font-medium text-gray-700">{manager.name}</p>
            <p className="text-xs text-gray-500">
              {manager.is_super_admin ? 'Super Admin' : manager.branches?.name}
            </p>
          </div>
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
              Admin
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
          Sign Out
        </button>
      </div>
    </aside>
  )
}
