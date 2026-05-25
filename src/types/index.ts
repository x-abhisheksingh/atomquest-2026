export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
export type UoMType = 'MIN' | 'MAX' | 'TIMELINE' | 'ZERO'
export type GoalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED'
export type AchievementStatus = 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  managerId?: string
}

export interface GoalCycle {
  id: string
  name: string
  year: number
  isActive: boolean
}

export interface Goal {
  id: string
  goalSheetId: string
  thrustArea: string
  title: string
  description?: string
  uomType: UoMType
  target: number
  weightage: number
  isShared: boolean
  achievements?: Achievement[]
}

export interface GoalSheet {
  id: string
  employeeId: string
  employee?: User
  cycleId: string
  status: GoalStatus
  goals: Goal[]
}

export interface Achievement {
  id: string
  goalId: string
  quarter: Quarter
  actual?: number
  status: AchievementStatus
}

export interface CheckIn {
  id: string
  goalId: string
  managerId: string
  quarter: Quarter
  comment: string
  createdAt: string
}
