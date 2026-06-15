import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { api } from '../api'
import { useToast } from '../context/ToastContext'

export function SignupPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !nickname || !password || !confirmPassword) {
      showToast('모든 필드를 입력해 주세요.')
      return
    }
    if (nickname.length < 2 || nickname.length > 20) {
      showToast('닉네임은 2자 이상 20자 이하로 입력해야 합니다.')
      return
    }
    if (password !== confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6 || password.length > 20) {
      showToast('비밀번호는 6자 이상 20자 이하로 입력해야 합니다.')
      return
    }

    setIsLoading(true)
    try {
      await api.signup({ email, password, nickname })
      // 닉네임을 프로필 이름으로 쓰기 위해 저장(온보딩에서 별도 이름 입력 없음)
      localStorage.setItem('pdm.nickname', nickname)
      navigate('/login')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Personalized Diet Manager</h1>
          <p>새로운 계정을 만들고 맞춤형 식단 관리를 시작하세요.</p>
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

          <label htmlFor="nickname">
            닉네임 (2~20자)
            <input
              id="nickname"
              type="text"
              placeholder=""
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </label>

          <label htmlFor="password">
            비밀번호 (6~20자)
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label htmlFor="confirmPassword">
            비밀번호 확인
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="cta wide" disabled={isLoading}>
            <UserPlus size={18} />
            {isLoading ? '회원가입 진행 중…' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          이미 계정이 있으신가요?
          <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  )
}
