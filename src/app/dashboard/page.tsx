'use client'
import { useUser } from '@/lib/hooks/useUser'
import { useEffect, useState } from 'react'
import { Target, CheckSquare, BarChart2, Users, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useUser()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setStats)
  }, [])

  const getCards = () => {
    if (!user || !stats) return []

    if (user.role === 'EMPLOYEE') return [
      { label: 'Total Goals', value: stats.totalGoals ?? '—', icon: Target, color: 'text-red-500' },
      { label: 'Goals Approved', value: stats.approved ?? '—', icon: CheckSquare, color: 'text-green-500' },
      { label: 'Avg Progress', value: stats.avgProgress !== undefined ? `${stats.avgProgress}%` : '—', icon: BarChart2, color: 'text-blue-500' },
      { label: 'Check-ins Received', value: stats.checkIns ?? '—', icon: Users, color: 'text-purple-500' },
    ]

    if (user.role === 'MANAGER') return [
      { label: 'Team Goals', value: stats.totalGoals ?? '—', icon: Target, color: 'text-red-500' },
      { label: 'Approved Sheets', value: stats.approved ?? '—', icon: CheckSquare, color: 'text-green-500' },
      { label: 'Pending Review', value: stats.pending ?? '—', icon: Clock, color: 'text-yellow-500' },
      { label: 'Check-ins Done', value: stats.checkIns ?? '—', icon: Users, color: 'text-purple-500' },
    ]

    if (user.role === 'ADMIN') return [
      { label: 'Total Users', value: stats.totalGoals ?? '—', icon: Users, color: 'text-red-500' },
      { label: 'Locked Sheets', value: stats.approved ?? '—', icon: CheckSquare, color: 'text-green-500' },
      { label: 'Pending Approval', value: stats.avgProgress ?? '—', icon: Clock, color: 'text-yellow-500' },
      { label: 'Total Sheets', value: stats.checkIns ?? '—', icon: BarChart2, color: 'text-blue-500' },
    ]

    return []
  }

  const getRoleLabel = () => {
    if (user?.role === 'EMPLOYEE') return 'Employee'
    if (user?.role === 'MANAGER') return 'Manager'
    if (user?.role === 'ADMIN') return 'Admin / HR'
    return ''
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome back, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p className="text-gray-500 mb-8">FY 2026-27 · {getRoleLabel()}</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {getCards().map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{stat.label}</span>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {user?.role === 'EMPLOYEE' && (<>
            <a href="/dashboard/goals" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">My Goals</a>
            <a href="/dashboard/achievements" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">Log Achievement</a>
          </>)}
          {user?.role === 'MANAGER' && (<>
            <a href="/dashboard/team" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Review Team Goals</a>
            <a href="/dashboard/checkins" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">Add Check-in</a>
          </>)}
          {user?.role === 'ADMIN' && (<>
            <a href="/dashboard/manage" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Manage Users</a>
            <a href="/dashboard/reports" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">View Reports</a>
            <a href="/dashboard/audit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">Audit Trail</a>
          </>)}
        </div>
      </div>
    </div>
  )
}
