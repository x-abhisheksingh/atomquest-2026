'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Send, Target, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const UOM_LABELS: Record<string, string> = {
  MIN: 'Minimize (lower is better)',
  MAX: 'Maximize (higher is better)',
  TIMELINE: 'Timeline (date-based)',
  ZERO: 'Zero Target'
}

const THRUST_AREAS = [
  'Revenue Growth', 'Cost Reduction', 'Customer Satisfaction',
  'Product Innovation', 'Operational Efficiency', 'Team Development',
  'Quality Improvement', 'Market Expansion', 'Digital Transformation', 'Other'
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  LOCKED: 'bg-blue-100 text-blue-700'
}

export default function GoalsPage() {
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    thrustArea: '', title: '', description: '',
    uomType: 'MAX', target: '', weightage: ''
  })

  const fetchGoals = async () => {
    setLoading(true)
    const res = await fetch('/api/goals')
    const data = await res.json()
    setGoalSheets(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchGoals() }, [])

  const activeSheet = goalSheets[0]
  const goals = activeSheet?.goals || []
  const totalWeightage = goals.reduce((sum: number, g: any) => sum + g.weightage, 0)
  const isEditable = !activeSheet || activeSheet.status === 'DRAFT'

  const handleAddGoal = async () => {
    setError('')
    if (!form.thrustArea || !form.title || !form.target || !form.weightage) {
      setError('All fields except description are required'); return
    }
    const weightage = parseFloat(form.weightage)
    const target = parseFloat(form.target)
    if (weightage < 10) { setError('Minimum weightage is 10%'); return }
    if (totalWeightage + weightage > 100) {
      setError(`Only ${100 - totalWeightage}% weightage remaining`); return
    }

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form, target, weightage,
        goalSheetId: activeSheet?.id
      })
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error); return
    }

    setForm({ thrustArea: '', title: '', description: '', uomType: 'MAX', target: '', weightage: '' })
    setShowForm(false)
    setSuccess('Goal added!')
    setTimeout(() => setSuccess(''), 3000)
    fetchGoals()
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return
    await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    fetchGoals()
  }

  const handleSubmit = async () => {
    if (totalWeightage !== 100) {
      setError(`Total weightage must be 100%. Currently ${totalWeightage}%`); return
    }
    setSubmitting(true)
    const res = await fetch('/api/goals/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalSheetId: activeSheet.id })
    })
    if (res.ok) {
      setSuccess('Goal sheet submitted for approval!')
      setTimeout(() => setSuccess(''), 4000)
      fetchGoals()
    } else {
      const err = await res.json()
      setError(err.error)
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Goals</h1>
          <p className="text-gray-500 text-sm mt-1">FY 2026-27 · Goal Setting</p>
        </div>
        {activeSheet && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[activeSheet.status]}`}>
            {activeSheet.status}
          </span>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Weightage tracker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Total Weightage</span>
          <span className={`text-sm font-bold ${totalWeightage === 100 ? 'text-green-600' : totalWeightage > 100 ? 'text-red-600' : 'text-gray-800'}`}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${totalWeightage === 100 ? 'bg-green-500' : totalWeightage > 100 ? 'bg-red-500' : 'bg-red-400'}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{goals.length} / 8 goals</span>
          <span>{100 - totalWeightage}% remaining</span>
        </div>
      </div>

      {/* Goal list */}
      <div className="space-y-3 mb-6">
        {goals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <Target size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No goals yet. Add your first goal below.</p>
          </div>
        )}
        {goals.map((goal: any) => (
          <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">
                    {goal.thrustArea}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    {goal.uomType}
                  </span>
                </div>
                <h3 className="font-medium text-gray-800">{goal.title}</h3>
                {goal.description && <p className="text-gray-400 text-sm mt-0.5">{goal.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Target: <strong>{goal.target}</strong></span>
                  <span>Weightage: <strong>{goal.weightage}%</strong></span>
                </div>
              </div>
              {isEditable && (
                <button onClick={() => handleDelete(goal.id)}
                  className="text-gray-300 hover:text-red-500 transition mt-1">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add goal form */}
      {isEditable && (
        <>
          {showForm ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-4">Add New Goal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Thrust Area</label>
                  <select value={form.thrustArea} onChange={e => setForm({ ...form, thrustArea: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                    <option value="">Select area</option>
                    {THRUST_AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">UoM Type</label>
                  <select value={form.uomType} onChange={e => setForm({ ...form, uomType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                    {Object.entries(UOM_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Goal Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Increase quarterly revenue by 20%"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Additional context or details..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Target Value</label>
                  <input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Weightage % <span className="text-gray-400">(min 10%, {100 - totalWeightage}% left)</span>
                  </label>
                  <input type="number" value={form.weightage} onChange={e => setForm({ ...form, weightage: e.target.value })}
                    placeholder="e.g. 20"
                    min={10} max={100 - totalWeightage}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddGoal}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Add Goal
                </button>
                <button onClick={() => { setShowForm(false); setError('') }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl py-3 text-sm transition mb-4">
              <Plus size={16} /> Add Goal
            </button>
          )}

          {/* Submit button */}
          {goals.length > 0 && activeSheet?.status === 'DRAFT' && (
            <button onClick={handleSubmit} disabled={submitting || totalWeightage !== 100}
              className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2d2d4e] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-medium transition">
              <Send size={16} />
              {submitting ? 'Submitting...' : totalWeightage === 100 ? 'Submit for Approval' : `Total weightage must be 100% (${totalWeightage}% now)`}
            </button>
          )}
        </>
      )}

      {/* Submitted state message */}
      {activeSheet?.status === 'SUBMITTED' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-700 text-sm font-medium">Goal sheet submitted — awaiting manager approval</p>
        </div>
      )}

      {activeSheet?.status === 'LOCKED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-700 text-sm font-medium">Goals are locked and approved ✓</p>
        </div>
      )}
    </div>
  )
}
