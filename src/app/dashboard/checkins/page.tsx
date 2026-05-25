'use client'
import { useState, useEffect } from 'react'
import { computeProgress, progressColor, progressBg } from '@/lib/progress'
import { MessageSquare, ChevronDown, ChevronUp, AlertCircle, Send } from 'lucide-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  ON_TRACK: 'On Track',
  COMPLETED: 'Completed'
}
const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-500',
  ON_TRACK: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700'
}

export default function CheckInsPage() {
  const [sheets, setSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuarter, setActiveQuarter] = useState('Q1')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchCheckIns = async () => {
    setLoading(true)
    const res = await fetch('/api/checkins')
    const data = await res.json()
    setSheets(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchCheckIns() }, [])

  const handleCheckIn = async (goalId: string) => {
    const comment = comments[goalId]?.trim()
    if (!comment) { setError('Please enter a comment'); return }

    setSaving(goalId)
    setError('')

    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, quarter: activeQuarter, comment })
    })

    if (res.ok) {
      setSuccess('Check-in saved!')
      setTimeout(() => setSuccess(''), 2000)
      setComments(prev => ({ ...prev, [goalId]: '' }))
      fetchCheckIns()
    } else {
      const err = await res.json()
      setError(err.error)
    }
    setSaving(null)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading check-ins...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manager Check-ins</h1>
        <p className="text-gray-500 text-sm mt-1">Review team progress and log quarterly feedback</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-green-600 text-sm">✓ {success}</p>
        </div>
      )}

      {/* Quarter selector */}
      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setActiveQuarter(q)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeQuarter === q
                ? 'bg-[#1A1A2E] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-800'
            }`}>
            {q}
          </button>
        ))}
      </div>

      {sheets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No approved team goals yet.</p>
          <p className="text-gray-300 text-xs mt-1">Approve employee goal sheets first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sheets.map(sheet => {
            const isOpen = expanded === sheet.id
            const goals = sheet.goals || []

            // Overall progress for this employee this quarter
            const scores = goals.map((g: any) => {
              const ach = g.achievements?.find((a: any) => a.quarter === activeQuarter)
              return computeProgress(g.uomType, g.target, ach?.actual ?? null)
            })
            const avgScore = scores.length > 0
              ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
              : 0

            const checkedInCount = goals.filter((g: any) =>
              g.checkIns?.some((c: any) => c.quarter === activeQuarter)
            ).length

            return (
              <div key={sheet.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Employee header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : sheet.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white font-semibold text-sm">
                      {sheet.employee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{sheet.employee.name}</div>
                      <div className="text-xs text-gray-400">
                        {goals.length} goals · {checkedInCount}/{goals.length} checked in for {activeQuarter}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${progressColor(avgScore)}`}>{avgScore}%</div>
                      <div className="text-xs text-gray-400">avg progress</div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded goals */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {goals.map((goal: any) => {
                      const achievement = goal.achievements?.find((a: any) => a.quarter === activeQuarter)
                      const score = computeProgress(goal.uomType, goal.target, achievement?.actual ?? null)
                      const existingCheckIn = goal.checkIns?.find((c: any) => c.quarter === activeQuarter)
                      const allCheckIns = goal.checkIns?.filter((c: any) => c.quarter === activeQuarter) || []

                      return (
                        <div key={goal.id} className="bg-gray-50 rounded-xl p-4">
                          {/* Goal info */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded font-medium">{goal.thrustArea}</span>
                                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">{goal.uomType}</span>
                              </div>
                              <h4 className="font-medium text-gray-800">{goal.title}</h4>
                            </div>
                            <div className={`text-xl font-bold ${progressColor(score)}`}>{score}%</div>
                          </div>

                          {/* Planned vs Actual */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-400 mb-1">Target</div>
                              <div className="font-semibold text-gray-800">{goal.target}</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-400 mb-1">Actual</div>
                              <div className="font-semibold text-gray-800">
                                {achievement?.actual ?? '—'}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-400 mb-1">Status</div>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[achievement?.status || 'NOT_STARTED']}`}>
                                {STATUS_LABELS[achievement?.status || 'NOT_STARTED']}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                            <div className={`h-1.5 rounded-full ${progressBg(score)}`}
                              style={{ width: `${score}%` }} />
                          </div>

                          {/* Previous check-ins */}
                          {allCheckIns.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {allCheckIns.map((ci: any) => (
                                <div key={ci.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-600">{ci.manager?.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(ci.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{ci.comment}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add check-in */}
                          <div className="flex gap-2">
                            <input
                              value={comments[goal.id] || ''}
                              onChange={e => setComments(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              placeholder="Add check-in comment..."
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                              onKeyDown={e => e.key === 'Enter' && handleCheckIn(goal.id)}
                            />
                            <button
                              onClick={() => handleCheckIn(goal.id)}
                              disabled={saving === goal.id}
                              className="flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2d2d4e] disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                              <Send size={14} />
                              {saving === goal.id ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
