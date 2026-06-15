import type { ActivityLevel, ExerciseType, FoodGrade, GoalType, Intensity, MealType } from './api'

export const exerciseLabels: Record<ExerciseType, string> = {
  WALKING: '걷기',
  RUNNING: '달리기',
  CYCLING: '자전거',
  WEIGHT_TRAINING: '근력운동',
  SWIMMING: '수영',
}

export const intensityLabels: Record<Intensity, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
}

/** 음식 신호등 등급별 라벨·색상 */
export const gradeMeta: Record<FoodGrade, { label: string; color: string }> = {
  GREEN: { label: '권장', color: '#16a34a' },
  YELLOW: { label: '적당히', color: '#f59e0b' },
  RED: { label: '주의', color: '#ef4444' },
}

/** 로컬 시간대 기준 YYYY-MM-DD 문자열 (toISOString의 UTC 보정 오차를 피한다) */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const today = localDateString()

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
