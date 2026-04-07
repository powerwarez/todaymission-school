# 학생용 프로젝트(todaymission) QR 자동 로그인 구현 가이드

## 개요

교사용 프로젝트에서 QR 코드 생성 방식이 변경되었습니다.

- **기존**: QR 코드에 JSON 데이터(`{ token, student_name, school_id }`)를 인코딩
- **변경 후**: QR 코드에 학생용 사이트 URL(`https://todaymission.vercel.app/?qr_token=TOKEN`)을 인코딩

이제 학생이 태블릿 카메라로 QR 코드를 스캔하면 바로 학생용 사이트로 이동하면서 자동 로그인됩니다. 학생용 프로젝트에서 URL 쿼리 파라미터(`qr_token`)를 읽어 자동 로그인을 처리하는 코드를 추가해야 합니다.

---

## 수정 대상 파일

### 1. 인증 컨텍스트 (AuthContext 또는 로그인 관련 컨텍스트)

URL 쿼리 파라미터에서 `qr_token`을 감지하고 자동 로그인을 수행하는 로직을 추가합니다.

#### 수정 위치: `initAuth` 또는 최초 인증 초기화 부분

```typescript
// URL 쿼리 파라미터에서 qr_token 확인
const urlParams = new URLSearchParams(window.location.search);
const qrTokenFromUrl = urlParams.get("qr_token");

if (qrTokenFromUrl) {
  // URL에서 qr_token 파라미터가 있으면 자동 로그인 시도
  const profile = await fetchStudentProfile(qrTokenFromUrl);
  if (profile) {
    // 쿠키에 토큰 저장 (다음 3월 1일까지 유효)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let expiryYear = currentYear;
    if (currentMonth >= 2) {
      expiryYear = currentYear + 1;
    }
    const expiryDate = new Date(expiryYear, 2, 1);
    document.cookie = `student_qr_token=${qrTokenFromUrl}; expires=${expiryDate.toUTCString()}; path=/;`;

    setUserProfile(profile);
    setLoading(false);

    // URL에서 qr_token 파라미터 제거 (깔끔한 URL 유지)
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    return;
  }
}
```

#### 전체 흐름 (initAuth 함수 내 우선순위)

```typescript
const initAuth = async () => {
  try {
    // 1순위: URL 쿼리 파라미터의 qr_token으로 자동 로그인
    const urlParams = new URLSearchParams(window.location.search);
    const qrTokenFromUrl = urlParams.get("qr_token");

    if (qrTokenFromUrl) {
      const profile = await fetchStudentProfile(qrTokenFromUrl);
      if (profile) {
        // 쿠키에 저장
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        let expiryYear = currentYear;
        if (currentMonth >= 2) {
          expiryYear = currentYear + 1;
        }
        const expiryDate = new Date(expiryYear, 2, 1);
        document.cookie = `student_qr_token=${qrTokenFromUrl}; expires=${expiryDate.toUTCString()}; path=/;`;

        setUserProfile(profile);
        setLoading(false);

        // URL 정리
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }
    }

    // 2순위: 쿠키에 저장된 qr_token으로 로그인 (기존 로직)
    const cookies = document.cookie.split(";");
    const qrTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("student_qr_token=")
    );

    if (qrTokenCookie) {
      const qrToken = qrTokenCookie.split("=")[1];
      const profile = await fetchStudentProfile(qrToken);
      if (profile) {
        setUserProfile(profile);
        setLoading(false);
        return;
      }
    }

    // 3순위: Supabase Auth 세션 (교사 로그인 등)
    // ... 기존 세션 체크 로직 ...

    setLoading(false);
  } catch (err) {
    console.error("Error initializing auth:", err);
    setLoading(false);
  }
};
```

---

### 2. 로그인 페이지 (선택 사항)

QR 카메라 스캔 로그인 UI는 더 이상 필요하지 않을 수 있습니다. QR 코드를 태블릿 기본 카메라로 스캔하면 URL이 열리면서 자동 로그인되기 때문입니다.

로그인 페이지의 "카메라로 QR 스캔" 기능은 제거하거나, 별도 폴백으로 남겨둘 수 있습니다.

---

### 3. 라우팅 (App.tsx 등)

루트 경로(`/`)에서 `qr_token` 쿼리 파라미터가 있을 때 정상적으로 AuthContext가 처리할 수 있도록 확인합니다. 보통 AuthContext의 `initAuth`가 앱 마운트 시 실행되므로 별도 라우팅 변경은 필요하지 않습니다.

단, 루트 경로가 `PublicRoute`로 감싸져 있고 이미 로그인 상태면 리다이렉트하는 경우, `qr_token` 파라미터 처리가 리다이렉트보다 먼저 실행되는지 확인이 필요합니다.

---

## 동작 흐름

```
1. 교사가 교사용 앱에서 학생 QR 코드 PDF를 출력
   └─ QR 코드에는 "https://todaymission.vercel.app/?qr_token=XXXXX" URL이 인코딩됨

2. 학생이 태블릿 기본 카메라로 QR 코드를 스캔
   └─ 카메라가 URL을 인식하고 브라우저에서 해당 URL을 열음

3. 학생용 앱이 로드되면서 AuthContext의 initAuth가 실행
   └─ URL에서 qr_token 쿼리 파라미터를 감지
   └─ fetchStudentProfile(qrToken)으로 학생 프로필 조회
   └─ 쿠키에 토큰 저장 (이후 재방문 시 자동 로그인)
   └─ URL에서 qr_token 파라미터 제거 (깔끔한 URL)
   └─ 로그인 완료 → 학생 대시보드로 이동
```

---

## 테스트 체크리스트

- [ ] `https://todaymission.vercel.app/?qr_token=유효한토큰` 접속 시 자동 로그인되는지 확인
- [ ] 로그인 후 URL에서 `qr_token` 파라미터가 제거되는지 확인
- [ ] 유효하지 않은 토큰으로 접속 시 적절한 에러 처리 (로그인 페이지로 이동 등)
- [ ] 이미 쿠키로 로그인된 상태에서 다른 학생의 QR URL로 접속 시 새 학생으로 전환되는지 확인
- [ ] 쿠키가 없는 상태에서 QR URL 없이 접속 시 기존 로그인 페이지가 정상 표시되는지 확인
