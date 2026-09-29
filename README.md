# 주류 예약 O2O 플랫폼 POC

데일리샷과 유사한 주류 예약 O2O 플랫폼의 POC (Proof of Concept) 입니다.

## 프로젝트 구조

```
├── backend/           # Node.js + Express API 서버
│   ├── src/
│   │   ├── models/    # 데이터 모델 (엔티티 타입)
│   │   ├── database/  # SQLite 데이터베이스 설정
│   │   ├── repositories/ # 데이터 접근 계층
│   │   ├── services/  # 비즈니스 로직 계층
│   │   ├── routes/    # API 라우트
│   │   ├── middleware/ # Express 미들웨어
│   │   └── __tests__/ # 테스트
│   └── data/          # SQLite DB 파일 (자동 생성)
│
└── mobile/            # React Native 모바일 앱
    └── src/
        ├── screens/   # 화면 컴포넌트
        ├── services/  # API 클라이언트
        ├── types/     # TypeScript 타입 정의
        └── __tests__/ # 컴포넌트 테스트
```

## 기술 스택

- **Backend**: Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Frontend**: React Native, TypeScript
- **Authentication**: JWT
- **Testing**: Jest

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 사용자 인증 (FR1) | 회원가입/로그인, 성인인증 |
| 주류 카탈로그 (FR2) | 검색, 상세정보, 평점/리뷰 |
| 가맹점 관리 (FR3) | 조회, 재고확인, 신고 |
| 예약 기능 (FR4) | 생성, 관리, 상태관리 |
| 결제 기능 (FR5) | 처리(테스트모드), 내역 |

## 시작하기

### Backend 서버 실행

```bash
cd backend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 또는 빌드 후 실행
npm run build
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 환경 설정

```bash
# backend 디렉토리에서
cp .env.example .env
# .env 파일 편집하여 JWT_SECRET 등 설정
```

### API 테스트

```bash
cd backend
npm test
```

### Mobile 앱 실행

```bash
cd mobile

# 의존성 설치
npm install

# iOS 실행 (Mac에서)
npm run ios

# Android 실행
npm run android
```

## API 엔드포인트

### 인증

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/verify-adult` | 성인인증 |
| GET | `/api/auth/me` | 내 정보 조회 |

### 주류

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/liquors` | 주류 목록/검색 |
| GET | `/api/liquors/:id` | 주류 상세 |
| GET | `/api/liquors/:id/reviews` | 주류 리뷰 목록 |
| POST | `/api/liquors/:id/reviews` | 리뷰 작성 |

### 가맹점

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | 가맹점 목록 |
| GET | `/api/stores/:id` | 가맹점 상세 |
| GET | `/api/stores/:id/inventory` | 재고 현황 |
| POST | `/api/stores/:id/report` | 신고 |

### 예약

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reservations` | 예약 생성 |
| GET | `/api/reservations` | 내 예약 목록 |
| GET | `/api/reservations/:id` | 예약 상세 |
| DELETE | `/api/reservations/:id` | 예약 취소 |

### 결제

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | 결제 처리 |
| GET | `/api/payments` | 결제 내역 |
| GET | `/api/payments/:id` | 결제 상세 |
| POST | `/api/payments/:id/refund` | 환불 요청 |

## 테스트 데이터

개발 환경에서 서버 시작 시 자동으로 시드 데이터가 삽입됩니다:

- 5개의 주류 (위스키, 와인, 맥주, 소주, 사케)
- 3개의 가맹점 (강남, 홍대, 이태원)
- 가맹점별 재고 데이터

## 제약사항 (POC 범위)

- 결제 연동: 테스트 모드 (실제 PG 연동 없음)
- 성인인증: 생년월일 기반 간단 검증
- 푸시 알림: 미구현
- 위치 기반 검색: 미구현
- 웹 버전: 미구현

## 라이선스

Private - POC 용도
