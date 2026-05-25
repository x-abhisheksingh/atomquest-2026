'use client'
import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'

const CHANGE_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  RETURNED: 'bg-red-100 text-red-600',
  UNLOCKED: 'bg-purple-100 text-purple-700',
  EDITED: 'bg-yellow-100 text-yellow-700',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading audit log...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Trail</h1>
        <p className="text-gray-500 text-sm mt-1">Full log of all goal sheet changes</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <FileText size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No audit entries yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                {log.changer?.name?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800 text-sm">{log.changer?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANGE_COLORS[log.changeType] || 'bg-gray-100 text-gray-500'}`}>
                    {log.changeType}
                  </span>
                  <span className="text-xs text-gray-400">{log.entityType}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.after && (
                  <p className="text-xs text-gray-500 mt-1">
                    → {JSON.stringify(log.after)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
