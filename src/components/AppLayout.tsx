import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Utensils } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { goalLabels } from '../constants'

/** 대시보드·식단기록처럼 프로필이 있어야 하는 화면을 감싸는 레이아웃 (상단 네비 포함) */
export function AppLayout() {
  const { profile } = useProfile()

  // 프로필이 없으면 목표 선택부터 다시 시작하도록 유도
  if (!profile) {
    return <Navigate to="/goal" replace />
  }

  return (
    <div className="layout">
      <header className="layout-top">
        <div className="layout-brand">
          <span className="brand-mark">PDM</span>
          <div>
            <strong>식단 관리</strong>
            <span className="brand-sub">
              목표: {goalLabels[profile.goalType]} · Profile #{profile.profileId}
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
        </nav>
      </header>
      <main className="layout-body">
        <Outlet />
      </main>
    </div>
  )
}
