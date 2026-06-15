import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'
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
  /** 프로필 로딩 여부 */
  isProfileLoading: boolean
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

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [profileForm, setProfileForm] = useState<UserProfileRequest>(defaultForm)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(() => !!token)
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [foodsError, setFoodsError] = useState<string | null>(null)

  // 토큰 유무에 따라 서버에서 내 프로필 정보를 실시간 로드
  useEffect(() => {
    if (!token) {
      setProfile(null)
      setIsProfileLoading(false)
      return
    }

    setIsProfileLoading(true)
    api
      .getProfile()
      .then(setProfile)
      .catch(() => {
        // 아직 온보딩(프로필 생성)을 완료하지 않은 사용자
        setProfile(null)
      })
      .finally(() => {
        setIsProfileLoading(false)
      })
  }, [token])

  // 저장된 목표가 있으면 신호등 등급까지 포함해 음식을 불러온다(목표가 바뀌면 다시 분류).
  useEffect(() => {
    if (!token) {
      setFoods([])
      return
    }

    api
      .getFoods(profile?.goalType)
      .then(setFoods)
      .catch((error: Error) => setFoodsError(error.message))
  }, [profile?.goalType, token])

  const updateProfileForm = useCallback(
    <K extends keyof UserProfileRequest>(key: K, value: UserProfileRequest[K]) => {
      setProfileForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const value = useMemo<ProfileContextValue>(
    () => ({ profileForm, updateProfileForm, profile, setProfile, isProfileLoading, foods, foodsError }),
    [profileForm, updateProfileForm, profile, setProfile, isProfileLoading, foods, foodsError],
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
