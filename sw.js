/* Golmok service worker
   - 화면 이동(navigate)과 앱 코드(js·css·manifest)는 network-first. 네트워크가 안 될 때만 캐시로 떨어진다.
     화면 HTML 과 그 HTML 이 부르는 코드가 같은 배포본이어야 하기 때문이다. 코드를 cache-first 로 주면
     재배포 직후 첫 방문에서 새 미리렌더 HTML 위에 옛 data.js·app.js 가 돌아, 새로 추가한 가게 주소가
     홈으로 그려지고(옛 데이터에 없으니) 고친·지운 내용도 한 번은 옛 것으로 보인다.
     네트워크로 받을 때는 cache: 'no-cache' 로 서버에 확인한다(바뀌지 않았으면 304 라 가볍다).
     GitHub Pages 는 max-age=600 을 주므로 기본 모드면 브라우저 HTTP 캐시에 남은 10분 안의 옛 사본이 섞인다.
   - 화면 이동은 NAV_TIMEOUT(3.5초)까지만 네트워크를 기다린다. 로밍·지하철처럼 끊길 듯 말 듯한 연결에서
     fetch 가 실패할 때까지 수십 초 흰 화면을 보지 않게, 시간이 넘으면 캐시해 둔 같은 페이지를, 없으면 앱 셸을 준다.
     네트워크가 아예 안 되면(비행기 모드) 기다리지 않고 바로 같은 폴백으로 간다.
     늦게 도착한 네트워크 응답은 버리지 않고 캐시 갱신에만 쓴다 — 다음에 그 주소를 열 때 쓰인다.
   - 캐시해 두는 페이지는 언어 주소(base + en|ja|zh|ko + /…)의 정상 응답뿐이다. 언어 없는 주소(사이트 루트,
     매장 QR 주소)는 공개본에서 리다이렉트 페이지라, 그 스크립트(redirect.js)가 캐시에 없어 오프라인에서 멈춘다 —
     그런 주소는 언제나 앱 셸로 폴백한다. 사용자 전용 경로(c/my-…)는 404 라 저장되지 않는다.
   - 화면 이동이 네트워크로 안 되면 캐시해 둔 앱 셸(shell.html)을 준다 —
     /golmok/en/s/seongsu/onion/ 같은 깊은 경로를 오프라인에서 열어도 셸의 app.js 가 주소를 읽어
     그 화면을 그린다(콘텐츠는 전부 data.js 안에 있다). 공개본의 index.html 은 언어를 고르는
     리다이렉트 페이지라 폴백으로 쓰면 앱이 뜨지 않는다 — 그래서 shell.html 이다.
     shell.html 은 scripts/build.mjs 가 site/ 에 만들고, 개발 서버용으로 프로젝트 루트에도
     index.html 과 똑같은 사본이 있다(스모크 테스트가 두 파일이 같은지 본다).
   - scope 루트(설치한 앱의 start_url, 공개본 /golmok/)로의 화면 이동은 캐시한 셸을 먼저 준다.
     공개본의 루트는 언어를 고르는 리다이렉트 페이지라 네트워크로 받으면 화면 이동이 두 번 일어난다.
     셸의 app.js 가 언어 없는 주소를 저장된 언어로 replaceState 하므로 홈 화면 아이콘이 바로 열리고,
     오프라인에서도 똑같다. 최신성은 응답 뒤 백그라운드에서 registration.update() 로 확인한다 —
     새 배포본이 있으면 새 서비스워커가 새 캐시에 셸과 코드를 한 묶음으로 받아 다음 실행부터 쓰인다.
   - 이 서비스워커가 캐시에서 준 화면(루트의 셸, 시간 초과·오프라인 폴백)은 앱 코드도 같은 캐시에서 받는다
     (FetchEvent.resultingClientId 로 그 창을 기억한다). 셸은 캐시본인데 코드만 새 배포본이면 스크립트 목록이
     어긋날 수 있고, 연결이 나쁜데 코드를 네트워크로 기다리면 셸을 일찍 준 의미가 없다.
     resultingClientId 가 없는 브라우저는 지금처럼 network-first 로 받는다(오프라인이면 캐시).
   - Google Fonts(fonts.googleapis.com 의 CSS, fonts.gstatic.com 의 글꼴 파일)는 별도 캐시(FONTS)에
     stale-while-revalidate 로 둔다. 캐시가 있으면 바로 주고 뒤에서 새로 받아 둔다. <link> 로 부르는 CSS 는
     no-cors 라 opaque 응답인데, 그대로 저장한다. 외부 출처 중 이 둘의 stylesheet·font 요청만 다루고
     나머지 외부 요청은 건드리지 않는다.
   - 그 밖의 같은 출처 자원(아이콘 등)은 cache-first, 처음 받을 때 캐시에 넣는다.
   - 사전 캐시(CORE)는 설치 때 한 번에 받은 묶음 그대로 둔다. 오프라인 폴백은 셸과 코드가 같은 설치본이어야
     맞물리므로, 네트워크로 받은 코드를 캐시에 덮어쓰지 않는다(새 배포본은 새 서비스워커가 새 캐시로 받는다).
   - 이 파일의 상대 주소는 전부 서비스워커 위치(= base, 공개본은 /golmok/) 기준으로 풀린다.

   규칙
   - css/js/data 가 바뀌면 CACHE 버전을 올릴 것(로컬 개발용). 공개본은 build.mjs 가 자산 해시를
     자동으로 붙인다(golmok-v10 → golmok-v10-<해시>) — sw.js 바이트가 같으면 재배포해도 옛 캐시가 남기 때문이다.
   - 캐시 이름은 반드시 PREFIX(golmok-)로 시작한다. Cache Storage 는 경로가 아니라 출처 단위라
     brucedata.github.io 의 다른 Pages 프로젝트와 같은 저장소를 쓴다 — 남의 캐시는 지우지도 읽지도 않는다.
   - CORE 의 js 목록은 index.html 스크립트 순서와 같게 유지한다(스모크가 검사한다 — 스모크는 이 파일에서
     작은따옴표로 감싼 js 경로를 전부 모으므로, 주석에도 js 경로를 따옴표로 감싸 쓰지 말 것).
     리다이렉트 페이지 전용 스크립트는 앱 스크립트가 아니므로 넣지 않는다.
   - CORE 항목이 하나라도 404 면 addAll 이 실패해 서비스워커 설치가 통째로 무산된다.
     빌드는 site/ 에 CORE 가 전부 있는지, 스모크는 프로젝트 루트에 전부 있는지 확인한다.
   - og-image.png · og/card.html 은 넣지 않는다(스크래퍼는 SW 를 거치지 않고, card.html 은 렌더 원본). */
