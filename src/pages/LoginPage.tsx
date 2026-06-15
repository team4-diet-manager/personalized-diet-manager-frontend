import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await login({ email, password })
      // 사용자의 요청에 따라 로그인 성공 시 온보딩의 시작 지점인 /goal로 이동합니다.
      navigate('/goal')
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.')
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

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

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
