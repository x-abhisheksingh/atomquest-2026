import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { goalSheetId, action, goals } = await req.json()
  // action: 'APPROVE' | 'RETURN'

  if (!goalSheetId || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { employee: true }
  })

  if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })
  if (sheet.employee.managerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (action === 'APPROVE') {
    // Update any inline edits to goals first
    if (goals && goals.length > 0) {
      for (const goal of goals) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: { target: goal.target, weightage: goal.weightage }
        })
      }
    }

    // Validate total weightage before approving
    const updatedGoals = await prisma.goal.findMany({ where: { goalSheetId } })
    const total = updatedGoals.reduce((sum, g) => sum + g.weightage, 0)
    if (total !== 100) {
      return NextResponse.json({ error: `Total weightage must be 100%. Currently ${total}%` }, { status: 400 })
    }

    await prisma.goalSheet.update({
      where: { id: goalSheetId },
      data: { status: 'LOCKED' }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        entityType: 'GoalSheet',
        entityId: goalSheetId,
        changedBy: user.id,
        changeType: 'APPROVED',
        after: { status: 'LOCKED' }
      }
    })
  }

  if (action === 'RETURN') {
    await prisma.goalSheet.update({
      where: { id: goalSheetId },
      data: { status: 'DRAFT' }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'GoalSheet',
        entityId: goalSheetId,
        changedBy: user.id,
        changeType: 'RETURNED',
        after: { status: 'DRAFT' }
      }
    })
  }

  return NextResponse.json({ success: true })
}
