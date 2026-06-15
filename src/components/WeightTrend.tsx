import type { WeightLogResponse } from '../api'

interface WeightTrendProps {
  logs: WeightLogResponse[]
}

function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${Number(month)}/${Number(day)}`
}

/** 체중 변화를 꺾은선으로 표현하는 추이 차트 */
export function WeightTrend({ logs }: WeightTrendProps) {
  const width = 360
  const height = 200
  const padTop = 16
  const padBottom = 28
  const padLeft = 44
  const padRight = 18
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const weights = logs.map((log) => log.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  // 변화를 눈에 띄게 하려고 위아래로 약간의 여백을 둔다(값이 모두 같으면 ±1kg).
  const span = max - min || 2
  const low = min - span * 0.2
  const high = max + span * 0.2

  const xOf = (index: number) =>
    logs.length === 1 ? padLeft + plotW / 2 : padLeft + (plotW * index) / (logs.length - 1)
  const yOf = (weight: number) => padTop + plotH * (1 - (weight - low) / (high - low))

  const points = logs.map((log, index) => `${xOf(index)},${yOf(log.weight)}`).join(' ')
  const latest = logs[logs.length - 1]
  const first = logs[0]
  const diff = latest.weight - first.weight
  const diffText = diff === 0 ? '변화 없음' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}kg`

  return (
    <div className="weight-trend-wrap">
      <div className="weight-current">
        <strong>{latest.weight}kg</strong>
        {logs.length > 1 && (
          <span className={diff > 0 ? 'over' : 'under'}>처음 대비 {diffText}</span>
        )}
      </div>

      <svg
        className="weight-trend"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="체중 변화 추이"
      >
        {/* y축 최소·최대 라벨 */}
        <text x={padLeft - 8} y={yOf(high) + 4} textAnchor="end" className="trend-axis">
          {high.toFixed(1)}
        </text>
        <text x={padLeft - 8} y={yOf(low) + 4} textAnchor="end" className="trend-axis">
          {low.toFixed(1)}
        </text>

        {logs.length > 1 && (
          <polyline points={points} fill="none" stroke="#1d4ed8" strokeWidth={2} />
        )}

        {logs.map((log, index) => (
          <g key={log.weightLogId}>
            <circle cx={xOf(index)} cy={yOf(log.weight)} r={3.5} fill="#1d4ed8" />
            <text x={xOf(index)} y={height - 10} textAnchor="middle" className="trend-axis">
              {shortDate(log.logDate)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
