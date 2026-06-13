import type { GoalType } from '../api'
import { goalDescriptions, goalEmojis, goalLabels } from '../constants'

interface GoalCardProps {
  goal: GoalType
  selected: boolean
  onSelect: (goal: GoalType) => void
}

/** 식단 목표를 카드 형태로 선택 (전략 패턴을 UI에서 직접 드러냄) */
export function GoalCard({ goal, selected, onSelect }: GoalCardProps) {
  return (
    <button
      type="button"
      className={`goal-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(goal)}
      aria-pressed={selected}
    >
      <span className="goal-emoji" aria-hidden="true">
        {goalEmojis[goal]}
      </span>
      <strong>{goalLabels[goal]}</strong>
      <span className="goal-desc">{goalDescriptions[goal]}</span>
    </button>
  )
}
