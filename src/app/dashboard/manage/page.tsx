'use client'
import { useState, useEffect } from 'react'
import { Users, CheckCircle, AlertCircle } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  EMPLOYEE: 'bg-gray-100 text-gray-600'
}

export default function ManagePage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [edits, setEdits] = useState<Record<string, { managerId?: string; role?: string }>>({})

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN')
  const employees = users.filter(u => u.role === 'EMPLOYEE')

  const handleSave = async (userId: string) => {
    const edit = edits[userId]
    if (!edit) return
    setSaving(userId)
    setError('')

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...edit })
    })

    if (res.ok) {
      setSuccess('Updated successfully!')
      setTimeout(() => setSuccess(''), 2000)
      setEdits(prev => { const n = { ...prev }; delete n[userId]; return n })
      fetchUsers()
    } else {
      const err = await res.json()
      setError(err.error)
    }
    setSaving(null)
  }

  const setEdit = (userId: string, field: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }))
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
        <p className="text-gray-500 text-sm mt-1">Assign managers, update roles, manage org hierarchy</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={16} className="text-green-500" />
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length },
          { label: 'Managers', value: managers.length },
          { label: 'Employees', value: employees.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned Manager</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Team Size</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const hasEdit = !!edits[u.id]
              const currentManagerId = edits[u.id]?.managerId ?? u.managerId ?? ''
              const currentRole = edits[u.id]?.role ?? u.role

              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white text-xs font-semibold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={currentRole}
                      onChange={e => setEdit(u.id, 'role', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-red-400"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={currentManagerId}
                      onChange={e => setEdit(u.id, 'managerId', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-red-400"
                    >
                      <option value="">No manager</option>
                      {managers
                        .filter(m => m.id !== u.id)
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.employees?.length > 0
                      ? `${u.employees.length} report${u.employees.length > 1 ? 's' : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {hasEdit && (
                      <button
                        onClick={() => handleSave(u.id)}
                        disabled={saving === u.id}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                      >
                        {saving === u.id ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
