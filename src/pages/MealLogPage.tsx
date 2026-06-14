import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Apple, CalendarDays, Pencil, Trash2, X } from 'lucide-react'
import { api } from '../api'
import type { DailyMealLogResponse, MealLogResponse, MealType } from '../api'
import { mealLabels, today } from '../constants'
import { useProfile } from '../context/ProfileContext'

export function MealLogPage() {
  const { profile, foods, foodsError } = useProfile()
  const [date, setDate] = useState(today)
  const [mealType, setMealType] = useState<MealType>('LUNCH')
  const [foodId, setFoodId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [logs, setLogs] = useState<DailyMealLogResponse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  // 음식 목록이 로드되면 첫 음식을 기본 선택
  useEffect(() => {
    if (foodId === null && foods[0]) {
      setFoodId(foods[0].foodId)
    }
  }, [foods, foodId])

  const selectedFood = useMemo(
    () => foods.find((food) => food.foodId === foodId),
    [foods, foodId],
  )
  const expectedCalories = selectedFood ? selectedFood.calories * quantity : 0

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
    if (foods[0]) {
      setFoodId(foods[0].foodId)
      setFoodInput(foods[0].name)
    }
  }

  function startEdit(log: MealLogResponse) {
    setEditingId(log.mealLogId)
    setMealType(log.mealType)
    setFoodId(log.foodId)
    setFoodInput(log.foodName)
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
    if (!profile || !selectedFood || foodId === null) {
      setNotice('음식 목록을 불러온 뒤 식단을 기록할 수 있습니다.')
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
          <select
            value={foodId ?? ''}
            onChange={(event) => setFoodId(Number(event.target.value))}
            disabled={!foods.length}
          >
            {foods.length ? (
              foods.map((food) => (
                <option key={food.foodId} value={food.foodId}>
                  {food.name} / {food.calories}kcal / {food.servingSize}
                </option>
              ))
            ) : (
              <option value="">음식 목록을 불러오지 못했습니다</option>
            )}
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
                <th>식사</th>
                <th>음식</th>
                <th>수량</th>
                <th>칼로리</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {(logs?.mealLogs ?? []).map((log) => (
                <tr key={log.mealLogId}>
                  <td>{mealLabels[log.mealType]}</td>
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
              {!hasLogs && (
                <tr>
                  <td colSpan={5}>선택한 날짜에 등록된 식단 기록이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
