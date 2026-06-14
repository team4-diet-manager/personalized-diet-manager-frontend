import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Utensils } from 'lucide-react'
import { api } from '../api'
import type { DailyReportResponse, WeeklyReportResponse } from '../api'
import { localDateString } from '../constants'
import { useProfile } from '../context/ProfileContext'
import { useDailyRollover } from '../hooks/useDailyRollover'
import { CalorieRing } from '../components/CalorieRing'
import { MacroBars } from '../components/MacroBars'
import { WeeklyTrend } from '../components/WeeklyTrend'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [date, setDate] = useState(() => localDateString())
  const [report, setReport] = useState<DailyReportResponse | null>(null)
  const [weekly, setWeekly] = useState<WeeklyReportResponse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = useCallback(
    async (targetDate: string) => {
      if (!profile) {
        return
      }
      setIsLoading(true)
      try {
        const [daily, week] = await Promise.all([
          api.getDailyReport(profile.profileId, targetDate),
          api.getWeeklyReport(profile.profileId, targetDate),
        ])
        setReport(daily)
        setWeekly(week)
        setNotice(null)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : '리포트 조회에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    },
    [profile],
  )

  // 선택한 날짜(자동 이동 포함)가 바뀌면 해당 날짜 리포트를 다시 불러온다.
  useEffect(() => {
    loadReport(date)
  }, [loadReport, date])

  // 자정이 지나면, 오늘을 보고 있던 경우에만 새 날짜로 자동 이동한다.
  useDailyRollover((newToday, prevToday) => {
    setDate((current) => (current === prevToday ? newToday : current))
  })

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

        <section className="card trend-card">
          <h2>최근 7일 칼로리 추이</h2>
          {weekly && weekly.days.some((day) => day.intakeCalories > 0) ? (
            <WeeklyTrend days={weekly.days} />
          ) : (
            <p className="card-msg">최근 7일 동안 기록한 식단이 표시됩니다.</p>
          )}
        </section>
      </div>
    </div>
  )
}