const CACHE = 'golmok-v10-7b824a2bbd';
const PREFIX = 'golmok-';
const FONTS = 'golmok-fonts';   /* 배포본과 상관없는 글꼴 캐시 — 버전 없이 유지, activate 정리에서 뺀다 */
const SHELL = 'shell.html';
const CORE = [
  './',
  'index.html',
  'shell.html',
  'css/style.css',
  'js/i18n.js',
  'js/data.js',
  'js/companions.js',
  'js/companion-store.js',
  'js/saved-store.js',
  'js/views-home.js',
  'js/views-guide.js',
  'js/views-companion.js',
  'js/views-saved.js',
  'js/views-partner.js',
  'js/install.js',
  'js/app.js',
  'manifest.webmanifest',
  'icon.svg',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
];

const NAV_TIMEOUT = 3500;        /* 화면 이동이 네트워크를 기다리는 최대 시간(ms) */
const PAGE_MAX = 60;             /* 캐시해 두는 언어 페이지 수 — 넘으면 오래 안 연 것부터 지운다 */
const FONT_MAX = 30;             /* 글꼴 캐시 항목 수(CSS + 글자 범위별 woff2) */
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const PAGE_LANG = /^(?:en|ja|zh|ko)\//;

/* 이 서비스워커의 base(끝이 /). 옛 캐시가 우리 것인지 가를 때 쓴다. */
const SCOPE = new URL('./', self.location.href).href;

