import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { Dumbbell, LayoutDashboard, LogOut, Scale, UserCog, Utensils } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useAuth } from '../context/AuthContext'
import { goalLabels } from '../constants'

/** 대시보드·식단기록처럼 프로필이 있어야 하는 화면을 감싸는 레이아웃 (상단 네비 포함) */
export function AppLayout() {
  const { profile, setProfile } = useProfile()
  const { logout } = useAuth()

  // 프로필이 없으면 목표 선택부터 다시 시작하도록 유도
  if (!profile) {
    return <Navigate to="/goal" replace />
  }

  const handleLogout = () => {
    logout()
    setProfile(null) // 로그아웃 시 프로필 상태도 초기화
  }

  return (
    <div className="layout">
      <header className="layout-top">
        <div className="layout-brand">
          <span className="brand-mark">PDM</span>
          <div>
            <strong>{profile.name}님의 식단 관리</strong>
            <span className="brand-sub">
              목표: {goalLabels[profile.goalType]}
            </span>
          </div>
        </div>
        <nav className="layout-nav">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <LayoutDashboard size={18} aria-hidden="true" />
            대시보드
          </NavLink>
          <NavLink to="/log" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Utensils size={18} aria-hidden="true" />
            식단 기록
          </NavLink>
          <NavLink to="/weight" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Scale size={18} aria-hidden="true" />
            체중 기록
          </NavLink>
          <NavLink to="/exercise" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Dumbbell size={18} aria-hidden="true" />
            운동 기록
          </NavLink>
          <NavLink
            to="/profile"
            state={{ edit: true }}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <UserCog size={18} aria-hidden="true" />
            프로필 수정
          </NavLink>
          <button onClick={handleLogout} className="logout-btn" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}>
            <LogOut size={18} aria-hidden="true" />
            로그아웃
          </button>
        </nav>
      </header>
      <main className="layout-body">
        <Outlet />
      </main>
    </div>
  )
}
