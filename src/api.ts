export type Gender = 'MALE' | 'FEMALE'
export type ActivityLevel = 'LOW' | 'NORMAL' | 'HIGH'
export type GoalType = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTAIN'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type ExerciseType = 'WALKING' | 'RUNNING' | 'CYCLING' | 'WEIGHT_TRAINING' | 'SWIMMING'
export type Intensity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface UserProfileRequest {
  name: string
  gender: Gender
  age: number
  height: number
  weight: number
  activityLevel: ActivityLevel
  goalType: GoalType
}

export interface UserProfileResponse extends UserProfileRequest {
  profileId: number
}

export type CalorieRequest = UserProfileRequest

export interface MacroNutrients {
  proteinGrams: number
  carbGrams: number
  fatGrams: number
}

export interface CalorieResponse {
  goalType: GoalType
  recommendedCalories: number
  macros: MacroNutrients
}

export interface FoodResponse {
  foodId: number
  name: string
  calories: number
  servingSize: string
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  grade?: FoodGrade | null
}

export type FoodGrade = 'GREEN' | 'YELLOW' | 'RED'

export interface MealLogRequest {
  profileId: number
  mealDate: string
  mealType: MealType
  foodId: number
  quantity: number
}

export interface MealLogResponse {
  mealLogId: number
  profileId: number
  mealDate: string
  mealType: MealType
  foodId: number
  foodName: string
  calories: number
  quantity: number
  totalCalories: number
}

export interface DailyMealLogResponse {
  profileId: number
  mealDate: string
  mealLogs: MealLogResponse[]
  dailyTotalCalories: number
}

export interface DailyReportResponse {
  profileId: number
  date: string
  recommendedCalories: number
  intakeCalories: number
  difference: number
  status: 'UNDER' | 'OVER' | 'MATCH'
  message: string
  recommendedMacros: MacroNutrients
  intakeMacros: MacroNutrients
  burnedCalories: number
  netCalories: number
}

export interface ExerciseLogRequest {
  profileId: number
  exerciseDate: string
  exerciseType: ExerciseType
  durationMinutes: number
  intensity: Intensity
}

export interface ExerciseLogResponse {
  exerciseLogId: number
  exerciseDate: string
  exerciseType: ExerciseType
  durationMinutes: number
  intensity: Intensity
  burnedCalories: number
}

export interface DailyExerciseLogResponse {
  profileId: number
  exerciseDate: string
  exerciseLogs: ExerciseLogResponse[]
  dailyTotalBurned: number
}

export interface WeeklyReportDay {
  date: string
  recommendedCalories: number
  intakeCalories: number
}

export interface WeeklyReportResponse {
  profileId: number
  days: WeeklyReportDay[]
}

export interface StatsResponse {
  streak: number
  weeklyAchievedDays: number
  weeklyLoggedDays: number
  achievementRate: number
}

export interface WeightLogRequest {
  profileId: number
  logDate: string
  weight: number
}

export interface WeightLogResponse {
  weightLogId: number
  logDate: string
  weight: number
}

interface ErrorResponse {
  message?: string
  fieldErrors?: Array<{ field: string; message: string }>
}

/** HTTP 상태코드를 함께 전달하는 API 오류 */
export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * 저장된 프로필이 서버에 없는 경우(예: 서버 재시작으로 인메모리 DB 초기화)인지 판별한다.
 * 단순 404(예: 미배포 엔드포인트)와 구분하기 위해 프로필 관련 메시지인지까지 확인한다.
 */
export function isProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404 && error.message.includes('프로필')
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      ...init,
    })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.')
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ErrorResponse
    const fieldMessage = error.fieldErrors?.map((item) => item.message).join('\n')
    throw new ApiError(
      fieldMessage || error.message || '요청 처리에 실패했습니다.',
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json().catch(() => {
    throw new Error('서버 응답을 읽을 수 없습니다.')
  }) as Promise<T>
}

export const api = {
  createProfile: (body: UserProfileRequest) =>
    request<UserProfileResponse>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getProfile: (profileId: number) =>
    request<UserProfileResponse>(`/api/profiles/${profileId}`),
  updateProfile: (profileId: number, body: UserProfileRequest) =>
    request<UserProfileResponse>(`/api/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  calculateCalories: (body: CalorieRequest) =>
    request<CalorieResponse>('/api/calories/recommendation', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getFoods: (goalType?: GoalType) =>
    request<FoodResponse[]>('/api/foods' + (goalType ? `?goalType=${goalType}` : '')),
  createMealLog: (body: MealLogRequest) =>
    request<MealLogResponse>('/api/meal-logs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateMealLog: (mealLogId: number, body: MealLogRequest) =>
    request<MealLogResponse>(`/api/meal-logs/${mealLogId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteMealLog: (mealLogId: number) =>
    request<void>(`/api/meal-logs/${mealLogId}`, {
      method: 'DELETE',
    }),
  getDailyMealLogs: (profileId: number, date: string) =>
    request<DailyMealLogResponse>(`/api/meal-logs?profileId=${profileId}&date=${date}`),
  getDailyReport: (profileId: number, date: string) =>
    request<DailyReportResponse>(`/api/reports/daily?profileId=${profileId}&date=${date}`),
  getWeeklyReport: (profileId: number, endDate: string) =>
    request<WeeklyReportResponse>(
      `/api/reports/weekly?profileId=${profileId}&endDate=${endDate}`,
    ),
  getStats: (profileId: number, endDate: string) =>
    request<StatsResponse>(`/api/reports/stats?profileId=${profileId}&endDate=${endDate}`),
  recordWeight: (body: WeightLogRequest) =>
    request<WeightLogResponse>('/api/weight-logs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getWeightLogs: (profileId: number) =>
    request<WeightLogResponse[]>(`/api/weight-logs?profileId=${profileId}`),
  createExerciseLog: (body: ExerciseLogRequest) =>
    request<ExerciseLogResponse>('/api/exercise-logs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getExerciseLogs: (profileId: number, date: string) =>
    request<DailyExerciseLogResponse>(
      `/api/exercise-logs?profileId=${profileId}&date=${date}`,
    ),
  deleteExerciseLog: (exerciseLogId: number) =>
    request<void>(`/api/exercise-logs/${exerciseLogId}`, { method: 'DELETE' }),
}
