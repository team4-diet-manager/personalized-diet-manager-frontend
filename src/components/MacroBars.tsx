import type { MacroNutrients } from '../api'

interface MacroBarsProps {
  recommended: MacroNutrients
  /** 실제 섭취 매크로. 주어지면 권장 대비 섭취량을 비교 표시한다. */
  intake?: MacroNutrients
}

const MACRO_META = [
  { key: 'proteinGrams', label: '단백질', color: '#2563eb' },
  { key: 'carbGrams', label: '탄수화물', color: '#f59e0b' },
  { key: 'fatGrams', label: '지방', color: '#10b981' },
] as const

/** 권장 탄단지(그램) 대비 실제 섭취량을 막대로 시각화 */
export function MacroBars({ recommended, intake }: MacroBarsProps) {
  return (
    <div className="macro-bars">
      {MACRO_META.map(({ key, label, color }) => {
        const goal = recommended[key]
        const eaten = intake?.[key] ?? 0
        // 권장량을 기준(100%)으로 섭취량 비율을 채운다.
        const ratio = goal > 0 ? Math.min(eaten / goal, 1) : 0
        const over = eaten > goal

        return (
          <div className="macro-row" key={key}>
            <span className="macro-label">{label}</span>
            <div className="macro-track">
              <div
                className="macro-fill"
                style={{ width: `${ratio * 100}%`, background: over ? '#ef4444' : color }}
              />
            </div>
            <span className="macro-grams">
              {intake ? (
                <>
                  <strong className={over ? 'over' : ''}>{eaten}</strong> / {goal}g
                </>
              ) : (
                `${goal}g`
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
