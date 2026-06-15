export type Gender = 'MALE' | 'FEMALE'
export type ActivityLevel = 'LOW' | 'NORMAL' | 'HIGH'
export type GoalType = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTAIN'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type ExerciseType = 'WALKING' | 'RUNNING' | 'CYCLING' | 'WEIGHT_TRAINING' | 'SWIMMING'
export type Intensity = 'LOW' | 'MEDIUM' | 'HIGH'
export type FoodSortType = 'RECOMMENDED' | 'LOW_CALORIE' | 'HIGH_PROTEIN'

export interface SignupRequest {
  email: string
  password: string
  nickname: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
}

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
  sugarGrams: number
  sodiumMg: number
  saturatedFatGrams: number
  fiberGrams: number
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
export const TOKEN_STORAGE_KEY = 'pdm.token'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...init?.headers,
      },
      ...init,
    })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.')
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.location.href = '/login'
    }
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

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('서버 응답을 읽을 수 없습니다.')
  }
}

export const api = {
  signup: (body: SignupRequest) =>
    request<void>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: LoginRequest) =>
    request<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createProfile: (body: UserProfileRequest) =>
    request<UserProfileResponse>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getProfile: () =>
    request<UserProfileResponse>('/api/profiles/me'),
  updateProfile: (body: UserProfileRequest) =>
    request<UserProfileResponse>('/api/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  calculateCalories: (body: CalorieRequest) =>
    request<CalorieResponse>('/api/calories/recommendation', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getFoods: (goalType?: GoalType, sortType?: FoodSortType) => {
    const params = new URLSearchParams()
    if (goalType) {
      params.set('goalType', goalType)
    }
    if (sortType) {
      params.set('sortType', sortType)
    }
    const query = params.toString()
    return request<FoodResponse[]>('/api/foods' + (query ? `?${query}` : ''))
  },
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
  getDailyMealLogs: (date: string) =>
    request<DailyMealLogResponse>(`/api/meal-logs?date=${date}`),
  getDailyReport: (date: string) =>
    request<DailyReportResponse>(`/api/reports/daily?date=${date}`),
  getWeeklyReport: (endDate: string) =>
    request<WeeklyReportResponse>(
      `/api/reports/weekly?endDate=${endDate}`,
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
