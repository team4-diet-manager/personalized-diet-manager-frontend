import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Scale } from 'lucide-react'
import { api, ApiError } from '../api'
import type { WeightLogResponse } from '../api'
import { localDateString } from '../constants'
import { useProfile } from '../context/ProfileContext'
import { WeightTrend } from '../components/WeightTrend'

export function WeightLogPage() {
  const { profile, setProfile } = useProfile()
  const [logDate, setLogDate] = useState(() => localDateString())
  const [weight, setWeight] = useState(() => profile?.weight ?? 0)
  const [logs, setLogs] = useState<WeightLogResponse[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const loadLogs = useCallback(async () => {
    if (!profile) {
      return
    }
    try {
      const data = await api.getWeightLogs(profile.profileId)
      setLogs(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setProfile(null)
        return
      }
      setNotice(error instanceof Error ? error.message : '체중 기록 조회에 실패했습니다.')
    }
  }, [profile, setProfile])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) {
      return
    }
    if (weight <= 0) {
      setNotice('체중은 0보다 커야 합니다.')
      return
    }

    setIsBusy(true)
    try {
      await api.recordWeight({ profileId: profile.profileId, logDate, weight })
      await loadLogs()
      setNotice('체중이 기록되었습니다.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setProfile(null)
        return
      }
      setNotice(error instanceof Error ? error.message : '체중 기록에 실패했습니다.')
    } finally {
      setIsBusy(false)
    }
  }

  const hasLogs = logs.length > 0
  // 최신 기록이 위로 오도록 역순 표시
  const recentFirst = [...logs].reverse()

  return (
    <div className="weight-page">
      <div className="page-head">
        <div>
          <h1>체중 기록</h1>
          <p>날짜별 체중을 기록하고 변화를 추적하세요.</p>
        </div>
      </div>

      {notice && (
        <p className="notice notice-warning" role="status">
          {notice}
        </p>
      )}

      <form className="form-grid card" onSubmit={handleSubmit}>
        <label>
          날짜
          <input type="date" value={logDate} onChange={(event) => setLogDate(event.target.value)} />
        </label>
        <label>
          체중(kg)
          <input
            type="number"
            min="1"
            step="0.1"
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
          />
        </label>
        <button type="submit" className="cta" disabled={isBusy}>
          <Scale size={18} aria-hidden="true" />
          {isBusy ? '저장 중…' : '기록'}
        </button>
      </form>

      <section className="card">
        <h2>체중 변화</h2>
        {hasLogs ? (
          <WeightTrend logs={logs} />
        ) : (
          <p className="card-msg">체중을 기록하면 변화 그래프가 표시됩니다.</p>
        )}
      </section>

      {hasLogs && (
        <section className="card">
          <h2>기록 목록</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>체중</th>
                </tr>
              </thead>
              <tbody>
                {recentFirst.map((log) => (
                  <tr key={log.weightLogId}>
                    <td>{log.logDate}</td>
                    <td>{log.weight} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
