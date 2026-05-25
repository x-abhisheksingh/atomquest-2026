import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const goalSheets = await prisma.goalSheet.findMany({
    where: { employeeId: user.id },
    include: { goals: { include: { achievements: true } }, cycle: true }
  })

  return NextResponse.json(goalSheets)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { thrustArea, title, description, uomType, target, weightage, goalSheetId } = body

  if (!thrustArea || !title || !uomType || target === undefined || weightage === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get or create active goal sheet
  let sheetId = goalSheetId
  if (!sheetId) {
    const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } })
    if (!cycle) return NextResponse.json({ error: 'No active goal cycle' }, { status: 400 })

    const existingSheet = await prisma.goalSheet.findFirst({
      where: { employeeId: user.id, cycleId: cycle.id }
    })

    if (existingSheet) {
      sheetId = existingSheet.id
    } else {
      const newSheet = await prisma.goalSheet.create({
        data: { employeeId: user.id, cycleId: cycle.id }
      })
      sheetId = newSheet.id
    }
  }

  // Validate max 8 goals
  const existingGoals = await prisma.goal.findMany({ where: { goalSheetId: sheetId } })
  if (existingGoals.length >= 8) {
    return NextResponse.json({ error: 'Maximum 8 goals allowed' }, { status: 400 })
  }

  // Validate weightage
  if (weightage < 10) {
    return NextResponse.json({ error: 'Minimum weightage is 10%' }, { status: 400 })
  }

  const totalExisting = existingGoals.reduce((sum, g) => sum + g.weightage, 0)
  if (totalExisting + weightage > 100) {
    return NextResponse.json({ error: `Weightage exceeds 100%. Available: ${100 - totalExisting}%` }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: { goalSheetId: sheetId, thrustArea, title, description, uomType, target, weightage }
  })

  return NextResponse.json(goal, { status: 201 })
}
