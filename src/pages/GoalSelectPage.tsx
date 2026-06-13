import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { GoalType } from '../api'
import { GoalCard } from '../components/GoalCard'
import { useProfile } from '../context/ProfileContext'

const GOALS: GoalType[] = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTAIN']

export function GoalSelectPage() {
  const navigate = useNavigate()
  const { profileForm, updateProfileForm } = useProfile()

  return (
    <div className="step-page">
      <div className="step-head">
        <span className="step-badge">STEP 1 / 2</span>
        <h1>목표를 골라주세요</h1>
        <p>선택한 목표에 따라 권장 칼로리 계산 방식과 탄단지 비율이 달라져요.</p>
      </div>

      <div className="goal-grid">
        {GOALS.map((goal) => (
          <GoalCard
            key={goal}
            goal={goal}
            selected={profileForm.goalType === goal}
            onSelect={(value) => updateProfileForm('goalType', value)}
          />
        ))}
      </div>

      <div className="step-actions">
        <button type="button" className="ghost" onClick={() => navigate('/')}>
          이전
        </button>
        <button type="button" className="cta" onClick={() => navigate('/profile')}>
          다음
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
