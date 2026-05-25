import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { computeProgress } from '@/lib/progress'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sheets = await prisma.goalSheet.findMany({
    include: {
      employee: true,
      cycle: true,
      goals: { include: { achievements: true } }
    }
  })

  // Build CSV
  const rows: string[] = []
  rows.push([
    'Employee', 'Email', 'Cycle', 'Thrust Area', 'Goal Title',
    'UoM', 'Target', 'Weightage',
    'Q1 Actual', 'Q1 Status', 'Q1 Score%',
    'Q2 Actual', 'Q2 Status', 'Q2 Score%',
    'Q3 Actual', 'Q3 Status', 'Q3 Score%',
    'Q4 Actual', 'Q4 Status', 'Q4 Score%',
    'Sheet Status'
  ].join(','))

  for (const sheet of sheets) {
    for (const goal of sheet.goals) {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
      const qData = quarters.map(q => {
        const ach = goal.achievements.find(a => a.quarter === q)
        const score = computeProgress(goal.uomType as any, goal.target, ach?.actual ?? null)
        return [ach?.actual ?? '', ach?.status ?? 'NOT_STARTED', score]
      }).flat()

      rows.push([
        `"${sheet.employee.name}"`,
        sheet.employee.email,
        `"${sheet.cycle.name}"`,
        `"${goal.thrustArea}"`,
        `"${goal.title}"`,
        goal.uomType,
        goal.target,
        goal.weightage,
        ...qData,
        sheet.status
      ].join(','))
    }
  }

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="atomquest-achievement-report.csv"'
    }
  })
}
