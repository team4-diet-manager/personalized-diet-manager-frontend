import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Dumbbell, Flame, Trash2 } from 'lucide-react'
import { api, isProfileMissing } from '../api'
import type { DailyExerciseLogResponse, ExerciseType, Intensity } from '../api'
import { exerciseLabels, intensityLabels, localDateString } from '../constants'
import { useProfile } from '../context/ProfileContext'
import { useToast } from '../context/ToastContext'
import { useDailyRollover } from '../hooks/useDailyRollover'

export function ExerciseLogPage() {
  const { profile, setProfile } = useProfile()
  const { showToast } = useToast()
  const [date, setDate] = useState(() => localDateString())
  const [exerciseType, setExerciseType] = useState<ExerciseType>('RUNNING')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [intensity, setIntensity] = useState<Intensity>('MEDIUM')
  const [logs, setLogs] = useState<DailyExerciseLogResponse | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useDailyRollover((newToday, prevToday) => {
    setDate((current) => (current === prevToday ? newToday : current))
  })

  const loadLogs = useCallback(
    async (targetDate: string) => {
      if (!profile) {
        return
      }
      try {
        const data = await api.getExerciseLogs(profile.profileId, targetDate)
        setLogs(data)
      } catch (error) {
        if (isProfileMissing(error)) {
          setProfile(null)
          return
        }
        showToast(error instanceof Error ? error.message : '운동 기록 조회에 실패했습니다.')
      }
    },
    [profile, setProfile],
  )

  useEffect(() => {
    loadLogs(date).catch(() => undefined)
  }, [loadLogs, date])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) {
      return
    }
    if (durationMinutes < 1) {
      showToast('운동 시간은 1분 이상이어야 합니다.')
      return
    }

    setIsBusy(true)
    try {
      await api.createExerciseLog({
        profileId: profile.profileId,
        exerciseDate: date,
        exerciseType,
        durationMinutes,
        intensity,
      })
      await loadLogs(date)
      showToast('운동이 기록되었습니다.', 'success')
    } catch (error) {
      if (isProfileMissing(error)) {
        setProfile(null)
        return
      }
      showToast(error instanceof Error ? error.message : '운동 기록에 실패했습니다.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDelete(exerciseLogId: number) {
    setIsBusy(true)
    try {
      await api.deleteExerciseLog(exerciseLogId)
      await loadLogs(date)
      showToast('운동 기록이 삭제되었습니다.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '운동 기록 삭제에 실패했습니다.')
    } finally {
      setIsBusy(false)
    }
  }

  const hasLogs = Boolean(logs?.exerciseLogs.length)

  return (
    <div className="exercise-page">
      <div className="page-head">
        <div>
          <h1>운동 기록</h1>
          <p>운동을 기록하면 종류·강도별로 소모 칼로리가 계산됩니다.</p>
        </div>
      </div>

      <form className="form-grid card" onSubmit={handleSubmit}>
        <label>
          날짜
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          운동
          <select
            value={exerciseType}
            onChange={(event) => setExerciseType(event.target.value as ExerciseType)}
          >
            {Object.entries(exerciseLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          시간(분)
          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
          />
        </label>
        <label>
          강도
          <select
            value={intensity}
            onChange={(event) => setIntensity(event.target.value as Intensity)}
          >
            {Object.entries(intensityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="cta" disabled={isBusy}>
          <Dumbbell size={18} aria-hidden="true" />
          {isBusy ? '기록 중…' : '기록'}
        </button>
      </form>

      <section className="card">
        <div className="records-head">
          <h2>{date} 운동</h2>
          <strong className="burn-total">
            <Flame size={18} aria-hidden="true" />
            {logs?.dailyTotalBurned ?? 0} kcal 소모
          </strong>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>운동</th>
                <th>시간</th>
                <th>강도</th>
                <th>소모</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {(logs?.exerciseLogs ?? []).map((log) => (
                <tr key={log.exerciseLogId}>
                  <td>{exerciseLabels[log.exerciseType]}</td>
                  <td>{log.durationMinutes}분</td>
                  <td>{intensityLabels[log.intensity]}</td>
                  <td>{log.burnedCalories} kcal</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => handleDelete(log.exerciseLogId)}
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
                  <td colSpan={5}>선택한 날짜에 기록된 운동이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
