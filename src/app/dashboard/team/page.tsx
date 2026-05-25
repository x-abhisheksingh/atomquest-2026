'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, Users } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  LOCKED: 'bg-blue-100 text-blue-700'
}

export default function TeamGoalsPage() {
  const [sheets, setSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editedGoals, setEditedGoals] = useState<Record<string, any>>({})
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchTeam = async () => {
    setLoading(true)
    const res = await fetch('/api/team')
    const data = await res.json()
    setSheets(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchTeam() }, [])

  const handleReview = async (goalSheetId: string, action: 'APPROVE' | 'RETURN') => {
    setError('')
    setProcessing(goalSheetId + action)

    const goals = Object.entries(editedGoals)
      .filter(([id]) => sheets.some(s => s.goals.some((g: any) => g.id === id)))
      .map(([id, data]) => ({ id, ...data }))

    const res = await fetch('/api/team/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalSheetId, action, goals })
    })

    if (res.ok) {
      setSuccess(action === 'APPROVE' ? 'Goals approved and locked!' : 'Sheet returned for rework.')
      setTimeout(() => setSuccess(''), 3000)
      setExpanded(null)
      setEditedGoals({})
      fetchTeam()
    } else {
      const err = await res.json()
      setError(err.error)
    }
    setProcessing(null)
  }

  const updateGoal = (goalId: string, field: string, value: number) => {
    setEditedGoals(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }))
  }

  if (loading) return <div className="p-8 text-gray-400">Loading team goals...</div>

  const submitted = sheets.filter(s => s.status === 'SUBMITTED')
  const others = sheets.filter(s => s.status !== 'SUBMITTED')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Goals</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve your team's goal sheets</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Pending approval */}
      {submitted.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending Approval ({submitted.length})
          </h2>
          <div className="space-y-3">
            {submitted.map(sheet => {
              const isOpen = expanded === sheet.id
              const goals = sheet.goals || []
              const total = goals.reduce((sum: number, g: any) => {
                const edited = editedGoals[g.id]
                return sum + (edited?.weightage ?? g.weightage)
              }, 0)

              return (
                <div key={sheet.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : sheet.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold text-sm">
                        {sheet.employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{sheet.employee.name}</div>
                        <div className="text-xs text-gray-400">{sheet.employee.email} · {goals.length} goals</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                        Awaiting Review
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-4">
                      {/* Weightage bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Total Weightage</span>
                          <span className={total === 100 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                            {total}% / 100%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${total === 100 ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(total, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Goals table */}
                      <div className="space-y-2 mb-4">
                        {goals.map((goal: any) => (
                          <div key={goal.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-3">
                            <div className="col-span-5">
                              <div className="text-xs text-red-500 font-medium">{goal.thrustArea}</div>
                              <div className="text-sm text-gray-800 font-medium">{goal.title}</div>
                              <div className="text-xs text-gray-400">{goal.uomType}</div>
                            </div>
                            <div className="col-span-3">
                              <label className="text-xs text-gray-400">Target</label>
                              <input
                                type="number"
                                defaultValue={goal.target}
                                onChange={e => updateGoal(goal.id, 'target', parseFloat(e.target.value))}
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-400"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="text-xs text-gray-400">Weightage %</label>
                              <input
                                type="number"
                                defaultValue={goal.weightage}
                                onChange={e => updateGoal(goal.id, 'weightage', parseFloat(e.target.value))}
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(sheet.id, 'APPROVE')}
                          disabled={!!processing || total !== 100}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          <CheckCircle size={15} />
                          {processing === sheet.id + 'APPROVE' ? 'Approving...' : 'Approve & Lock'}
                        </button>
                        <button
                          onClick={() => handleReview(sheet.id, 'RETURN')}
                          disabled={!!processing}
                          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          <XCircle size={15} />
                          {processing === sheet.id + 'RETURN' ? 'Returning...' : 'Return for Rework'}
                        </button>
                      </div>
                      {total !== 100 && (
                        <p className="text-xs text-red-400 mt-2">Adjust weightages to total 100% before approving</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Other team members */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          All Team Members ({sheets.length})
        </h2>
        {sheets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <Users size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No team members assigned yet.</p>
            <p className="text-gray-300 text-xs mt-1">Ask Admin to assign employees to your team.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sheets.map(sheet => (
              <div key={sheet.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                    {sheet.employee.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{sheet.employee.name}</div>
                    <div className="text-xs text-gray-400">{sheet.goals.length} goals · {sheet.cycle.name}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[sheet.status]}`}>
                  {sheet.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
