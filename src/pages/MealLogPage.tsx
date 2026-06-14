import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Apple, CalendarDays, Pencil, Trash2, X } from 'lucide-react'
import { api } from '../api'
import type { DailyMealLogResponse, MealLogResponse, MealType } from '../api'
import { localDateString, mealLabels } from '../constants'
import { useProfile } from '../context/ProfileContext'
import { useDailyRollover } from '../hooks/useDailyRollover'
import { FoodCombobox } from '../components/FoodCombobox'

// 식단 테이블에서 식사 구분을 표시할 순서
const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

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
      const data = await api.getDailyMealLogs(profile.profileId, targetDate)
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
          />
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
