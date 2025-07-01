export interface User {
  id: "ruqaiyah" | "sakib"
  name: string
  role: "user" | "admin"
}

export interface Meal {
  id: string
  name: string
  scheduledTime: string
  pointsOnTime: number
  pointsLate: number
  penaltySkipped: number
  status: "pending" | "completed-on-time" | "completed-late" | "missed"
  completedAt?: string
  date: string
}

export interface MealTemplate {
  id: string
  name: string
  scheduledTime: string
  pointsOnTime: number
  pointsLate: number
  penaltySkipped: number
  order: number
  active: boolean
  type?: "meal" | "day-begin" | "day-end" // Add type field
}

export interface DailyData {
  id: string
  date: string
  dayBeginPoints: number
  dayEndPoints: number
  dayBeginTime: string
  dayEndTime: string
  noteOfTheDay: string
  meals: Meal[]
  bonusPoints: BonusPoint[]
  totalPoints: number
}

export interface BonusPoint {
  id: string
  points: number
  reason: string
  timestamp: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  points: number
  completed: boolean
  completedAt?: string
  icon: string
}

export interface UserProfile {
  id: string
  name: string
  totalPoints: number
  currentLevel: number
  currentStreak: number
  bestStreak: number
  totalMealsCompleted: number
  totalMealsOnTime: number
  joinedDate: string
  lastActiveDate: string
  lastNotificationCheck: string
}

export interface Notification {
  id: string
  type: "meal_completed" | "achievement_unlocked" | "bonus_points" | "level_up"
  title: string
  message: string
  points?: number
  timestamp: string
  read: boolean
  icon: string
}

export interface UserStats {
  totalPointsToday: number
  totalPointsMonth: number
  currentStreak: number
  punctualityPercentage: number
  bestAchievements: Achievement[]
}

export interface DaySettings {
  dayBeginTime: string
  dayEndTime: string
  dayBeginPoints: number
  dayEndPoints: number
}
