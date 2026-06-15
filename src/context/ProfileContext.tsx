import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api'
import type { FoodResponse, UserProfileRequest, UserProfileResponse } from '../api'

interface ProfileContextValue {
  /** 온보딩~프로필 단계에서 누적 입력되는 폼 값 */
  profileForm: UserProfileRequest
  updateProfileForm: <K extends keyof UserProfileRequest>(
    key: K,
    value: UserProfileRequest[K],
  ) => void
  /** 서버에 저장된 프로필 (없으면 아직 미저장) */
  profile: UserProfileResponse | null
  setProfile: (profile: UserProfileResponse | null) => void
  /** 기본 음식 목록 (앱 진입 시 1회 로드) */
  foods: FoodResponse[]
  foodsError: string | null
}

const defaultForm: UserProfileRequest = {
  name: '',
  gender: 'FEMALE',
  age: 23,
  height: 162,
  weight: 55,
  activityLevel: 'NORMAL',
  goalType: 'WEIGHT_LOSS',
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const PROFILE_STORAGE_KEY = 'pdm.profile'

// 새로고침해도 저장된 프로필이 유지되도록 localStorage에서 초기값을 복원한다.
function loadStoredProfile(): UserProfileResponse | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserProfileResponse) : null
  } catch {
    return null
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileForm, setProfileForm] = useState<UserProfileRequest>(defaultForm)
  const [profile, setProfile] = useState<UserProfileResponse | null>(loadStoredProfile)
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [foodsError, setFoodsError] = useState<string | null>(null)

  // 저장된 목표가 있으면 신호등 등급까지 포함해 음식을 불러온다(목표가 바뀌면 다시 분류).
  useEffect(() => {
    api
      .getFoods(profile?.goalType)
      .then(setFoods)
      .catch((error: Error) => setFoodsError(error.message))
  }, [profile?.goalType])

  // 프로필이 바뀔 때마다 localStorage에 동기화한다.
  useEffect(() => {
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY)
    }
  }, [profile])

  const updateProfileForm = useCallback(
    <K extends keyof UserProfileRequest>(key: K, value: UserProfileRequest[K]) => {
      setProfileForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const value = useMemo<ProfileContextValue>(
    () => ({ profileForm, updateProfileForm, profile, setProfile, foods, foodsError }),
    [profileForm, updateProfileForm, profile, foods, foodsError],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
