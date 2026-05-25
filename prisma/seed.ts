import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { id: '3f7915f8-f756-4817-8770-1de34b27aaad', email: 'admin@demo.com', name: 'Admin HR', role: 'ADMIN' }
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: { id: '35f6cf0b-125f-415f-84da-b6331f02b78b', email: 'manager@demo.com', name: 'Manager L1', role: 'MANAGER' }
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: {},
    create: { id: '5f8a1a67-cfa1-40d4-b7a8-c5c52e8df2b9', email: 'employee@demo.com', name: 'Abhishek Singh', role: 'EMPLOYEE', managerId: manager.id }
  })

  await prisma.goalCycle.upsert({
    where: { id: 'cycle-2026' },
    update: {},
    create: { id: 'cycle-2026', name: 'FY 2026-27', year: 2026, isActive: true }
  })

  console.log('Seeded:', { admin, manager, employee })
}

main().catch(console.error).finally(() => prisma.$disconnect())