/* scope 루트의 경로(공개본 /golmok/). 등록 scope 를 따르고, registration 이 없는 환경
   (스모크의 가짜 워커)에서는 서비스워커 위치로 푼다. */
function rootPath() {
  try {
    if (self.registration && self.registration.scope) return new URL('./', self.registration.scope).pathname;
  } catch (err) { /* 아래로 */ }
  return new URL(SCOPE).pathname;
}

/* 사전 캐시용 요청 — HTTP 캐시를 건너뛰고 서버에서 새로 받는다(cache: 'reload').
   기본 모드면 배포 직전 10분(max-age=600) 안에 받아 둔 옛 js/css 가 새 해시 이름의 캐시에 들어가,
   새 app.js 와 옛 i18n.js 같은 섞인 묶음이 다음 배포까지 굳는다.
   주소는 서비스워커 위치 기준 절대 주소로 풀어 둔다(addAll 에 문자열로 줄 때와 같은 키).
   (Request 가 없는 환경 — 스모크의 가짜 워커 — 에서는 주소 그대로 넘긴다.) */
function fresh(u) {
  return typeof Request === 'function' ? new Request(new URL(u, self.location.href).href, { cache: 'reload' }) : u;
}

/* 네트워크로 받을 요청 — 브라우저 기본 모드면 서버에 확인하는 no-cache 로 바꾼다.
   새로고침처럼 브라우저가 이미 고른 모드는 그대로 둔다. 화면 이동 요청을 감싸면 표준대로 mode 가
   same-origin 이 되고 redirect 모드(manual)는 그대로라 리다이렉트도 지금처럼 브라우저가 따라간다.
   감싸기를 거부하는 브라우저면 원래 요청 그대로 보낸다. */
function revalidating(req) {
  if (req.cache !== 'default' || typeof Request !== 'function') return req;
  try { return new Request(req, { cache: 'no-cache' }); } catch (err) { return req; }
}

/* 이 앱의 캐시에서만 찾는다. caches.match 는 출처의 모든 캐시를 뒤져 같은 출처 다른 앱이 넣어 둔
   응답을 줄 수 있다. loose 면 쿼리 꼬리를 무시하고 한 번 더 찾는다 — 오프라인 폴백에서
   app.js?v=… 처럼 꼬리 붙은 요청도 사전 캐시의 꼬리 없는 항목으로 받게. */
function fromCache(req, loose) {
  return caches.open(CACHE).then((c) => c.match(req).then((hit) => (hit || !loose ? hit : c.match(req, { ignoreSearch: true }))));
}

/* waitUntil 로 감싸 서비스워커가 저장 도중 종료되지 않게 한다. 이벤트가 이미 끝나 던지면 저장만 계속한다. */
function keepAlive(e, p) {
  try { e.waitUntil(p); } catch (err) { /* 늦은 호출 */ }
  return p;
}

/* ms 뒤에 풀리는 약속. 타이머가 없는 환경(스모크의 가짜 워커)에서는 풀리지 않는다 — 그러면 네트워크만 기다린다. */
function after(ms) {
  return new Promise((resolve) => { if (typeof setTimeout === 'function') setTimeout(resolve, ms); });
}

/* 캐시에서 준 화면의 창 id. 그 창이 부르는 앱 코드는 같은 캐시에서 준다(위 머리말).
   서비스워커가 내려갔다 다시 뜨면 비지만, 그때는 원래대로 network-first 라 안전하다. */
const cacheClients = new Set();
function servedFromCache(e) {
  const id = e && e.resultingClientId;
  if (!id) return;
  cacheClients.add(id);
  if (cacheClients.size > 32) cacheClients.delete(cacheClients.values().next().value);
}

