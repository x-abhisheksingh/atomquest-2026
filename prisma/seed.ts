import { PrismaClient, Role } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // These UUIDs must match Supabase Auth user IDs
  // We'll update them after creating users in Supabase dashboard

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { id: '3f7915f8-f756-4817-8770-1de34b27aaad', email: 'admin@demo.com', name: 'Admin HR', role: Role.ADMIN }
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: { id: '5f8a1a67-cfa1-40d4-b7a8-c5c52e8df2b9', email: 'manager@demo.com', name: 'Manager L1', role: Role.MANAGER }
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: {},
    create: { id: '35f6cf0b-125f-415f-84da-b6331f02b78b', email: 'employee@demo.com', name: 'Abhishek Singh', role: Role.EMPLOYEE, managerId: manager.id }
  })

  // Create active goal cycle
  await prisma.goalCycle.upsert({
    where: { id: 'cycle-2026' },
    update: {},
    create: { id: 'cycle-2026', name: 'FY 2026-27', year: 2026, isActive: true }
  })

  console.log('Seeded:', { admin, manager, employee })
}

main().catch(console.error).finally(() => prisma.$disconnect())
