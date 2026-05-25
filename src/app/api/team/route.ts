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
    where: { employee: { managerId: user.id } },
    include: {
      employee: true,
      cycle: true,
      goals: { include: { achievements: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return NextResponse.json(teamSheets)
}
