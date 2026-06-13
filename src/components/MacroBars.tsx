import type { MacroNutrients } from '../api'

interface MacroBarsProps {
  macros: MacroNutrients
}

const MACRO_META = [
  { key: 'proteinGrams', label: '단백질', color: '#2563eb' },
  { key: 'carbGrams', label: '탄수화물', color: '#f59e0b' },
  { key: 'fatGrams', label: '지방', color: '#10b981' },
] as const

/** 목표별 권장 탄단지(그램)를 막대로 시각화 */
export function MacroBars({ macros }: MacroBarsProps) {
  const max = Math.max(macros.proteinGrams, macros.carbGrams, macros.fatGrams, 1)

  return (
    <div className="macro-bars">
      {MACRO_META.map(({ key, label, color }) => {
        const grams = macros[key]
        return (
          <div className="macro-row" key={key}>
            <span className="macro-label">{label}</span>
            <div className="macro-track">
              <div
                className="macro-fill"
                style={{ width: `${(grams / max) * 100}%`, background: color }}
              />
            </div>
            <span className="macro-grams">{grams}g</span>
          </div>
        )
      })}
    </div>
  )
}
