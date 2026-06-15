import { useEffect, useMemo, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import type { FoodResponse } from '../api'
import { gradeMeta } from '../constants'

interface FoodComboboxProps {
  foods: FoodResponse[]
  value: number | null
  onChange: (foodId: number | null) => void
  disabled?: boolean
  favoriteIds?: number[]
  onToggleFavorite?: (foodId: number) => void
}

/**
 * 음식명을 타이핑해 실시간으로 필터링하고 클릭으로 선택하는 검색형 콤보박스.
 * 기본 선택 없이 placeholder를 보여주며, datalist 대신 직접 구현해 동작이 일관적이다.
 */
export function FoodCombobox({
  foods,
  value,
  onChange,
  disabled,
  favoriteIds = [],
  onToggleFavorite,
}: FoodComboboxProps) {
  // draft가 null이면 "타이핑 안 함" → 선택된 음식명을 보여주고, 문자열이면 사용자가 입력 중.
  const [draft, setDraft] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selectedFood = useMemo(
    () => foods.find((food) => food.foodId === value) ?? null,
    [foods, value],
  )

  const displayValue = draft ?? selectedFood?.name ?? ''

  // 바깥을 클릭하면 목록을 닫고 입력 초안을 비운다.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
        setDraft(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const keyword = (draft ?? '').trim().toLowerCase()
  const filtered = useMemo(() => {
    // 타이핑 중이 아니면(=draft null) 전체 목록을 보여준다.
    if (!keyword) {
      return foods
    }
    return foods.filter((food) => food.name.toLowerCase().includes(keyword))
  }, [foods, keyword])

  function select(food: FoodResponse) {
    onChange(food.foodId)
    setDraft(null)
    setOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (event.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        event.preventDefault()
        select(filtered[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
      setDraft(null)
    }
  }

  return (
    <div className="combobox" ref={wrapRef}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="food-combobox-list"
        autoComplete="off"
        placeholder="음식을 검색하세요…"
        value={displayValue}
        disabled={disabled}
        onChange={(event) => {
          setDraft(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul className="combobox-list" id="food-combobox-list" role="listbox">
          {filtered.length ? (
            filtered.map((food, index) => (
              <li
                key={food.foodId}
                role="option"
                aria-selected={food.foodId === value}
                className={
                  'combobox-option' +
                  (index === activeIndex ? ' active' : '') +
                  (food.foodId === value ? ' selected' : '')
                }
                onPointerEnter={() => setActiveIndex(index)}
                onPointerDown={(event) => {
                  // blur보다 먼저 선택되도록 pointerdown에서 처리한다.
                  event.preventDefault()
                  select(food)
                }}
              >
                <span className="combobox-name">
                  {food.grade && (
                    <span
                      className="grade-dot"
                      style={{ background: gradeMeta[food.grade].color }}
                      title={gradeMeta[food.grade].label}
                      aria-label={gradeMeta[food.grade].label}
                    />
                  )}
                  {food.name}
                </span>
                <span className="combobox-meta">
                  {food.calories}kcal / {food.servingSize}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      className={
                        'fav-toggle' + (favoriteIds.includes(food.foodId) ? ' on' : '')
                      }
                      aria-label={favoriteIds.includes(food.foodId) ? '즐겨찾기 해제' : '즐겨찾기'}
                      onPointerDown={(event) => {
                        // 별표 클릭은 음식 선택/닫힘으로 이어지지 않게 막는다.
                        event.preventDefault()
                        event.stopPropagation()
                        onToggleFavorite(food.foodId)
                      }}
                    >
                      <Star
                        size={15}
                        fill={favoriteIds.includes(food.foodId) ? '#f59e0b' : 'none'}
                        stroke={favoriteIds.includes(food.foodId) ? '#f59e0b' : '#94a3b8'}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </span>
              </li>
            ))
          ) : (
            <li className="combobox-empty">검색 결과가 없습니다</li>
          )}
        </ul>
      )}
    </div>
  )
}
