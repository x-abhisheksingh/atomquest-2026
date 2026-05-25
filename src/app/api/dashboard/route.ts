import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { computeProgress } from '@/lib/progress'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (dbUser.role === 'EMPLOYEE') {
      const sheet = await prisma.goalSheet.findFirst({
        where: { employeeId: user.id },
        include: { goals: { include: { achievements: true } } }
      })

      const goals = sheet?.goals || []
      const scores = goals.flatMap((g: any) =>
      g.achievements.map((a: any) => computeProgress(g.uomType as any, g.target, a.actual))
      )
      const avgProgress = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0

      const checkIns = await prisma.checkIn.count({
        where: { goal: { goalSheet: { employeeId: user.id } } }
      })

      return NextResponse.json({
        totalGoals: goals.length,
        approved: sheet?.status === 'LOCKED' ? goals.length : 0,
        avgProgress,
        checkIns
      })
    }

    if (dbUser.role === 'MANAGER') {
      const teamSheets = await prisma.goalSheet.findMany({
        where: { employee: { managerId: user.id } },
        include: { goals: { include: { achievements: true } } }
      })

      const pending = teamSheets.filter(s => s.status === 'SUBMITTED').length
      const approved = teamSheets.filter(s => s.status === 'LOCKED').length
      const totalGoals = teamSheets.flatMap(s => s.goals).length
      const checkIns = await prisma.checkIn.count({ where: { managerId: user.id } })

      return NextResponse.json({ totalGoals, approved, avgProgress: 0, checkIns, pending })
    }

    if (dbUser.role === 'ADMIN') {
      const totalUsers = await prisma.user.count()
      const totalSheets = await prisma.goalSheet.count()
      const locked = await prisma.goalSheet.count({ where: { status: 'LOCKED' } })
      const submitted = await prisma.goalSheet.count({ where: { status: 'SUBMITTED' } })

      return NextResponse.json({
        totalGoals: totalUsers,
        approved: locked,
        avgProgress: submitted,
        checkIns: totalSheets
      })
    }

    return NextResponse.json({})
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
