# 📚 책담 (Chaekdam)

> 책 + 이야기(담) — 도서를 기록하고, 추천받고, 다른 사람과 함께 읽는 **소셜 도서 관리 플랫폼**

내 서재에 책을 등록하고 독서 상태를 관리하며, AI로 책 표지를 생성하고, 다른 사용자를 팔로우해 독서 활동을 피드로 공유할 수 있는 풀스택 웹 애플리케이션입니다.

---

# 👥 역할 분담

| 역할                  | 담당자      | 담당 업무                                                                                     |
| ------------------- | -------- | ----------------------------------------------------------------------------------------- |
| 📋 PM               | 성현욱      | - ERD / API 정의서 작성<br>- README.md 작성<br>- 발표 자료 준비<br>- 통합 이슈 추적                          |
| ⚙️ 백엔드 개발 1         | 김남효      | - Book Entity 작성<br>- BookRepository 구현<br>- H2 콘솔 확인<br>- Lombok 적용<br>- AI 표지 생성·예외 처리 참여 |
| 🛠️ 백엔드 개발 2        | 손가영, 이채현 | - BookService 클래스 구현<br>- 비즈니스 로직 작성<br>- BookNotFoundException 처리<br>- @Transactional 처리 |
| 🔗 백엔드 개발 3         | 이세은, 조영진 | - BookController 구현<br>- 5종 CRUD 엔드포인트 작성<br>- @Valid + @NotBlank 적용<br>- Postman 테스트     |
| 🚨 통합 / 예외 처리       | 류연우      | - WebConfig (CORS) 설정<br>- GlobalExceptionHandler 구현<br>- 로드맵 디버깅<br>- 트러블슈팅 정리           |
| 🤖 AI / Frontend 연동 | 박병린      | - Frontend 코드 분석<br>- fetch URL 변경 및 1차 연동<br>- OpenAI 표시 흐름 구현<br>- E2E 시연 준비            |

## ✨ 주요 기능

| 분류 | 기능 |
| --- | --- |
| **도서 관리** | 도서 등록·수정·삭제, 휴지통(소프트 삭제)·복구, 독서 상태(읽고 싶은/읽는 중/중단/완독) 관리 |
| **서재 & 책장** | 개인 서재, 커스텀 책장 생성/배정, 서재 공개·비공개 설정 |
| **탐색 & 추천** | 전체 도서 탐색, 분위기 기반 필터, 맞춤 추천(장르·분위기 분석), 랜덤 도서 |
| **리뷰 & 하이라이트** | 별점·태그 리뷰 작성, 인상 깊은 문장(하이라이트) 기록, 스포일러 표시 |
| **AI 표지 생성** | OpenAI 이미지 API로 3가지 디자인(시네마틱/미니멀/추상 타이포)의 책 표지 자동 생성 |
| **소셜** | 사용자 검색, 팔로우/언팔로우, 팔로잉 피드, 피드 좋아요·댓글 |
| **독서 목표** | 연간 독서 목표 설정, 진행률 추적, 목표에 책 추가 |

---

## 📸 스크린샷

> 아래 자리에 실제 화면 캡처를 추가하세요. (`docs/screenshots/` 폴더에 이미지를 넣고 경로를 연결)

| 홈 / 피드 | 도서 상세                                      | 둘러보기 |
| ---|---|---|
| ![홈 화면](./docs/screenshots/home.png) | ![도서 상세](docs/screenshots/book-detail.png) | ![둘러보기](./docs/screenshots/discover.png) |

| 내 서재 | AI 표지 생성 | 도서 추천 |
| --- | --- | --- |
| ![내 서재](docs/screenshots/mylibrary.png) | ![AI 표지](./docs/screenshots/ai.png) | ![도서 추천](./docs/screenshots/recommend.png)

<!--
이미지 추가 방법:
1. docs/screenshots/ 폴더 생성
2. 캡처 이미지를 home.png, book-detail.png 등으로 저장
3. 필요에 따라 표/행을 추가하거나 삭제
-->

