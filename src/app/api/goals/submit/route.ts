import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { goalSheetId } = await req.json()

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { goals: true }
  })

  if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })
  if (sheet.employeeId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (sheet.goals.length === 0) return NextResponse.json({ error: 'Add at least one goal' }, { status: 400 })

  const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0)
  if (totalWeightage !== 100) {
    return NextResponse.json({ error: `Total weightage must be 100%. Currently: ${totalWeightage}%` }, { status: 400 })
  }

  const updated = await prisma.goalSheet.update({
    where: { id: goalSheetId },
    data: { status: 'SUBMITTED' }
  })

  return NextResponse.json(updated)
}
