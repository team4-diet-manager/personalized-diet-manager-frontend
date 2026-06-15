import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !password) {
      showToast('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }

    setIsLoading(true)
    try {
      await login({ email, password })
      navigate('/goal')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Personalized Diet Manager</h1>
          <p>반갑습니다! 계정에 로그인하고 식단을 관리해 보세요.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">
            이메일 주소
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label htmlFor="password">
            비밀번호
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="cta wide" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className="auth-footer">
          아직 계정이 없으신가요?
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  )
}
