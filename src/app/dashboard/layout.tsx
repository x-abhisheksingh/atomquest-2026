'use client'
import { useUser } from '@/lib/hooks/useUser'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, LayoutDashboard, CheckSquare, Users, BarChart2, LogOut, FileText,TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { href: '/dashboard',           label: 'Dashboard',  icon: LayoutDashboard, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { href: '/dashboard/goals',     label: 'My Goals',   icon: Target,          roles: ['EMPLOYEE'] },
    { href: '/dashboard/team',      label: 'Team Goals', icon: Users,           roles: ['MANAGER'] },
    { href: '/dashboard/checkins',  label: 'Check-ins',  icon: CheckSquare,     roles: ['MANAGER'] },
    { href: '/dashboard/manage',    label: 'Manage',     icon: Users,           roles: ['ADMIN'] },
    { href: '/dashboard/reports',   label: 'Reports',    icon: BarChart2,       roles: ['ADMIN'] },
    { href: '/dashboard/audit',     label: 'Audit Log',  icon: FileText,        roles: ['ADMIN'] },
    { href: '/dashboard/achievements', label: 'Achievements', icon: TrendingUp, roles: ['EMPLOYEE'] },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="text-xl font-bold text-gray-800">Atom<span className="text-red-500">Quest</span></div>
        <div className="text-sm text-gray-400">Loading your workspace...</div>
      </div>
    </div>
  )

  if (!user) return null

  const filteredNav = navItems.filter(item => item.roles.includes(user.role))

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1A1A2E] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="text-xl font-bold">Atom<span className="text-red-400">Quest</span></div>
          <div className="text-sm text-white/70 mt-2 font-medium">{user.name}</div>
          <div className="text-xs text-white/30 mt-0.5 capitalize">{user.role.toLowerCase()}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-red-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 w-full transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
