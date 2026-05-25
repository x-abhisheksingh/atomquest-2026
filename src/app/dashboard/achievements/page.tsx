'use client'
import { useState, useEffect } from 'react'
import { computeProgress, progressColor, progressBg } from '@/lib/progress'
import { AlertCircle, TrendingUp } from 'lucide-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const
const QUARTER_LABELS: Record<string, string> = {
  Q1: 'Q1 (Jul–Sep)',
  Q2: 'Q2 (Oct–Dec)',
  Q3: 'Q3 (Jan–Mar)',
  Q4: 'Q4 (Mar–Apr)'
}

const STATUS_OPTIONS = ['NOT_STARTED', 'ON_TRACK', 'COMPLETED'] as const
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

export default function AchievementsPage() {
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuarter, setActiveQuarter] = useState<string>('Q1')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<Record<string, { actual: string; status: string }>>({})

  const fetchGoals = async () => {
    setLoading(true)
    const res = await fetch('/api/goals')
    const data = await res.json()
    setGoalSheets(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [])

  const lockedSheet = goalSheets.find(s => s.status === 'LOCKED')
  const goals = lockedSheet?.goals || []

  const getAchievement = (goal: any, quarter: string) =>
    goal.achievements?.find((a: any) => a.quarter === quarter)

  const getFormVal = (goalId: string, quarter: string, field: 'actual' | 'status', fallback: string) => {
    const key = `${goalId}_${quarter}`
    return form[key]?.[field] ?? fallback
  }

  const setFormVal = (goalId: string, quarter: string, field: 'actual' | 'status', value: string) => {
    const key = `${goalId}_${quarter}`
    setForm(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
  }

  const handleSave = async (goalId: string, quarter: string) => {
    const key = `${goalId}_${quarter}`
    const goal = goals.find((g: any) => g.id === goalId)
    const existing = getAchievement(goal, quarter)

    const actual = form[key]?.actual ?? (existing?.actual?.toString() || '')
    const status = form[key]?.status ?? (existing?.status || 'NOT_STARTED')

    setSaving(key)
    setError('')

    const res = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId,
        quarter,
        actual: actual !== '' ? parseFloat(actual) : null,
        status
      })
    })

    if (res.ok) {
      setSuccess('Saved!')
      setTimeout(() => setSuccess(''), 2000)
      fetchGoals()
    } else {
      const err = await res.json()
      setError(err.error)
    }
    setSaving(null)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Achievement Tracking</h1>
        <p className="text-gray-500 text-sm mt-1">Log your quarterly actuals against targets</p>
      </div>

      {!lockedSheet && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-700 text-sm">Your goals must be approved by your manager before you can log achievements.</p>
        </div>
      )}

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

      {/* Quarter tabs */}
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

      <p className="text-xs text-gray-400 mb-4">{QUARTER_LABELS[activeQuarter]}</p>

      {/* Goals */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <TrendingUp size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No approved goals found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal: any) => {
            const existing = getAchievement(goal, activeQuarter)
            const actualVal = getFormVal(goal.id, activeQuarter, 'actual', existing?.actual?.toString() || '')
            const statusVal = getFormVal(goal.id, activeQuarter, 'status', existing?.status || 'NOT_STARTED')
            const score = computeProgress(goal.uomType, goal.target, actualVal !== '' ? parseFloat(actualVal) : null)
            const key = `${goal.id}_${activeQuarter}`

            return (
              <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded font-medium">{goal.thrustArea}</span>
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">{goal.uomType}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800">{goal.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Target: <strong>{goal.target}</strong> · Weightage: <strong>{goal.weightage}%</strong></p>
                  </div>

                  {/* Progress score */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${progressColor(score)}`}>{score}%</div>
                    <div className="text-xs text-gray-400">progress</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                  <div className={`h-1.5 rounded-full transition-all ${progressBg(score)}`}
                    style={{ width: `${score}%` }} />
                </div>

                {/* Input row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Actual Value</label>
                    <input
                      type="number"
                      value={actualVal}
                      onChange={e => setFormVal(goal.id, activeQuarter, 'actual', e.target.value)}
                      placeholder={`Target: ${goal.target}`}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      value={statusVal}
                      onChange={e => setFormVal(goal.id, activeQuarter, 'status', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleSave(goal.id, activeQuarter)}
                      disabled={saving === key}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
                    >
                      {saving === key ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Status badge */}
                {existing && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[existing.status]}`}>
                      {STATUS_LABELS[existing.status]}
                    </span>
                    <span className="text-xs text-gray-400">Last updated for {activeQuarter}</span>
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
