import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Utensils } from 'lucide-react'
import { api } from '../api'
import type { DailyReportResponse } from '../api'
import { today } from '../constants'
import { useProfile } from '../context/ProfileContext'
import { CalorieRing } from '../components/CalorieRing'
import { MacroBars } from '../components/MacroBars'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [date, setDate] = useState(today)
  const [report, setReport] = useState<DailyReportResponse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = useCallback(
    async (targetDate: string) => {
      if (!profile) {
        return
      }
      setIsLoading(true)
      try {
        const data = await api.getDailyReport(profile.profileId, targetDate)
        setReport(data)
        setNotice(null)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : '리포트 조회에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    },
    [profile],
  )

  useEffect(() => {
    loadReport(today)
  }, [loadReport])

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <h1>대시보드</h1>
          <p>권장 칼로리 대비 섭취량과 목표별 탄단지 구성을 확인하세요.</p>
        </div>
        <div className="date-controls">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button type="button" onClick={() => loadReport(date)} disabled={isLoading}>
            <RefreshCw size={18} aria-hidden="true" />
            {isLoading ? '조회 중…' : '조회'}
          </button>
        </div>
      </div>

      {notice && (
        <p className="notice notice-warning" role="status">
          {notice}
        </p>
      )}

      <div className="dashboard-grid">
        <section className="card ring-card">
          <h2>칼로리</h2>
          <CalorieRing
            recommended={report?.recommendedCalories ?? 0}
            intake={report?.intakeCalories ?? 0}
          />
          <p className="card-msg">{report?.message ?? '날짜를 선택해 조회하세요.'}</p>
        </section>

        <section className="card macro-card">
          <h2>탄단지 (섭취 / 권장)</h2>
          {report ? (
            <MacroBars recommended={report.recommendedMacros} intake={report.intakeMacros} />
          ) : (
            <p className="card-msg">조회하면 목표별 권장 매크로가 표시됩니다.</p>
          )}
          <button type="button" className="cta full" onClick={() => navigate('/log')}>
            <Utensils size={18} aria-hidden="true" />
            식단 기록하러 가기
          </button>
        </section>
      </div>
    </div>
  )
}
