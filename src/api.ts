export type Gender = 'MALE' | 'FEMALE'
export type ActivityLevel = 'LOW' | 'NORMAL' | 'HIGH'
export type GoalType = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTAIN'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface UserProfileRequest {
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
}

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
}

interface ErrorResponse {
  message?: string
  fieldErrors?: Array<{ field: string; message: string }>
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
    throw new Error(fieldMessage || error.message || '요청 처리에 실패했습니다.')
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
  getFoods: () => request<FoodResponse[]>('/api/foods'),
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
}
