# 🎯 my-test-app

내부 관리자 앱의 **사은품 지급 조건 관리 기능**만 추출하여 재구성한 React 기반 미니 앱입니다.  
주문서 조건(금액/사은품)을 설정하고, 이를 파일로 저장·불러오기 할 수 있도록 구현했습니다.  

## 🛠 주요 기능

- **조건 관리**: 금액 조건과 사은품 항목을 동적으로 추가/삭제  
- **파일 저장/불러오기**: 조건 데이터를 `.cnf`(base64 인코딩된 JSON)로 다운로드/업로드  
- **유효성 검사**: 필수 필드·숫자 타입·확장자 검증 후 오류 알림(Chakra UI Toast)  
- **상태 유지**: 조건 데이터(`fields`)를 로컬스토리지에 저장 및 복원  

## 💡 사용 기술

- React + TypeScript  
- Chakra UI (토스트, 스타일링)  
- 브라우저 API (`Blob`, `FileReader`, `Buffer`)  
- React Hooks (`useState`, `useCallback`)  

## 📦 실행 방법
```bash
git clone https://github.com/Dodam09/my-test-app.git
cd my-test-app
npm install
npm run dev
```

## 🧩 데이터 구조(.cnf)

`.cnf` 파일은 base64 인코딩된 JSON 배열입니다.  
예시:
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

## 📌 개발 포인트

- 기존 내부 관리자 시스템에서 **내가 직접 구현한 UI·파일처리 로직**만 모듈화  
- 인코딩/디코딩, 브라우저 기반 파일 다운로드/업로드 전 과정 직접 설계  
- 재사용성을 고려한 컴포넌트·상태 관리 구조 설계  
- 실제 운영 환경에서의 유지보수 경험을 포트폴리오 형태로 재현  

---

> ⚠️ 본 프로젝트는 실제 운영 중인 내부 시스템 기능을 참고하여 학습·포트폴리오 목적으로 재구성되었습니다.
