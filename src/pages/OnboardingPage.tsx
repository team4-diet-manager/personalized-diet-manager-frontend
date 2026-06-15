import { useNavigate } from 'react-router-dom'
import { ArrowRight, Activity, Calculator, Utensils } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  { icon: Calculator, title: '목표별 권장 칼로리', desc: '다이어트·벌크업·유지에 맞춰 하루 권장량을 계산해요.' },
  { icon: Utensils, title: '간편한 식단 기록', desc: '음식과 수량만 고르면 섭취 칼로리가 자동 합산돼요.' },
  { icon: Activity, title: '한눈에 보는 리포트', desc: '권장량 대비 섭취량과 탄단지 구성을 시각화해요.' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/goal')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <span className="eyebrow">Personalized Diet Manager</span>
        <h1>
          내 몸과 목표에 맞춘
          <br />
          식단 · 칼로리 관리
        </h1>
        <p>신체 정보와 목표를 입력하면, 목표별 전략에 맞는 권장 칼로리와 탄단지 구성을 알려드려요.</p>
        <button type="button" className="cta" onClick={handleStart}>
          시작하기
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>

      <ul className="onboarding-steps">
        {STEPS.map(({ icon: Icon, title, desc }) => (
          <li key={title}>
            <Icon size={22} aria-hidden="true" />
            <strong>{title}</strong>
            <span>{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
