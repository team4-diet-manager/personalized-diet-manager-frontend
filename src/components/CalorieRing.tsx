interface CalorieRingProps {
  recommended: number
  intake: number
}

/** 권장 칼로리 대비 섭취 칼로리를 원형 진행 링으로 표현 */
export function CalorieRing({ recommended, intake }: CalorieRingProps) {
  const size = 200
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const ratio = recommended > 0 ? Math.min(intake / recommended, 1) : 0
  const offset = circumference * (1 - ratio)

  const remaining = recommended - intake
  const over = remaining < 0

  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="칼로리 진행 링">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? '#ef4444' : '#1d4ed8'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="ring-center">
        <strong>{intake}</strong>
        <span>/ {recommended} kcal</span>
        <em className={over ? 'over' : 'under'}>
          {over ? `${Math.abs(remaining)} 초과` : `${remaining} 남음`}
        </em>
      </div>
    </div>
  )
}
