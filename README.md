# 🎯 my-test-app

내부 관리자 앱에서 사용된 특정 기능만 추출하여 정리한 React 기반 미니 앱입니다.  
지급 조건을 설정하고 파일로 저장하거나 불러올 수 있는 기능을 포함합니다.

## 🛠 주요 기능

- 조건(금액 + 사은품 항목들)을 동적으로 추가/삭제
- 조건 데이터를 `.cnf` 파일로 인코딩하여 다운로드
- 저장된 `.cnf` 파일을 다시 불러와 로컬 상태에 반영
- 데이터는 base64 인코딩된 JSON 문자열로 구성

## 💡 사용 기술

- React + TypeScript
- Chakra UI (토스트, 스타일링)
- 브라우저 API (`Blob`, `FileReader`, `Buffer`)
- `useCallback`, `useState` 등 React Hooks 활용

## 📦 실행 방법

```bash
git clone https://github.com/Dodam09/my-test-app.git
cd my-test-app
npm install
npm run dev
```

## 🧩 파일 포맷 설명

`.cnf` 파일은 인코딩된 JSON 구조입니다.  
조건과 사은품 정보가 아래와 같은 형식으로 저장됩니다:

```json
[
  {
    "condition": "50000",
    "gifts": [
      {
        "giftName": "에코백",
        "giftSkuCode": "SKU999",
        "giftQty": 2
      }
    ]
  }
]

```

## ✅ 유효성 검사 로직

- 확장자가 `.cnf`인지 확인
- base64 → JSON 디코딩 및 파싱
- 필드 누락 여부, 숫자 타입 체크
- 문제가 있을 경우 Chakra UI 토스트로 에러 알림

## ✍️ 개발 포인트

- 기존 내부 관리자 시스템의 일부 기능만 모듈화
- 인코딩/디코딩, 파일 핸들링 로직 직접 설계
- 재사용 가능한 상태 관리 및 최적화 고려 (`useCallback`)
- 웹 브라우저 환경에서 파일 다운로드/업로드 구현 경험

---

> ⚠️ 본 프로젝트는 실제 운영 중인 내부 시스템의 일부 기능을 참고하여 별도로 재구성한 학습/포트폴리오용 앱입니다.
