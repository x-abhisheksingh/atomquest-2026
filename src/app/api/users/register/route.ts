import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const { id, name, email, role } = await req.json()

    if (!id || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only allow EMPLOYEE or MANAGER via self-registration
    const allowedRoles: Role[] = [Role.EMPLOYEE, Role.MANAGER]
    const userRole = allowedRoles.includes(role) ? role : Role.EMPLOYEE

    const user = await prisma.user.create({
      data: { id, name, email, role: userRole }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
