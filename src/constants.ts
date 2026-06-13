import type { ActivityLevel, GoalType, MealType } from './api'

export const today = new Date().toISOString().slice(0, 10)

export const goalLabels: Record<GoalType, string> = {
  WEIGHT_LOSS: '다이어트',
  MUSCLE_GAIN: '벌크업',
  MAINTAIN: '체중 유지',
}

export const goalDescriptions: Record<GoalType, string> = {
  WEIGHT_LOSS: '기초대사량 아래로는 내려가지 않는 안전한 칼로리 적자 · 고단백 구성',
  MUSCLE_GAIN: '활동량에 맞춘 칼로리 잉여 · 운동 회복을 위한 고탄수 구성',
  MAINTAIN: '현재 체중 유지를 위한 균형 잡힌 탄단지 구성',
}

export const goalEmojis: Record<GoalType, string> = {
  WEIGHT_LOSS: '🔥',
  MUSCLE_GAIN: '💪',
  MAINTAIN: '⚖️',
}

export const activityLabels: Record<ActivityLevel, string> = {
  LOW: '낮음 (거의 운동 안 함)',
  NORMAL: '보통 (주 3~5회)',
  HIGH: '높음 (주 6~7회)',
}

export const mealLabels: Record<MealType, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
}
