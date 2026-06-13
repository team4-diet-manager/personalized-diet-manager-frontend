# Personalized Diet Manager — Frontend

[Personalized Diet Manager 백엔드](https://github.com/team4-diet-manager/personalized-diet-manager-backend)와 연동되는 식단·칼로리 관리 화면입니다. 프로필 저장 → 권장 칼로리 계산 → 식단 기록 → 날짜별 조회 → 일일 리포트까지 한 화면에서 처리합니다.

## 기술 스택

- React 18, TypeScript
- Vite
- lucide-react (아이콘)

## 실행 방법

```bash
npm install
npm run dev
```

- 개발 서버 주소: <http://localhost:5173>
- **백엔드(8080)가 먼저 실행되어 있어야 합니다.** `vite.config.ts`에서 `/api` 요청을 `http://localhost:8080`으로 프록시하므로 별도 환경 변수 설정 없이 동작합니다.

### 기타 스크립트

```bash
npm run build     # 타입 체크(tsc) + 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint
```

## 화면 구성

- **상단 대시보드**: 권장 칼로리 / 섭취 칼로리 / 차이
- **프로필 패널**: 성별·나이·키·몸무게·활동량·목표 입력 → `저장` / `계산`
- **식단 기록 패널**: 날짜·식사 구분·음식·수량 입력 → `기록` / `조회`
- **날짜별 기록 테이블**: 선택한 날짜의 식단 목록과 리포트 메시지

### 동작 참고

- 권장 칼로리 **리포트와 날짜별 기록은 "저장된 프로필" 기준**으로 계산됩니다. 폼에서 목표·신체 정보를 바꾼 뒤에는 `저장`을 다시 눌러야 리포트에 반영되며, 입력값이 저장된 프로필과 다르면 화면에 안내 배너가 표시됩니다.
- `계산` 버튼은 현재 입력값 기준으로 즉시 계산한 결과를 보여주며, 저장과는 별개입니다.

## 백엔드 연동

연동하는 주요 API는 `src/api.ts`에 정의되어 있습니다. 전체 API 목록과 계산 로직은 [백엔드 README](https://github.com/team4-diet-manager/personalized-diet-manager-backend#readme)를 참고하세요.
