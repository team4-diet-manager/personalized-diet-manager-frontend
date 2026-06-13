import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { api } from '../api'
import type { ActivityLevel, Gender } from '../api'
import { activityLabels, goalEmojis, goalLabels } from '../constants'
import { useProfile } from '../context/ProfileContext'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const { profileForm, updateProfileForm, setProfile } = useProfile()
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (profileForm.age <= 0 || profileForm.height <= 0 || profileForm.weight <= 0) {
      setNotice('나이, 키, 몸무게는 모두 1 이상이어야 합니다.')
      return
    }

    setIsSaving(true)
    try {
      const created = await api.createProfile(profileForm)
      setProfile(created)
      navigate('/dashboard')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '프로필 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="step-page">
      <div className="step-head">
        <span className="step-badge">STEP 2 / 2</span>
        <h1>신체 정보를 입력해주세요</h1>
        <button type="button" className="goal-chip" onClick={() => navigate('/goal')}>
          {goalEmojis[profileForm.goalType]} 목표: {goalLabels[profileForm.goalType]} · 변경
        </button>
      </div>

      {notice && (
        <p className="notice notice-warning" role="status">
          {notice}
        </p>
      )}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          성별
          <select
            value={profileForm.gender}
            onChange={(event) => updateProfileForm('gender', event.target.value as Gender)}
          >
            <option value="FEMALE">여성</option>
            <option value="MALE">남성</option>
          </select>
        </label>
        <label>
          활동량
          <select
            value={profileForm.activityLevel}
            onChange={(event) =>
              updateProfileForm('activityLevel', event.target.value as ActivityLevel)
            }
          >
            {Object.entries(activityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          나이
          <input
            min="1"
            type="number"
            value={profileForm.age}
            onChange={(event) => updateProfileForm('age', Number(event.target.value))}
          />
        </label>
        <label>
          키(cm)
          <input
            min="1"
            type="number"
            value={profileForm.height}
            onChange={(event) => updateProfileForm('height', Number(event.target.value))}
          />
        </label>
        <label>
          몸무게(kg)
          <input
            min="1"
            type="number"
            value={profileForm.weight}
            onChange={(event) => updateProfileForm('weight', Number(event.target.value))}
          />
        </label>
        <button type="submit" className="cta wide" disabled={isSaving}>
          <Save size={18} aria-hidden="true" />
          {isSaving ? '저장 중…' : '저장하고 대시보드로'}
        </button>
      </form>
    </div>
  )
}
