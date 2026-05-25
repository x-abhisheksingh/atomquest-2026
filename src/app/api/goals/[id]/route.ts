import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { goalSheet: true }
  })

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  if (goal.goalSheet.employeeId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (goal.goalSheet.status === 'LOCKED' || goal.goalSheet.status === 'APPROVED') {
    return NextResponse.json({ error: 'Cannot delete goals from approved/locked sheet' }, { status: 400 })
  }

  await prisma.goal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
