import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Apple, CalendarDays, Pencil, Star, Trash2, X } from 'lucide-react'
import { api } from '../api'
import type { DailyMealLogResponse, MealLogResponse, MealType } from '../api'
import { goalLabels, gradeMeta, localDateString, mealLabels } from '../constants'
import { useProfile } from '../context/ProfileContext'
import { useDailyRollover } from '../hooks/useDailyRollover'
import { FoodCombobox } from '../components/FoodCombobox'

// 식단 테이블에서 식사 구분을 표시할 순서
const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

// 최근 기록한 음식(자주 쓰는 음식 빠른 추가용)
const RECENT_FOODS_KEY = 'pdm.recentFoods'
const RECENT_FOODS_MAX = 5

// 즐겨찾기 음식(별표로 상단 고정)
const FAVORITE_FOODS_KEY = 'pdm.favoriteFoods'

function loadIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function MealLogPage() {
  const { profile, foods, foodsError } = useProfile()
  const [date, setDate] = useState(() => localDateString())

  // 자정이 지나면, 오늘을 보고 있던 경우에만 새 날짜로 자동 이동한다.
  // (날짜가 바뀌면 아래 자동 재조회로 새 날의 빈 기록이 표시됨. 과거 데이터는 DB에 그대로 보존)
  useDailyRollover((newToday, prevToday) => {
    setDate((current) => (current === prevToday ? newToday : current))
  })
  const [mealType, setMealType] = useState<MealType>('LUNCH')
  const [foodId, setFoodId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [logs, setLogs] = useState<DailyMealLogResponse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [recentFoodIds, setRecentFoodIds] = useState<number[]>(() => loadIds(RECENT_FOODS_KEY))
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => loadIds(FAVORITE_FOODS_KEY))

  // 최근 음식 목록 맨 앞에 추가(중복 제거, 최대 개수 유지) 후 localStorage에 저장.
  function pushRecentFood(id: number) {
    setRecentFoodIds((prev) => {
      const next = [id, ...prev.filter((value) => value !== id)].slice(0, RECENT_FOODS_MAX)
      localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(next))
      return next
    })
  }

  // 즐겨찾기 토글(별표) 후 localStorage에 저장.
  function toggleFavorite(id: number) {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
      localStorage.setItem(FAVORITE_FOODS_KEY, JSON.stringify(next))
      return next
    })
  }

  // 실제 음식 목록에 존재하는 즐겨찾기 음식만 칩으로 노출한다.
  const favoriteFoods = useMemo(
    () =>
      favoriteIds
        .map((id) => foods.find((food) => food.foodId === id))
        .filter((food): food is NonNullable<typeof food> => Boolean(food)),
    [favoriteIds, foods],
  )

  // 최근 음식은 즐겨찾기와 중복되지 않게 제외해 칩으로 노출한다.
  const recentFoods = useMemo(
    () =>
      recentFoodIds
        .filter((id) => !favoriteIds.includes(id))
        .map((id) => foods.find((food) => food.foodId === id))
        .filter((food): food is NonNullable<typeof food> => Boolean(food)),
    [recentFoodIds, favoriteIds, foods],
  )

  const selectedFood = useMemo(
    () => foods.find((food) => food.foodId === foodId),
    [foods, foodId],
  )
  const expectedCalories = selectedFood ? selectedFood.calories * quantity : 0

  // 식사 구분별로 기록을 묶고 각 소계를 계산한다.
  const mealGroups = useMemo(() => {
    const all = logs?.mealLogs ?? []
    return MEAL_ORDER.map((type) => {
      const items = all.filter((log) => log.mealType === type)
      const subtotal = items.reduce((sum, log) => sum + log.totalCalories, 0)
      return { type, items, subtotal }
    }).filter((group) => group.items.length > 0)
  }, [logs])

  const loadLogs = useCallback(
    async (targetDate: string) => {
      if (!profile) {
        return
      }
      const data = await api.getDailyMealLogs(targetDate)
      setLogs(data)
    },
    [profile],
  )

  // 선택한 날짜가 바뀌면 해당 날짜 기록을 자동으로 다시 불러온다.
  useEffect(() => {
    loadLogs(date).catch((error: Error) => setNotice(error.message))
  }, [loadLogs, date])

  function resetForm() {
    setEditingId(null)
    setMealType('LUNCH')
    setQuantity(1)
    setFoodId(null)
  }

  function startEdit(log: MealLogResponse) {
    setEditingId(log.mealLogId)
    setMealType(log.mealType)
    setFoodId(log.foodId)
    setQuantity(log.quantity)
    setNotice(null)
  }

  async function handleDelete(mealLogId: number) {
    if (!profile) {
      return
    }
    setIsBusy(true)
    try {
      await api.deleteMealLog(mealLogId)
      if (editingId === mealLogId) {
        resetForm()
      }
      await loadLogs(date)
      setNotice('식단 기록이 삭제되었습니다.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '식단 기록 삭제에 실패했습니다.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || !foods.length) {
      setNotice('음식 목록을 불러온 뒤 식단을 기록할 수 있습니다.')
      return
    }
    if (!selectedFood || foodId === null) {
      setNotice('음식을 선택해주세요.')
      return
    }
    if (quantity < 1) {
      setNotice('섭취 수량은 1 이상이어야 합니다.')
      return
    }

    setIsBusy(true)
    try {
      const body = { profileId: profile.profileId, mealDate: date, mealType, foodId, quantity }
      if (editingId !== null) {
        await api.updateMealLog(editingId, body)
        setNotice('식단 기록이 수정되었습니다.')
      } else {
        await api.createMealLog(body)
        pushRecentFood(foodId)
        setNotice('식단 기록이 저장되었습니다.')
      }
      resetForm()
      await loadLogs(date)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '식단 기록에 실패했습니다.')
    } finally {
      setIsBusy(false)
    }
  }

  // 최근 음식 칩: 현재 날짜·식사 구분으로 수량 1로 바로 기록한다.
  async function quickAdd(quickFoodId: number) {
    if (!profile) {
      return
    }
    setIsBusy(true)
    try {
      await api.createMealLog({
        profileId: profile.profileId,
        mealDate: date,
        mealType,
        foodId: quickFoodId,
        quantity: 1,
      })
      pushRecentFood(quickFoodId)
      await loadLogs(date)
      const added = foods.find((food) => food.foodId === quickFoodId)
      setNotice(`${mealLabels[mealType]}에 ${added?.name ?? '음식'}을(를) 추가했습니다.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '식단 기록에 실패했습니다.')
    } finally {
      setIsBusy(false)
    }
  }

  const hasLogs = Boolean(logs?.mealLogs.length)
  const isEditing = editingId !== null

  return (
    <div className="meallog-page">
      <div className="page-head">
        <div>
          <h1>식단 기록</h1>
          <p>날짜와 음식을 선택해 그날의 식단을 기록하세요.</p>
        </div>
      </div>

      {(notice || foodsError) && (
        <p className="notice notice-warning" role="status">
          {notice ?? foodsError}
        </p>
      )}

      <form className="form-grid card" onSubmit={handleSubmit}>
        {isEditing && (
          <p className="notice notice-info wide" role="status">
            기록을 수정하는 중입니다.
          </p>
        )}
        {!isEditing && favoriteFoods.length > 0 && (
          <div className="recent-foods wide">
            <span className="recent-foods-label">
              <Star size={13} fill="#f59e0b" stroke="#f59e0b" aria-hidden="true" /> 즐겨찾기 ·{' '}
              {mealLabels[mealType]}에 바로 추가
            </span>
            <div className="recent-foods-chips">
              {favoriteFoods.map((food) => (
                <button
                  type="button"
                  key={food.foodId}
                  className="food-chip favorite"
                  onClick={() => quickAdd(food.foodId)}
                  disabled={isBusy}
                >
                  {food.grade && (
                    <span
                      className="grade-dot"
                      style={{ background: gradeMeta[food.grade].color }}
                      aria-label={gradeMeta[food.grade].label}
                    />
                  )}
                  + {food.name}
                  <span className="food-chip-kcal">{food.calories}kcal</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {!isEditing && recentFoods.length > 0 && (
          <div className="recent-foods wide">
            <span className="recent-foods-label">
              최근 음식 · {mealLabels[mealType]}에 바로 추가
            </span>
            <div className="recent-foods-chips">
              {recentFoods.map((food) => (
                <button
                  type="button"
                  key={food.foodId}
                  className="food-chip"
                  onClick={() => quickAdd(food.foodId)}
                  disabled={isBusy}
                >
                  {food.grade && (
                    <span
                      className="grade-dot"
                      style={{ background: gradeMeta[food.grade].color }}
                      aria-label={gradeMeta[food.grade].label}
                    />
                  )}
                  + {food.name}
                  <span className="food-chip-kcal">{food.calories}kcal</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <label>
          날짜
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          식사
          <select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
            {Object.entries(mealLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          음식
          <FoodCombobox
            foods={foods}
            value={foodId}
            onChange={setFoodId}
            disabled={!foods.length}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
          {profile && foods.some((food) => food.grade) && (
            <span className="grade-legend">
              {(['GREEN', 'YELLOW', 'RED'] as const).map((grade) => (
                <span key={grade} className="grade-legend-item">
                  <span className="grade-dot" style={{ background: gradeMeta[grade].color }} />
                  {gradeMeta[grade].label}
                </span>
              ))}
              <span className="grade-legend-note">· {goalLabels[profile.goalType]} 기준</span>
            </span>
          )}
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
        <div className="form-actions">
          <button type="submit" className="cta" disabled={isBusy || !foods.length}>
            <CalendarDays size={18} aria-hidden="true" />
            {isBusy ? '저장 중…' : isEditing ? '수정 완료' : '기록'}
          </button>
          {isEditing && (
            <button type="button" className="ghost" onClick={resetForm} disabled={isBusy}>
              <X size={18} aria-hidden="true" />
              취소
            </button>
          )}
        </div>
      </form>

      {selectedFood && (
        <section className="card nutrition-card">
          <div className="records-head">
            <h2>
              {selectedFood.name} 영양정보
              <span className="nutrition-serving"> · {selectedFood.servingSize} 기준</span>
            </h2>
            {selectedFood.grade && (
              <span className="nutrition-grade" style={{ color: gradeMeta[selectedFood.grade].color }}>
                ● {gradeMeta[selectedFood.grade].label}
              </span>
            )}
          </div>
          <div className="nutrition-grid">
            <div className="nutrition-item primary">
              <span>칼로리</span>
              <strong>{selectedFood.calories} kcal</strong>
            </div>
            <div className="nutrition-item">
              <span>탄수화물</span>
              <strong>{selectedFood.carbGrams} g</strong>
            </div>
            <div className="nutrition-item sub">
              <span>· 당류</span>
              <strong>{selectedFood.sugarGrams} g</strong>
            </div>
            <div className="nutrition-item sub">
              <span>· 식이섬유</span>
              <strong>{selectedFood.fiberGrams} g</strong>
            </div>
            <div className="nutrition-item">
              <span>단백질</span>
              <strong>{selectedFood.proteinGrams} g</strong>
            </div>
            <div className="nutrition-item">
              <span>지방</span>
              <strong>{selectedFood.fatGrams} g</strong>
            </div>
            <div className="nutrition-item sub">
              <span>· 포화지방</span>
              <strong>{selectedFood.saturatedFatGrams} g</strong>
            </div>
            <div className="nutrition-item">
              <span>나트륨</span>
              <strong>{selectedFood.sodiumMg} mg</strong>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="records-head">
          <h2>{date} 기록</h2>
          <strong>{logs?.dailyTotalCalories ?? 0} kcal</strong>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>음식</th>
                <th>수량</th>
                <th>칼로리</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {mealGroups.map((group) => (
                <Fragment key={group.type}>
                  <tr className="meal-group-head">
                    <th colSpan={2} scope="rowgroup">
                      {mealLabels[group.type]}
                    </th>
                    <td className="meal-subtotal" colSpan={2}>
                      {group.subtotal} kcal
                    </td>
                  </tr>
                  {group.items.map((log) => (
                    <tr key={log.mealLogId}>
                      <td>{log.foodName}</td>
                      <td>{log.quantity}</td>
                      <td>{log.totalCalories} kcal</td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEdit(log)}
                          disabled={isBusy}
                          aria-label="수정"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => handleDelete(log.mealLogId)}
                          disabled={isBusy}
                          aria-label="삭제"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {!hasLogs && (
                <tr>
                  <td colSpan={4}>선택한 날짜에 등록된 식단 기록이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
