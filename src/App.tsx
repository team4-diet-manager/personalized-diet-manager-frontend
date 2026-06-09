import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity,
  Apple,
  Calculator,
  CalendarDays,
  Database,
  RefreshCw,
  Save,
  Utensils,
} from 'lucide-react'
import './App.css'
import { api } from './api'
import type {
  ActivityLevel,
  DailyMealLogResponse,
  DailyReportResponse,
  FoodResponse,
  Gender,
  GoalType,
  MealType,
  UserProfileRequest,
  UserProfileResponse,
} from './api'

const today = new Date().toISOString().slice(0, 10)

const goalLabels: Record<GoalType, string> = {
  WEIGHT_LOSS: '다이어트',
  MUSCLE_GAIN: '벌크업',
  MAINTAIN: '체중 유지',
}

const activityLabels: Record<ActivityLevel, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
}

const mealLabels: Record<MealType, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
}

function App() {
  const [profileForm, setProfileForm] = useState<UserProfileRequest>({
    gender: 'FEMALE',
    age: 23,
    height: 162,
    weight: 55,
    activityLevel: 'NORMAL',
    goalType: 'WEIGHT_LOSS',
  })
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [foodId, setFoodId] = useState(1)
  const [mealDate, setMealDate] = useState(today)
  const [mealType, setMealType] = useState<MealType>('LUNCH')
  const [quantity, setQuantity] = useState(1)
  const [calorieResult, setCalorieResult] = useState<number | null>(null)
  const [dailyLogs, setDailyLogs] = useState<DailyMealLogResponse | null>(null)
  const [dailyReport, setDailyReport] = useState<DailyReportResponse | null>(null)
  const [notice, setNotice] = useState('백엔드 서버를 켠 뒤 바로 시연할 수 있습니다.')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    api
      .getFoods()
      .then((data) => {
        setFoods(data)
        if (data[0]) {
          setFoodId(data[0].foodId)
        }
      })
      .catch((error: Error) => setNotice(error.message))
  }, [])

  const selectedFood = useMemo(
    () => foods.find((food) => food.foodId === foodId),
    [foods, foodId],
  )

  const expectedCalories = selectedFood ? selectedFood.calories * quantity : 0

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setIsLoading(true)
    try {
      await action()
      setNotice(successMessage)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '요청 처리에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleProfileChange<K extends keyof UserProfileRequest>(
    key: K,
    value: UserProfileRequest[K],
  ) {
    setProfileForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(async () => {
      const createdProfile = await api.createProfile(profileForm)
      setProfile(createdProfile)
      setCalorieResult(null)
      setDailyLogs(null)
      setDailyReport(null)
    }, '프로필이 저장되었습니다.')
  }

  async function handleCalculateCalories() {
    await runAction(async () => {
      const result = await api.calculateCalories(profileForm)
      setCalorieResult(result.recommendedCalories)
    }, '권장 칼로리를 계산했습니다.')
  }

  async function handleCreateMealLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profile) {
      setNotice('프로필을 먼저 저장해주세요.')
      return
    }

    await runAction(async () => {
      await api.createMealLog({
        profileId: profile.profileId,
        mealDate,
        mealType,
        foodId,
        quantity,
      })
      await refreshDailyData(profile.profileId, mealDate)
    }, '식단 기록이 저장되었습니다.')
  }

  async function refreshDailyData(targetProfileId = profile?.profileId, targetDate = mealDate) {
    if (!targetProfileId) {
      setNotice('프로필을 먼저 저장해주세요.')
      return
    }

    const [logs, report] = await Promise.all([
      api.getDailyMealLogs(targetProfileId, targetDate),
      api.getDailyReport(targetProfileId, targetDate),
    ])
    setDailyLogs(logs)
    setDailyReport(report)
  }

  async function handleRefreshDailyData() {
    await runAction(async () => {
      await refreshDailyData()
    }, '날짜별 기록과 리포트를 조회했습니다.')
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <span className="eyebrow">Personalized Diet Manager</span>
          <h1>식단 및 칼로리 관리</h1>
        </div>
        <div className="status-pill">
          <Database size={18} aria-hidden="true" />
          <span>{profile ? `Profile #${profile.profileId}` : '프로필 미저장'}</span>
        </div>
      </section>

      <section className="dashboard">
        <article className="metric">
          <Calculator size={22} aria-hidden="true" />
          <span>권장 칼로리</span>
          <strong>{dailyReport?.recommendedCalories ?? calorieResult ?? 0} kcal</strong>
        </article>
        <article className="metric">
          <Utensils size={22} aria-hidden="true" />
          <span>섭취 칼로리</span>
          <strong>{dailyReport?.intakeCalories ?? dailyLogs?.dailyTotalCalories ?? 0} kcal</strong>
        </article>
        <article className="metric">
          <Activity size={22} aria-hidden="true" />
          <span>차이</span>
          <strong>{dailyReport ? `${dailyReport.difference} kcal` : '0 kcal'}</strong>
        </article>
      </section>

      <p className="notice" role="status">
        {notice}
      </p>

      <div className="workbench">
        <section className="panel">
          <div className="panel-heading">
            <h2>프로필</h2>
            <button type="button" onClick={handleCalculateCalories} disabled={isLoading}>
              <Calculator size={18} aria-hidden="true" />
              계산
            </button>
          </div>

          <form className="form-grid" onSubmit={handleCreateProfile}>
            <label>
              성별
              <select
                value={profileForm.gender}
                onChange={(event) => handleProfileChange('gender', event.target.value as Gender)}
              >
                <option value="FEMALE">여성</option>
                <option value="MALE">남성</option>
              </select>
            </label>
            <label>
              목표
              <select
                value={profileForm.goalType}
                onChange={(event) =>
                  handleProfileChange('goalType', event.target.value as GoalType)
                }
              >
                {Object.entries(goalLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              나이
              <input
                min="1"
                type="number"
                value={profileForm.age}
                onChange={(event) => handleProfileChange('age', Number(event.target.value))}
              />
            </label>
            <label>
              키(cm)
              <input
                min="1"
                type="number"
                value={profileForm.height}
                onChange={(event) => handleProfileChange('height', Number(event.target.value))}
              />
            </label>
            <label>
              몸무게(kg)
              <input
                min="1"
                type="number"
                value={profileForm.weight}
                onChange={(event) => handleProfileChange('weight', Number(event.target.value))}
              />
            </label>
            <label>
              활동량
              <select
                value={profileForm.activityLevel}
                onChange={(event) =>
                  handleProfileChange('activityLevel', event.target.value as ActivityLevel)
                }
              >
                {Object.entries(activityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="primary-action" disabled={isLoading}>
              <Save size={18} aria-hidden="true" />
              저장
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>식단 기록</h2>
            <button type="button" onClick={handleRefreshDailyData} disabled={isLoading}>
              <RefreshCw size={18} aria-hidden="true" />
              조회
            </button>
          </div>

          <form className="form-grid" onSubmit={handleCreateMealLog}>
            <label>
              날짜
              <input
                type="date"
                value={mealDate}
                onChange={(event) => setMealDate(event.target.value)}
              />
            </label>
            <label>
              식사
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value as MealType)}
              >
                {Object.entries(mealLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              음식
              <select value={foodId} onChange={(event) => setFoodId(Number(event.target.value))}>
                {foods.map((food) => (
                  <option key={food.foodId} value={food.foodId}>
                    {food.name} / {food.calories}kcal / {food.servingSize}
                  </option>
                ))}
              </select>
            </label>
            <label>
              수량
              <input
                min="1"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <div className="calorie-preview">
              <Apple size={18} aria-hidden="true" />
              <span>{expectedCalories} kcal</span>
            </div>
            <button type="submit" className="primary-action" disabled={isLoading}>
              <CalendarDays size={18} aria-hidden="true" />
              기록
            </button>
          </form>
        </section>
      </div>

      <section className="records">
        <div className="panel-heading">
          <h2>날짜별 기록</h2>
          <span>{dailyReport?.message ?? '조회 결과가 여기에 표시됩니다.'}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>식사</th>
                <th>음식</th>
                <th>수량</th>
                <th>칼로리</th>
              </tr>
            </thead>
            <tbody>
              {(dailyLogs?.mealLogs ?? []).map((log) => (
                <tr key={log.mealLogId}>
                  <td>{mealLabels[log.mealType]}</td>
                  <td>{log.foodName}</td>
                  <td>{log.quantity}</td>
                  <td>{log.totalCalories} kcal</td>
                </tr>
              ))}
              {!dailyLogs?.mealLogs.length && (
                <tr>
                  <td colSpan={4}>등록된 식단 기록이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