/* 오래된 것부터 지워 n 개만 남긴다. keep 이 있으면 그 조건에 맞는 항목만 센다. */
function trim(c, max, keep) {
  return c.keys().then((reqs) => {
    const list = keep ? reqs.filter((r) => keep(new URL(r.url))) : reqs;
    const extra = list.length - max;
    return extra > 0 ? Promise.all(list.slice(0, extra).map((r) => c.delete(r))) : null;
  });
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map(fresh))).then(() => self.skipWaiting()));
});

/* 옛 캐시 정리. 이 앱 접두사(PREFIX) 캐시 중 지금 CACHE 와 글꼴 캐시가 아닌 것만 후보다.
   이름이 PREFIX 로 시작해도 같은 출처 다른 경로(예: /golmok-preview/)에 배포된 사본의
   캐시일 수 있으므로, 이 base 아래 주소가 들어 있는 캐시만 우리 옛 캐시로 보고 지운다. */
function dropIfOurs(name) {
  return caches.open(name)
    .then((c) => c.keys())
    .then((reqs) => (reqs.some((r) => r.url.indexOf(SCOPE) === 0) ? caches.delete(name) : false));
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS && k.indexOf(PREFIX) === 0).map(dropIfOurs)))
      .then(() => self.clients.claim())
  );
});

/* 개발 서버(serve 의 cleanUrls)는 shell.html → /shell 로 301 을 건다. 따라간 응답은 redirected 표시가
   붙어 저장되고, 브라우저는 그런 응답을 화면 이동 요청의 답으로 쓰지 못한다(네트워크 오류가 된다).
   본문·헤더만 옮긴 새 응답으로 바꿔서 준다. */
function unredirect(res) {
  if (!res || !res.redirected) return res;
  return res.blob().then((body) => new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }));
}

/* 캐시한 앱 셸 — 없으면 null. allowIndex 면 셸이 없을 때 index.html 이라도(옛 동작). */
function cachedShell(allowIndex) {
  return caches.open(CACHE)
    .then((c) => c.match(SHELL).then((r) => r || (allowIndex ? c.match('index.html') : null)))
    .then((r) => (r ? unredirect(r) : null))
    .catch(() => null);
}

function offlineShell() {
  return cachedShell(true).then((r) => r || Response.error());
}

/* ---------- 언어 페이지 캐시 ---------- */

function isPagePath(url) {
  const root = rootPath();
  return url.origin === location.origin && url.pathname.indexOf(root) === 0 && PAGE_LANG.test(url.pathname.slice(root.length));
}

/* 쿼리(utm 등)는 떼고 경로로만 저장·조회한다 */
function pageKey(url) { return url.origin + url.pathname; }

/* 정상 응답(200대, 리다이렉트 아님, 같은 출처)인 언어 페이지만 복사해 둔다. 저장 약속(없으면 null). */
function savePage(url, res) {
  try {
    if (!res || !res.ok || res.redirected || res.type !== 'basic' || !isPagePath(url)) return null;
    const copy = res.clone();
    return caches.open(CACHE)
      .then((c) => c.put(pageKey(url), copy).then(() => trim(c, PAGE_MAX, isPagePath)))
      .catch(() => {});
  } catch (err) { return null; }
}

function cachedPage(url) {
  if (!isPagePath(url)) return Promise.resolve(null);
  return caches.open(CACHE)
    .then((c) => c.match(pageKey(url), { ignoreVary: true }))
    .then((r) => r || null, () => null);
}

/* 파일처럼 보이는 주소(이미지·xml 등을 주소창에서 직접 연 경우)는 시간 초과로 셸을 주지 않는다 */
function isAssetPath(url) {
  return /\.[a-z0-9]+$/i.test(url.pathname) && !/\.html$/i.test(url.pathname);
}

/* ---------- 화면 이동 ---------- */

/* network-first + 시간 제한. 네트워크가 실패하거나 NAV_TIMEOUT 이 넘으면 캐시한 같은 페이지 → 셸.
   시간이 넘었는데 캐시에도 없으면 계속 네트워크를 기다린다. */
