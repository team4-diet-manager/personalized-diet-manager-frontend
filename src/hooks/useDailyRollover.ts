import { useEffect, useRef } from 'react'
import { localDateString } from '../constants'

/**
 * 실시간으로 날짜를 감시해, 자정이 지나 달력상 날짜가 바뀌면 콜백을 호출한다.
 * 콜백에는 (새 오늘, 이전 오늘) 날짜 문자열이 전달된다.
 */
export function useDailyRollover(onRollover: (newToday: string, prevToday: string) => void) {
  const callbackRef = useRef(onRollover)

  // 최신 콜백을 ref에 유지(인터벌은 1회만 설정하므로 stale closure 방지)
  useEffect(() => {
    callbackRef.current = onRollover
  })

  useEffect(() => {
    let current = localDateString()
    const intervalId = setInterval(() => {
      const now = localDateString()
      if (now !== current) {
        const previous = current
        current = now
        callbackRef.current(now, previous)
      }
    }, 30_000)
    return () => clearInterval(intervalId)
  }, [])
}