---

## 🛠 기술 스택

### Backend
- **Java 17**, **Spring Boot 4.0.6**
- Spring Data JPA, Spring Validation, Spring Web MVC
- **H2 Database** (파일 기반)
- Lombok, Spring Security Crypto (비밀번호 암호화)
- Gradle

### Frontend
- **React 19**, **Vite 6**
- React Router DOM 7
- Plain CSS (디자인 시스템 / CSS 변수 기반 테마)

### External
- **OpenAI Image Generation API** (AI 표지 생성)

---

## 📁 프로젝트 구조

```
bookapp/
├── bookapp/                # 백엔드 (Spring Boot)
│   └── src/main/java/com/aivle/bookapp/
│       ├── controller/     # REST 컨트롤러
│       ├── service/        # 비즈니스 로직
│       ├── repository/     # JPA 리포지토리
│       ├── entity/         # JPA 엔티티
│       ├── dto/            # 요청/응답 DTO
│       ├── config/         # CORS, 비밀번호 설정
│       └── exception/      # 전역 예외 처리
│
├── frontend/               # 프론트엔드 (React + Vite)
│   └── src/
│       ├── api/            # API 호출 모듈 (apiFetch 래퍼)
│       ├── components/     # 재사용 컴포넌트
│       ├── context/        # 전역 상태 (Auth, ReadingGoal)
│       ├── pages/          # 페이지 컴포넌트
│       ├── styles/         # CSS
│       └── constants.js    # 공용 상수
│
└── docs/                   # 문서
    ├── API.md              # API 명세서
    └── schema.dbml         # ER 다이어그램 (dbdiagram.io)
```

---

## 🚀 실행 방법

### 사전 요구사항
- JDK 17+
- Node.js 18+

### 1. 백엔드 실행
```bash
cd bookapp
./gradlew bootRun        # Windows: gradlew.bat bootRun
```
- 서버: `http://localhost:8080`
- H2 콘솔: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./bookapp-data`, 사용자: `sa`, 비밀번호: (없음)

### 2. 프론트엔드 실행
```bash
cd frontend
pnpm install --frozen-lockfile
pnpm run dev
```
- 개발 서버: `http://localhost:5173`

> 백엔드가 `localhost:5173`, `5174`, `3000` Origin에 대해 CORS를 허용하도록 설정되어 있습니다.

---

## 🔑 AI 표지 생성 사용법

AI 표지 생성 기능은 **사용자 본인의 OpenAI API 키**를 사용합니다.
1. [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 발급
2. 도서 등록 / 표지 생성 화면에서 키 입력 (브라우저 localStorage에 저장)
3. "AI 표지 생성하기" 클릭 → 3가지 디자인 시안 생성

---

## 📖 문서

- **[API 명세서](./docs/API.md)** — 전체 REST 엔드포인트, 요청/응답 형식
- **[ER 다이어그램 (DBML)](./docs/schema.dbml)** — [dbdiagram.io](https://dbdiagram.io)에 붙여넣어 시각화

---

## 🗄 데이터 모델 (요약)

| 엔티티 | 설명 |
| --- | --- |
| `User` | 회원 계정 (이메일/사용자명/닉네임, 서재 공개 여부) |
| `Book` | 도서 (소유자, 독서 상태, 책장, 분위기 태그, 소프트 삭제) |
| `Bookshelf` | 사용자 커스텀 책장 |
| `Review` / `Highlight` | 리뷰(별점·태그) / 인상 깊은 문장 |
| `Follow` | 팔로우 관계 (자기참조) |
| `Feed` / `FeedComment` / `FeedLike` | 활동 피드 및 상호작용 |
| `BookLike` | 도서 좋아요 |

> 인증은 JWT 없이 로그인 후 클라이언트가 `userId`를 보관하는 방식입니다.

---
