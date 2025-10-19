# mini-multi-scripts

모노레포 형태로 배너 메인 스크립트와 라이브 로케이터를 관리합니다. 모든 패키지는 Vite 기반이며, 루트에서 한 번의 빌드로 동일한 커밋 해시에 맞춰 결과물을 생성합니다.

## 패키지 구성

- `@banner/main`: 사이트 방문자에게 제공되는 메인 스크립트입니다. 페이지 로드시 배너 위치 정보를 JSON으로 받아 지정된 위치 뒤에 하드코딩된 배너를 삽입합니다. `?bannerLocator=1` 같은 특수 search parameter 가 있을 때만 라이브 로케이터 모듈을 로드합니다.
- `@banner/live-locator`: React 기반의 오버레이 UI로, 관리자만 사용할 수 있는 라이브 위치 지정 도구입니다. 커스텀 엘리먼트 `<banner-live-locator>`로 제공되며 Shadow DOM 안에서 렌더링되어 사이트 스타일과 격리됩니다.

## 개발 환경

1. 패키지 설치

   ```bash
   npm install
   ```

2. 두 개발 서버 동시에 실행

   ```bash
   npm run dev
   ```

   - `@banner/main`은 기본 포트 `5173`, `@banner/live-locator`는 기본 포트 `5174`에서 실행됩니다.

3. 라이브 로케이터만 별도 실행하고 싶다면

   ```bash
   npm run dev:live-locator
   ```

4. 메인 스크립트만 별도 실행하고 싶다면 (기본 포트: `5173`)

   ```bash
   npm run dev:main
   ```

   - 메인 페이지에 접속한 뒤 URL 에 `?bannerLocator=1` 을 추가하면 로케이터 모듈이 `http://localhost:5174/src/live-locator.tsx` 를 `<script type="module">`로 삽입하면서 로드됩니다.
   - 필요 시 `<script type="module">` 태그를 동적으로 삽입해 라이브 로케이터를 불러오며, 커스텀 엘리먼트가 자동으로 등록됩니다.
   - 다른 경로에서 라이브 로케이터 모듈을 제공하고 싶다면 `packages/main/.env` 또는 셸 환경변수로 `VITE_LIVE_LOCATOR_DEV_ORIGIN` 값을 설정하세요.

## 빌드 & 배포

루트에서 한 번에 두 패키지를 빌드합니다. 커밋 해시가 버전으로 사용되며, 결과물은 `dist/<commit>/` 이하에 모아집니다.

```bash
npm run build
```

- Git 저장소인 경우 현재 커밋 해시(12자리)가 버전으로 사용됩니다. Git 정보가 없으면 `COMMIT_SHA` 환경변수로 명시하거나 기본값 `dev`가 사용됩니다.
- 출력 구조 예시:

  ```
  dist/<commit>/
    main.js
    banner-locations.json
    live-locator/
      live-locator.js
    manifest.json
  ```

배포 시 S3와 같은 스토리지에 `dist/<commit>/` 폴더 전체를 업로드하고, 사이트에는 다음과 같이 삽입합니다.

```html
<script type="module" src="https://cdn.example.com/banner/<commit>/main.js"></script>
```

관리자가 라이브 로케이터를 사용해야 할 때는 URL 에 `?bannerLocator=1` 파라미터를 붙여 접속하면 됩니다. 일반 방문자는 해당 파라미터가 없으므로 라이브 로케이터 모듈이 로드되지 않습니다.

## 환경 변수 요약

- `COMMIT_SHA`: 빌드 버전을 강제로 지정합니다. (예: CI 환경)
- `VITE_LIVE_LOCATOR_DEV_ORIGIN`: 개발 환경에서 라이브 로케이터 모듈을 다른 URL 로부터 로드하고 싶을 때 사용합니다. 기본값은 `http://localhost:5174/src/live-locator.tsx` 입니다.

## 참고

- `banner-locations.json`은 현재 모킹된 데이터이며, 필요한 경우 S3와 같은 외부 경로로 교체할 수 있습니다.
- `window.__BANNER_TOOL__`와 `window.__BANNER_LIVE_LOCATOR__` 글로벌 객체에 버전/상태 정보를 노출하므로 디버깅에 활용할 수 있습니다.
