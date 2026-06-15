import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { OnboardingPage } from './pages/OnboardingPage'
import { GoalSelectPage } from './pages/GoalSelectPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { DashboardPage } from './pages/DashboardPage'
import { MealLogPage } from './pages/MealLogPage'
import { WeightLogPage } from './pages/WeightLogPage'
import { ExerciseLogPage } from './pages/ExerciseLogPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { useAuth } from './context/AuthContext'
import { useProfile } from './context/ProfileContext'

// 비로그인 사용자만 접근할 수 있는 경로 (로그인, 회원가입)
function PublicRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

// 로그인 사용자만 접근할 수 있는 경로
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

// 대시보드 및 서비스 이용 전용 경로 (프로필이 있는 유저용)
function DashboardRoute({ children }: { children: JSX.Element }) {
  const { profile } = useProfile()
  if (!profile) {
    return <Navigate to="/goal" replace />
  }
  return children
}

function App() {
  const { isAuthenticated } = useAuth()
  const { profile, isProfileLoading } = useProfile()

  if (isAuthenticated && isProfileLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#eef2f6' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>로딩 중...</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* 1. 온보딩 소개 화면 (누구나 접근 가능) */}
      <Route
        path="/"
        element={
          isAuthenticated && profile ? <Navigate to="/dashboard" replace /> : <OnboardingPage />
        }
      />

      {/* 2. 인증 불필요 경로 (비로그인 사용자 전용) */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* 3. 로그인 사용자 전용 온보딩 단계 */}
      <Route path="/goal" element={<PrivateRoute><GoalSelectPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfileSetupPage /></PrivateRoute>} />

      {/* 4. 프로필 정보가 입력되어야 진입 가능한 대시보드 영역 */}
      <Route
        element={
          <PrivateRoute>
            <DashboardRoute>
              <AppLayout />
            </DashboardRoute>
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/log" element={<MealLogPage />} />
        <Route path="/weight" element={<WeightLogPage />} />
        <Route path="/exercise" element={<ExerciseLogPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
