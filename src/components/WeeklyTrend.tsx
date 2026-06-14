import type { WeeklyReportDay } from '../api'

interface WeeklyTrendProps {
  days: WeeklyReportDay[]
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function weekdayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}

/** 최근 7일 섭취 칼로리를 막대로, 권장 칼로리를 기준선으로 표현하는 추이 차트 */
export function WeeklyTrend({ days }: WeeklyTrendProps) {
  const width = 360
  const height = 200
  const padTop = 22
  const padBottom = 26
  const padX = 10
  const plotW = width - padX * 2
  const plotH = height - padTop - padBottom

  const recommended = days[0]?.recommendedCalories ?? 0
  const maxIntake = Math.max(...days.map((d) => d.intakeCalories), 0)
  const max = Math.max(maxIntake, recommended, 1) * 1.15

  const step = plotW / days.length
  const barW = step * 0.55
  const yOf = (value: number) => padTop + plotH * (1 - value / max)
  const recommendedY = yOf(recommended)

  return (
    <svg
      className="weekly-trend"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="최근 7일 칼로리 추이"
    >
      {/* 권장 칼로리 기준선 */}
      <line
        x1={padX}
        y1={recommendedY}
        x2={width - padX}
        y2={recommendedY}
        stroke="#94a3b8"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text x={width - padX} y={recommendedY - 5} textAnchor="end" className="trend-rec-label">
        권장 {recommended}
      </text>

      {days.map((day, index) => {
        const x = padX + index * step + (step - barW) / 2
        const barTop = day.intakeCalories > 0 ? yOf(day.intakeCalories) : padTop + plotH
        const barH = padTop + plotH - barTop
        const over = day.intakeCalories > recommended
        return (
          <g key={day.date}>
            <rect
              x={x}
              y={barTop}
              width={barW}
              height={barH}
              rx={3}
              fill={over ? '#ef4444' : '#1d4ed8'}
            />
            {day.intakeCalories > 0 && (
              <text x={x + barW / 2} y={barTop - 5} textAnchor="middle" className="trend-value">
                {day.intakeCalories}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={height - 9}
              textAnchor="middle"
              className="trend-axis"
            >
              {weekdayLabel(day.date)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
