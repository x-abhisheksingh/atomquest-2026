'use client'
import { useState, useEffect } from 'react'
import { Download, BarChart2, Users, CheckCircle, Clock } from 'lucide-react'
import { computeProgress } from '@/lib/progress'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  LOCKED: 'bg-blue-100 text-blue-700'
}

export default function ReportsPage() {
  const [sheets, setSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuarter, setActiveQuarter] = useState('Q1')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/reports/achievement')
      .then(r => r.json())
      .then(d => { setSheets(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const handleExport = async () => {
    setDownloading(true)
    const res = await fetch('/api/reports/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'atomquest-achievement-report.csv'
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(false)
  }

  const totalEmployees = sheets.length
  const locked = sheets.filter(s => s.status === 'LOCKED').length
  const submitted = sheets.filter(s => s.status === 'SUBMITTED').length
  const draft = sheets.filter(s => s.status === 'DRAFT').length

  const avgProgress = sheets.length > 0 ? Math.round(
    sheets.flatMap(s => s.goals.map((g: any) => {
      const ach = g.achievements?.find((a: any) => a.quarter === activeQuarter)
      return computeProgress(g.uomType, g.target, ach?.actual ?? null)
    })).reduce((a: number, b: number) => a + b, 0) /
    Math.max(1, sheets.flatMap((s: any) => s.goals).length)
  ) : 0

  if (loading) return <div className="p-8 text-gray-400">Loading reports...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Organisation-wide goal achievement overview</p>
        </div>
        <button
          onClick={handleExport}
          disabled={downloading}
          className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#2d2d4e] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Download size={15} />
          {downloading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: totalEmployees, icon: Users, color: 'text-blue-500' },
          { label: 'Goals Locked', value: locked, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending Review', value: submitted, icon: Clock, color: 'text-yellow-500' },
          { label: `Avg Progress (${activeQuarter})`, value: `${avgProgress}%`, icon: BarChart2, color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quarter selector */}
      <div className="flex gap-2 mb-6">
        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
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

      {/* Employee achievement table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Goals</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sheet Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{activeQuarter} Progress</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sheets.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No data yet</td>
              </tr>
            ) : sheets.map(sheet => {
              const scores = sheet.goals.map((g: any) => {
                const ach = g.achievements?.find((a: any) => a.quarter === activeQuarter)
                return computeProgress(g.uomType, g.target, ach?.actual ?? null)
              })
              const avg = scores.length > 0
                ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
                : 0

              return (
                <tr key={sheet.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{sheet.employee.name}</div>
                    <div className="text-xs text-gray-400">{sheet.employee.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sheet.goals.length}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sheet.status]}`}>
                      {sheet.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${avg >= 80 ? 'bg-green-500' : avg >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{avg}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${avg >= 80 ? 'text-green-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {avg}%
                    </span>
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
