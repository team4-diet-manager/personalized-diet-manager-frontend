import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { OnboardingPage } from './pages/OnboardingPage'
import { GoalSelectPage } from './pages/GoalSelectPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { DashboardPage } from './pages/DashboardPage'
import { MealLogPage } from './pages/MealLogPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingPage />} />
      <Route path="/goal" element={<GoalSelectPage />} />
      <Route path="/profile" element={<ProfileSetupPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/log" element={<MealLogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
