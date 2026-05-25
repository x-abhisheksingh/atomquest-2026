import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const teamSheets = await prisma.goalSheet.findMany({
    where: {
      employee: { managerId: user.id },
      status: 'LOCKED'
    },
    include: {
      employee: true,
      goals: {
        include: {
          achievements: true,
          checkIns: {
            include: { manager: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  })

  return NextResponse.json(teamSheets)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { goalId, quarter, comment } = await req.json()
  if (!goalId || !quarter || !comment?.trim()) {
    return NextResponse.json({ error: 'Goal, quarter and comment are required' }, { status: 400 })
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: { include: { employee: true } } }
  })

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  if (goal.goalSheet.employee.managerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const checkIn = await prisma.checkIn.create({
    data: { goalId, managerId: user.id, quarter, comment: comment.trim() }
  })

  return NextResponse.json(checkIn)
}
