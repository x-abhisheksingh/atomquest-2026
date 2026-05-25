import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { goalId, quarter, actual, status } = await req.json()

  if (!goalId || !quarter || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify goal belongs to this user
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true }
  })

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  if (goal.goalSheet.employeeId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (goal.goalSheet.status !== 'LOCKED') {
    return NextResponse.json({ error: 'Goals must be approved before logging achievements' }, { status: 400 })
  }

  const achievement = await prisma.achievement.upsert({
    where: { goalId_quarter: { goalId, quarter } },
    update: { actual: actual ?? null, status },
    create: { goalId, quarter, actual: actual ?? null, status }
  })

  return NextResponse.json(achievement)
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const achievements = await prisma.achievement.findMany({
    where: { goal: { goalSheet: { employeeId: user.id } } },
    include: { goal: true }
  })

  return NextResponse.json(achievements)
}
