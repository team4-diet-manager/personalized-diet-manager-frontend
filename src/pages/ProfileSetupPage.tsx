import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { api } from '../api'
import type { ActivityLevel, Gender } from '../api'
import { activityLabels, goalEmojis, goalLabels } from '../constants'
import { useProfile } from '../context/ProfileContext'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profileForm, updateProfileForm, profile, setProfile } = useProfile()
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // "프로필 수정"으로 진입한 경우에만 수정 모드. 온보딩(목표 선택) 흐름과 구분한다.
  const isEditing = Boolean((location.state as { edit?: boolean } | null)?.edit) && profile !== null

  // 수정 모드로 진입했을 때만 저장된 프로필 값을 폼에 채운다.
  // (온보딩 중에는 사용자가 방금 고른 목표/입력값을 덮어쓰지 않도록 한다)
  useEffect(() => {
    if (isEditing && profile) {
      updateProfileForm('gender', profile.gender)
      updateProfileForm('age', profile.age)
      updateProfileForm('height', profile.height)
      updateProfileForm('weight', profile.weight)
      updateProfileForm('activityLevel', profile.activityLevel)
      updateProfileForm('goalType', profile.goalType)
    }
    // 진입 시 1회만 동기화한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (profileForm.age <= 0 || profileForm.height <= 0 || profileForm.weight <= 0) {
      setNotice('나이, 키, 몸무게는 모두 1 이상이어야 합니다.')
      return
    }

    setIsSaving(true)
    try {
      // 저장된 프로필이 있으면 수정(PUT), 없으면 신규 생성(POST)한다.
      const saved = profile
        ? await api.updateProfile(profile.profileId, profileForm)
        : await api.createProfile(profileForm)
      setProfile(saved)
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
        <span className="step-badge">{isEditing ? '프로필 수정' : 'STEP 2 / 2'}</span>
        <h1>{isEditing ? '신체 정보를 수정해주세요' : '신체 정보를 입력해주세요'}</h1>
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
          {isSaving ? '저장 중…' : isEditing ? '수정하고 대시보드로' : '저장하고 대시보드로'}
        </button>
      </form>
    </div>
  )
}
