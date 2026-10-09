/* Golmok — 언어가 없는 주소를 언어가 붙은 주소로 보낸다.
   scripts/build.mjs 가 만드는 리다이렉트 페이지(사이트 루트 · d/{id}/ · s/{d}/{s}/ — 매장 QR 용)의
   <head> 에서만 실행된다. 앱 스크립트가 아니므로 index.html · sw.js · bundle.mjs 목록에 넣지 않는다.

   예) /golmok/s/seongsu/onion/  →  /golmok/ja/s/seongsu/onion/   (일본어 브라우저)
       /golmok/#/s/seongsu/onion →  /golmok/en/s/seongsu/onion/   (옛 해시 라우터 링크)

   언어 결정 규칙(js/app.js preferredLang 과 같다): 저장된 선호 → navigator.languages 앞에서부터 첫 일치 → navigator.language → en

   안전 규칙 — 열린 리다이렉트 금지
   - 목적지는 언제나 '같은 출처 + base + 언어 + / + routePath'. 출처는 location 에서 다시 붙인다.
   - routePath 는 ROUTES 의 모양만 통과(소문자·숫자·하이픈 id). 나머지는 전부 홈.
     '.'·'..'·퍼센트 인코딩한 점('%2e%2e')·'%2f'·역슬래시가 섞인 경로는 이 모양에 맞을 수 없어 홈이 된다.
   - 쿼리는 읽지 않는다. 해시는 사이트 루트에서, 옛 해시 링크(#/s/a/b)일 때만, 같은 검사를 통과하면 쓴다.
   - 이미 언어가 붙은 주소에서 이 스크립트가 돌면(오프라인 폴백 등) 다시 보내지 않는다 — 무한 새로고침 방지. */
(function () {
  'use strict';

  var LANG_CODES = ['en', 'ja', 'zh', 'ko'];
  var ID = '[a-z0-9]+(?:-[a-z0-9]+)*';
  /* 앱 라우터 계약의 routePath 전부. 모두 고정 세그먼트 + id 라 같은 출처 밖으로 나갈 수 없다. */
  var ROUTES = [
    /^$/,
    new RegExp('^d/' + ID + '$'),
    new RegExp('^s/' + ID + '/' + ID + '$'),
    /^companions$/,
    /^companions\/new$/,
    new RegExp('^c/' + ID + '$'),
    /^saved$/,
    /^partner$/
  ];

  function allowed(p) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].test(p)) return true;
    return false;
  }

  /* 빌드가 쓴 <base href> 의 경로. '//' 로 시작하면 프로토콜 상대 주소가 되므로 슬래시를 하나로 줄인다. */
  function basePath() {
    var p = '/';
    try {
      p = new URL(document.baseURI).pathname;
    } catch (e) {
      try {
        var a = document.createElement('a');
        a.href = './';
        p = a.pathname || '/';
      } catch (e2) { p = '/'; }
    }
    p = '/' + String(p || '').replace(/^\/+/, '');
    return p.slice(0, p.lastIndexOf('/') + 1);
  }

  /* 경로 조각 → routePath (앞뒤 슬래시·끝의 index.html 제거). 쿼리·해시 꼬리는 잘라 버린다. */
  function clean(raw) {
    var p = String(raw || '').split('?')[0].split('#')[0];
    p = p.replace(/(^|\/)index\.html$/, '');
    return p.replace(/^\/+|\/+$/g, '');
  }

  function pickLang() {
    try {
      var saved = localStorage.getItem('golmok-lang');
      if (LANG_CODES.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var prefs = [];
    try {
      if (navigator.languages && navigator.languages.length) prefs = Array.prototype.slice.call(navigator.languages);
      if (navigator.language) prefs.push(navigator.language);
    } catch (e) {}
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i] || '').toLowerCase().split(/[-_]/)[0];
      if (LANG_CODES.indexOf(code) !== -1) return code;
    }
    return 'en';
  }

  /* 보낼 경로(같은 출처의 절대 경로) 또는 null(보내지 않음) */
  function destination(base) {
    var path = String(location.pathname || '/');
    var route = path.indexOf(base) === 0 ? clean(path.slice(base.length)) : '';

    if (LANG_CODES.indexOf(route.split('/')[0]) !== -1) return null;
    if (!allowed(route)) route = '';

    if (route === '') {
      var h = String(location.hash || '');
      if (h.indexOf('#/') === 0) {
        var fromHash = clean(h.slice(2));
        if (allowed(fromHash)) route = fromHash;
      }
    }
    return base + pickLang() + '/' + route + (route ? '/' : '');
  }

  var base = '/';
  var dest = null;
  try {
    base = basePath();
    dest = destination(base);
  } catch (e) {
    dest = base + 'en/';
  }
  if (!dest) return;

  /* 출처는 location 에서 직접 붙인다 — dest 가 무엇이든 같은 호스트의 경로로만 해석된다 */
  var url = location.protocol + '//' + location.host + '/' + String(dest).replace(/^\/+/, '');
  location.replace(url);
})();