function navigation(e, req, url) {
  const network = fetch(revalidating(req)).then((res) => {
    const saving = savePage(url, res);          /* 제때 왔든 늦게 왔든 캐시를 새로 해 둔다 */
    if (saving) keepAlive(e, saving);
    return res;
  });
  keepAlive(e, network.catch(() => {}));        /* 폴백을 준 뒤에도 늦은 응답을 끝까지 받아 저장하게 */

  if (isAssetPath(url)) return network.catch(offlineShell);

  const fallback = () => cachedPage(url).then((hit) => hit || cachedShell(true));
  return new Promise((resolve) => {
    let settled = false;
    const settle = (res) => { if (!settled) { settled = true; resolve(res); } };
    const useCache = (res) => {
      if (res && !settled) servedFromCache(e);
      return res;
    };
    network.then(settle, () => fallback().then(useCache).then((res) => settle(res || Response.error())));
    after(NAV_TIMEOUT).then(() => {
      if (settled) return null;
      return fallback().then((res) => { if (res) settle(useCache(res)); });
    });
  });
}

/* scope 루트 — 캐시한 셸을 먼저 주고, 새 배포본 확인은 뒤에서 한다. 셸이 없으면 보통 화면 이동. */
function launch(e, req, url) {
  return cachedShell(false).then((shell) => {
    if (!shell) return navigation(e, req, url);
    servedFromCache(e);
    keepAlive(e, checkForUpdate());
    return shell;
  });
}

function checkForUpdate() {
  try {
    const reg = self.registration;
    if (reg && typeof reg.update === 'function') return Promise.resolve(reg.update()).catch(() => {});
  } catch (err) { /* 업데이트 확인을 못 해도 화면은 이미 나갔다 */ }
  return Promise.resolve();
}

/* ---------- Google Fonts ---------- */

/* 문서의 <link rel="stylesheet"> 와 그 CSS 의 @font-face 가 만드는 요청만 */
function isFontRequest(req, url) {
  return FONT_HOSTS.indexOf(url.hostname) !== -1 && (req.destination === 'style' || req.destination === 'font');
}

/* stale-while-revalidate. 캐시를 못 열면(저장소 부족 등) 캐시 없이 네트워크로만 준다. */
function fonts(e, req) {
  const store = caches.open(FONTS);
  return store.then((c) => c.match(req, { ignoreVary: true })).catch(() => null).then((hit) => {
    const network = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        keepAlive(e, store.then((c) => c.put(req, copy).then(() => trim(c, FONT_MAX))).catch(() => {}));
      }
      return res;
    });
    if (!hit) return network;
    keepAlive(e, network.catch(() => {}));       /* 뒤에서 새로 받아 두기만 한다 */
    return hit;
  });
}

/* 화면 HTML 과 같은 배포본이어야 하는 앱 코드 */
function isAppCode(req, url) {
  const d = req.destination;
  return d === 'script' || d === 'style' || d === 'manifest' || /\.(?:js|css|webmanifest)$/.test(url.pathname);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    if (isFontRequest(req, url)) e.respondWith(fonts(e, req));
    return;                                      /* 그 밖의 외부 자원은 브라우저가 직접 */
  }

  if (req.mode === 'navigate') {
    e.respondWith(url.pathname === rootPath() ? launch(e, req, url) : navigation(e, req, url));
    return;
  }
  if (isAppCode(req, url)) {
    if (e.clientId && cacheClients.has(e.clientId)) {
      e.respondWith(fromCache(req, true).then((hit) => hit || fetch(revalidating(req))));
      return;
    }
    e.respondWith(fetch(revalidating(req)).catch((err) => fromCache(req, true).then((hit) => hit || Promise.reject(err))));
    return;
  }
  e.respondWith(
    fromCache(req, false).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          keepAlive(e, caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}));
        }
        return res;
      });
    })
  );
});
