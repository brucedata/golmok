/* Golmok — 라우터 + 공용 헬퍼.
   뷰 렌더러는 views-*.js가 전역 function으로 노출한다:
     homeHTML() / districtHTML(d), spotHTML(d,s) / companionsHTML(), companionHTML(c), companionNewHTML()
     / savedHTML() / partnerHTML()
   로컬 저장소(전역 function, 이 기기에만 저장 — 전송 없음):
     companion-store.js : golmokAllCompanions() · golmokSaveMyPlan(input) · golmokDeleteMyPlan(id)
                          · golmokJoinedIds() · golmokToggleJoin(id)
     saved-store.js     : golmokSavedKeys() · golmokIsSaved(key) · golmokToggleSave(key)
   이 파일은 그 함수들을 호출만 한다.

   라우터가 뷰·install.js 에 주는 전역 function (주소는 반드시 이것으로 만든다):
     golmokHref(routePath, lang?)            현재 모드에 맞는 href
     golmokNav(routePath, opts?)             이동 + render  (opts.replace · opts.lang)
     golmokCurrentPath()                     현재 routePath
     golmokCanonicalUrl(routePath, lang)     절대 URL (공유·canonical)
     golmokRouterMode()                      'path' | 'hash'
   routePath = '' · 'd/{id}' · 's/{d}/{s}' · 'companions' · 'companions/new' · 'c/{id}' · 'saved' · 'partner'
   (언어 없음, 앞뒤 슬래시 없음) */

/* ---------- 상태 ---------- */
/* confirmDelete: 지금 '한 번 더 누르면 삭제' 상태인 내 계획 id (없으면 null) */
var state = {
  lang: 'en', filter: 'all', cfilter: 'all', q: '',
  formErrors: null, formDraft: null, confirmDelete: null
};
try {
  var savedLang = localStorage.getItem('golmok-lang');
  if (savedLang && LANGS.some(function (l) { return l.code === savedLang; })) state.lang = savedLang;
} catch (e) {}

/* ---------- app.js 가 함께 들고 있는 UI 문구 ----------
   UI 에 같은 키가 없을 때만 채우고 기존 키는 덮어쓰지 않는다 — i18n.js 에 같은 키가 있으면 그쪽이 이긴다.
   두 키가 i18n.js 로 옮겨지면 이 블록은 지워도 된다. */
var APP_UI = {
  /* 삭제 2단계 확인: 두 번째 누름을 기다리는 버튼 라벨.
     옆에 붙는 설명문은 기존 cnew_delete_confirm 을 그대로 쓴다. */
  cnew_delete_again: {
    en: 'Tap again to delete',
    ja: 'もう一度押すと削除',
    zh: '再点一次即可删除',
    ko: '한 번 더 누르면 삭제' },
  /* 클립보드가 막혔을 때 링크를 화면에 그대로 보여 준다 */
  share_manual_k: {
    en: 'Couldn’t copy automatically. Copy this link:',
    ja: '自動でコピーできませんでした。このリンクをコピーしてください。',
    zh: '无法自动复制，请手动复制这个链接：',
    ko: '자동으로 복사하지 못했어요. 이 링크를 복사해 주세요.' }
};
for (var appUiKey in APP_UI) {
  if (Object.prototype.hasOwnProperty.call(APP_UI, appUiKey) && !UI[appUiKey]) UI[appUiKey] = APP_UI[appUiKey];
}

/* ---------- 공용 헬퍼 (뷰가 런타임에 호출) ---------- */
function t(obj) {
  if (!obj) return '';
  var v = obj[state.lang];
  return (v === undefined || v === null) ? (obj.en || '') : v;
}

function esc(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

var CODES = {
  seongsu: 'SS', gwangjang: 'GJ', euljiro: 'EJ',
  mangwon: 'MW', gangneung: 'GN', gongju: 'JC'
};

/* 분석 스텁 — 실계측 전환 시 여기서 엔드포인트로 전송만 추가하면 된다.
   사용자가 쓴 문구(계획 제목·설명·이름)는 props 에 절대 넣지 않는다. */
function track(event, props) {
  var rec = { e: event, p: props || {}, at: new Date().toISOString(), lang: state.lang };
  try {
    var buf = JSON.parse(localStorage.getItem('golmok-events') || '[]');
    buf.push(rec);
    while (buf.length > 200) buf.shift();
    localStorage.setItem('golmok-events', JSON.stringify(buf));
  } catch (e) {}
}

function naverMapUrl(spot, district) {
  return 'https://map.naver.com/p/search/' + encodeURIComponent(spot.ko + ' ' + district.mapArea);
}
function googleMapUrl(spot, district) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(spot.ko + ' ' + district.mapArea);
}

function badgeHTML(id) {
  var b = BADGES[id];
  if (!b) return '';
  return '<span class="badge' + (b.warn ? ' warn' : '') + '">' + esc(t(b.label)) + '</span>';
}

/* 동행 제목: 샘플은 {en,ja,zh,ko} 객체, 내 계획은 사용자가 쓴 문자열.
   t(문자열)은 '' 를 돌려주므로 그대로 쓰면 문서 제목·공유 제목이 비어 버린다.
   반환값은 이스케이프 전 텍스트 — HTML 에 넣을 때는 반드시 esc(). */
function compTitle(c) {
  return (c && typeof c.title === 'string') ? c.title : t(c && c.title);
}

/* ---------- 가게 이름 (언어별) ----------
   data.js 의 s.name 은 로마자 한 줄뿐이라, 그대로 제목에 쓰면 ja/zh/ko 페이지 제목이 영어가 된다
   ('Mangwon Market', 'Pulkkot Literature Museum' — Market·Museum 은 번역해야 할 일반명사다).
   규칙: ko = s.ko(한글 상호, 지도 검색어와 같다) · ja/zh = 현지 표기 · en = s.name.
   우선순위 — data.js 가 s.name 을 {en,ja,zh,ko} 객체로 바꾸거나 s.name_local{ja,zh} 를 두면 그쪽이 이긴다.
   아래 표는 data.js 에 현지 표기가 없을 때 쓰는 ja/zh 표기다(data.js 의 코스·팁 문구가 이미 쓰는 표기에 맞췄다).
   data.js 가 현지 표기를 갖게 되면 지워도 된다. 키 = '상권id/가게id'(URL 의 일부라 바뀌지 않는다).
   고유명 로마자(Onion·Q’s 등)는 그대로 두고, 일반명사만 그 언어로 쓴다. */
var APP_SPOT_NAMES = {
  'seongsu/onion':            { ja: 'オニオン聖水',             zh: 'Onion 圣水店' },
  'seongsu/daelim':           { ja: '大林倉庫',                 zh: '大林仓库' },
  'seongsu/gamjatang':        { ja: 'ソムンナン・カムジャタン', zh: 'Somunnan 猪骨土豆汤' },
  'seongsu/pov':              { ja: 'ポイントオブビュー',       zh: 'Point of View 文具店' },
  'seongsu/lcdc':             { ja: 'LCDC ソウル',              zh: 'LCDC 首尔' },
  'seongsu/ttukdo':           { ja: 'トゥクト市場',             zh: '纛岛市场' },
  'gwangjang/sunhui':         { ja: 'スニネ・ピンデトク',       zh: '顺姬家绿豆煎饼' },
  'gwangjang/mayak':          { ja: 'モニョキンパ',             zh: '母女紫菜包饭' },
  'gwangjang/jamae':          { ja: 'ユッケ・チャメチプ',       zh: '生拌牛肉姐妹家' },
  'gwangjang/kalguksu':       { ja: 'コヒャン・カルグクス',     zh: '故乡刀切面' },
  'gwangjang/sikhye':         { ja: 'シッケ・スジョングァの屋台', zh: '甜米露·肉桂水小摊' },
  'gwangjang/vintage':        { ja: '広蔵市場 古着フロア',      zh: '广藏市场古着楼层' },
  'euljiro/nogari':           { ja: '乙支路ノガリ横丁',         zh: '乙支路明太鱼干巷' },
  'euljiro/manseon':          { ja: 'マンソン・ホフ',           zh: 'Manseon 啤酒馆' },
  'euljiro/hanyakbang':       { ja: 'コーヒー韓薬房',           zh: '咖啡韩药房' },
  'euljiro/dabang':           { ja: '乙支茶房',                 zh: '乙支茶房' },
  'euljiro/golbaengi':        { ja: '乙支路つぶ貝横丁',         zh: '乙支路海螺巷' },
  'mangwon/market':           { ja: '望遠市場',                 zh: '望远市场' },
  'mangwon/gohyangjip':       { ja: 'コヒャンジプ',             zh: 'Gohyangjip 面馆' },
  'mangwon/qsdakgangjeong':   { ja: 'キューズ・タッカンジョン', zh: 'Q’s 甜脆炸鸡' },
  'mangwon/uglybakery':       { ja: 'アグリーベーカリー',       zh: 'Ugly Bakery 面包店' },
  'mangwon/battleship':       { ja: 'ソウル艦公園',             zh: '首尔舰公园' },
  'mangwon/hangang':          { ja: '望遠漢江公園',             zh: '望远汉江公园' },
  'gangneung/bongbong':       { ja: 'ボンボン・パンアッカン',   zh: 'Bongbong Bangagan 咖啡馆' },
  'gangneung/sarangchae':     { ja: '明珠サランチェ',           zh: '明珠舍廊斋' },
  'gangneung/gwana':          { ja: '江陵大都護府官衙',         zh: '江陵大都护府官衙' },
  'gangneung/beoljip':        { ja: 'ボルチプ',                 zh: 'Beoljip 酱刀切面' },
  'gangneung/jungangmarket':  { ja: '江陵中央市場',             zh: '江陵中央市场' },
  'gangneung/imdangchurch':   { ja: '林堂洞聖堂',               zh: '林堂洞天主教堂' },
  'gongju/lucia':             { ja: 'ルチアの庭',               zh: '露西亚的庭院' },
  'gongju/village':           { ja: 'ポンファンジェ韓屋',       zh: 'Bonghwangjae 韩屋' },
  'gongju/gogane':            { ja: 'コガネカルグクス',         zh: '高家刀切面' },
  'gongju/pulkkot':           { ja: 'ナ・テジュ草花文学館',     zh: '罗泰柱草花文学馆' },
  'gongju/hoseo':             { ja: '1967 湖西劇場',            zh: '1967 湖西剧场' },
  'gongju/sanseong':          { ja: '公州山城市場',             zh: '公州山城市场' }
};

/* 가게가 속한 상권(d 를 안 넘긴 호출용) */
function spotDistrict(s) {
  if (!s || typeof DISTRICTS === 'undefined') return null;
  return DISTRICTS.filter(function (d) { return d && d.spots && d.spots.indexOf(s) !== -1; })[0] || null;
}

/* 가게 이름을 그 언어로. 뷰도 쓸 수 있는 전역 function — golmokSpotName(s, d?, lang?).
   lang 기본값 state.lang. 반환값은 이스케이프 전 텍스트 — HTML 에 넣을 때는 반드시 esc(). */
function golmokSpotName(s, d, lang) {
  if (!s) return '';
  var L = pickLang(lang);
  var n = s.name;
  var str = function (v) { return (typeof v === 'string' && v.trim()) ? v : ''; };
  if (n && typeof n === 'object' && str(n[L])) return n[L];
  if (s.name_local && str(s.name_local[L])) return s.name_local[L];
  var en = str(n) || (n && typeof n === 'object' ? str(n.en) : '') || str(s.ko);
  if (L === 'ko') return str(s.ko) || en;
  if (L === 'ja' || L === 'zh') {
    var dd = d || spotDistrict(s);
    var row = dd ? APP_SPOT_NAMES[dd.id + '/' + s.id] : null;
    if (row && str(row[L])) return row[L];
    /* 표에 없는 새 가게: 로마자 + 한글 원명(지도 검색어) — 영어 일반명사만 남는 것보다 낫다 */
    return (str(s.ko) && str(s.ko) !== en) ? en + '（' + s.ko + '）' : en;
  }
  return en;
}

/* ---------- 문서 제목 ----------
   build.mjs 는 미리렌더한 뒤 document.title 을 그대로 <title>·og:title·twitter:title 에 쓴다.
   여기서 정한 제목이 곧 검색 결과·공유 카드 제목이므로, 언어마다 그 언어로 쓴다.
   (i18n.js 의 UI 가 아니라 여기 두는 이유: 스모크가 소스의 UI.키 를 i18n.js 원본과 대조한다.
    이 표가 i18n.js 로 옮겨지면 지우고 t(UI.…) 로 바꾸면 된다.) */
var APP_TITLES = {
  /* 언어별 홈 = 가장 중요한 랜딩. 'Golmok' 한 단어로는 검색·공유 카드에서 무슨 사이트인지 모른다.
     앞의 슬로건은 브랜드 카피라 그대로 두고, 뒤쪽에서 실제 범위(서울 4곳 + 강릉 명주동 + 공주 제민천)를 밝힌다. */
  home: {
    en: 'Golmok — Go where Seoul actually goes | Alley guides: Seoul & beyond',
    ja: 'Golmok — ソウルの人が本当に行く街へ｜ソウルから江陵・公州までの路地ガイド',
    zh: 'Golmok — 去首尔人真正去的街｜从首尔到江陵、公州的街巷指南',
    ko: 'Golmok — 서울이 진짜 가는 골목으로 | 서울부터 강릉·공주까지 골목 가이드' },
  /* 상권: 이름만 두면 'Seongsu — Golmok' 처럼 맥락이 없다 → '가이드' + 상권 태그를 붙인다 */
  district: {
    en: '{name} guide: {tags}',
    ja: '{name}ガイド｜{tags}',
    zh: '{name}指南｜{tags}',
    ko: '{name} 가이드 · {tags}' },
  tag_sep: { en: ', ', ja: '・', zh: '、', ko: '·' }
};
var TITLE_BRAND = ' — Golmok';

function districtDocTitle(d) {
  var name = t(d && d.name);
  var tags = t(d && d.tags);
  if (!Array.isArray(tags) || !tags.length) return name + TITLE_BRAND;
  var list = tags.join(t(APP_TITLES.tag_sep));
  return String(t(APP_TITLES.district)).replace(/\{(name|tags)\}/g, function (m, k) {
    return k === 'name' ? name : list;
  }) + TITLE_BRAND;
}

/* 화면(view 객체) → 문서 제목. render() 와 공유 버튼이 같이 쓴다. */
function docTitleFor(r) {
  if (!r) return t(APP_TITLES.home);
  if (r.view === 'spot') return golmokSpotName(r.s, r.d) + TITLE_BRAND;
  if (r.view === 'district') return districtDocTitle(r.d);
  /* 샘플 동행(가상 인물)은 제목에도 샘플 표시 — 미리렌더·공유 카드(build.mjs)와 같은 '[SAMPLE] …' 형식 */
  if (r.view === 'companion') {
    var sampleTag = (r.c && !/^my-/.test(r.c.id)) ? '[' + t(UI.sample) + '] ' : '';
    return sampleTag + compTitle(r.c) + TITLE_BRAND;
  }
  if (r.view === 'companion_new') return t(UI.cnew_new_t) + TITLE_BRAND;
  if (r.view === 'companions') return t(UI.comp_title) + TITLE_BRAND;
  if (r.view === 'saved') return t(UI.saved_title) + TITLE_BRAND;
  if (r.view === 'partner') return '사장님 파트너' + TITLE_BRAND;   /* 파트너 페이지는 한국어 단일 */
  return t(APP_TITLES.home);
}

var toastTimer = null;
function toast(msg) {
  var el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    /* 스크린리더에도 결과(저장·취소·실패)를 알린다 */
    if (el.setAttribute) { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); }
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2200);
}

/* ==========================================================================
   라우터 — 두 모드
   - path 모드(기본): http/https 이고 window.GOLMOK_ROUTER !== 'hash'.
       주소 = base + 언어 + '/' + routePath + (routePath ? '/' : '')    예) /golmok/en/s/seongsu/onion/
       base = <base href> 의 경로(빌드가 "/golmok/" 로 바꿔 쓴다). 언어는 URL 이 원본이다.
   - hash 모드: file: 이거나 window.GOLMOK_ROUTER === 'hash'(공유 데모 번들).
       주소 = '#/' + routePath. 언어는 state.lang / localStorage.
   about: · blob: · data: 같은 나머지 프로토콜도 path 주소를 쓸 수 없으니 hash 로 돈다.
   ========================================================================== */
var ROUTER_MODE = (function () {
  if (typeof window !== 'undefined' && window.GOLMOK_ROUTER === 'hash') return 'hash';
  var proto = '';
  try { proto = String(location.protocol || ''); } catch (e) {}
  return /^https?:$/i.test(proto) ? 'path' : 'hash';
})();

/* 'https://host/a/b?x#y' → '/a/b'. URL 생성자 없이(오래된 브라우저·스모크 VM 에서도) 동작한다. */
function urlPathOf(u) {
  var m = /^[a-z][a-z0-9+.\-]*:\/\/[^\/?#]*([^?#]*)/i.exec(String(u || ''));
  return m ? (m[1] || '/') : null;
}

/* path 모드의 base. 항상 '/' 로 시작하고 '/' 로 끝난다. 'index.html' 같은 파일 이름은 뗀다. */
var ROUTER_BASE = (function () {
  if (ROUTER_MODE !== 'path') return '/';
  var p = null;
  try { p = urlPathOf(document.baseURI); } catch (e) {}
  if (!p || p.charAt(0) !== '/') return '/';
  return p.replace(/[^\/]*$/, '');
})();

function golmokRouterMode() { return ROUTER_MODE; }

function isLangCode(code) {
  return typeof code === 'string' && LANGS.some(function (l) { return l.code === code; });
}
function pickLang(lang) {
  var l = String(lang || '').toLowerCase();
  if (isLangCode(l)) return l;
  return isLangCode(state.lang) ? state.lang : 'en';
}
function setLang(code) {
  if (!isLangCode(code)) return;
  state.lang = code;
  try { localStorage.setItem('golmok-lang', code); } catch (e) {}
}
/* 언어 접두사가 없는 주소(사이트 루트·매장 QR·404 셸·오프라인 셸)용.
   언어 결정 규칙(js/redirect.js pickLang 과 같다): 저장된 선호 → navigator.languages 앞에서부터 첫 일치 → navigator.language → en */
function preferredLang() {
  try {
    var saved = localStorage.getItem('golmok-lang');
    if (isLangCode(saved)) return saved;
  } catch (e) {}
  var prefs = [];
  try {
    if (navigator.languages && navigator.languages.length) prefs = Array.prototype.slice.call(navigator.languages);
    if (navigator.language) prefs.push(navigator.language);
  } catch (e) {}
  for (var i = 0; i < prefs.length; i++) {
    var code = String(prefs[i] || '').toLowerCase().split(/[-_]/)[0];
    if (isLangCode(code)) return code;
  }
  return 'en';
}

/* ---------- routePath 의 모양 ----------
   js/redirect.js 의 ROUTES 와 같은 모양만 routePath 가 된다. 모두 고정 세그먼트 + id([a-z0-9-]) 라서
   어떤 입력에서 나온 routePath 도 base 밖(같은 출처의 다른 경로)으로 풀리지 않는다. */
var ROUTE_ID = '[a-z0-9]+(?:-[a-z0-9]+)*';
var ROUTE_SHAPES = [
  /^$/,
  new RegExp('^d/' + ROUTE_ID + '$'),
  new RegExp('^s/' + ROUTE_ID + '/' + ROUTE_ID + '$'),
  /^companions$/,
  /^companions\/new$/,
  new RegExp('^c/' + ROUTE_ID + '$'),
  /^saved$/,
  /^partner$/
];
var ROUTE_MAX_SEGS = 3;
function isRoutePath(p) {
  for (var i = 0; i < ROUTE_SHAPES.length; i++) if (ROUTE_SHAPES[i].test(p)) return true;
  return false;
}

/* 점 세그먼트 — '.', '..' 와 퍼센트 인코딩한 꼴('%2e%2e', '.%2E' …). 주소에 다시 쓰면 브라우저가 상위 경로로 푼다. */
var DOT_SEGMENT = /^(?:\.|%2e)+$/i;

/* 경로 조각 → 세그먼트 배열: 쿼리·조각 제거, 빈 세그먼트·점 세그먼트 제거(글자는 아직 거르지 않는다) */
function pathSegments(p) {
  return String(p === undefined || p === null ? '' : p)
    .split(/[?#]/)[0]
    .split('/')
    .filter(function (seg) { return seg && !DOT_SEGMENT.test(seg); });
}

/* routePath 정리: 세그먼트를 소문자로 맞춘 뒤, 라우트 모양에 맞는 가장 긴 앞부분만 남긴다.
   'd/seongsu/extra/junk' → 'd/seongsu', 'S/seongsu/onion' → 's/seongsu/onion',
   '%2e%2e/%2e%2e/evil' → '' (맞는 앞부분이 없으면 홈). 결과는 언제나 ROUTE_SHAPES 중 하나다. */
function cleanRoutePath(p) {
  var segs = pathSegments(p).map(function (seg) { return seg.toLowerCase(); });
  for (var n = Math.min(segs.length, ROUTE_MAX_SEGS); n > 0; n--) {
    var cand = segs.slice(0, n).join('/');
    if (isRoutePath(cand)) return cand;
  }
  return '';
}

/* path 모드: 지금 주소를 { lang(없으면 null), path(정리한 routePath), under(base 아래인가) } 로 읽는다.
   언어 세그먼트는 대소문자를 가리지 않는다('/EN/partner'). 모르는 언어('/xx/')는 routePath 쪽으로 넘어가 홈이 된다. */
function readPathUrl() {
  var full = '/';
  try { full = String(location.pathname || '/'); } catch (e) {}
  var rest, under = true;
  if (full.indexOf(ROUTER_BASE) === 0) rest = full.slice(ROUTER_BASE.length);
  else if (full + '/' === ROUTER_BASE) rest = '';           /* '/golmok' (끝 슬래시 없음) */
  else { rest = full; under = false; }
  var segs = pathSegments(rest);
  if (segs.length && /^index\.html?$/i.test(segs[segs.length - 1])) segs.pop();
  var lang = null;
  if (segs.length && isLangCode(segs[0].toLowerCase())) lang = segs.shift().toLowerCase();
  return { lang: lang, path: cleanRoutePath(segs.join('/')), under: under };
}

function legacyHashPath() {
  var h = '';
  try { h = String(location.hash || ''); } catch (e) {}
  return h.indexOf('#/') === 0 ? cleanRoutePath(h.slice(2)) : null;
}

/* 현재 routePath. path 모드에서도 옛 '#/…' 해시가 붙어 있으면 그쪽이 이긴다(부팅·popstate 가 곧 지운다). */
function golmokCurrentPath() {
  var legacy = legacyHashPath();
  if (legacy !== null) return legacy;
  if (ROUTER_MODE === 'hash') return '';
  return readPathUrl().path;
}

function golmokHref(routePath, lang) {
  var rp = cleanRoutePath(routePath);
  if (ROUTER_MODE === 'hash') return '#/' + rp;
  return ROUTER_BASE + pickLang(lang) + '/' + rp + (rp ? '/' : '');
}

/* 공유·canonical 용 절대 URL.
   GOLMOK_SITE_URL 이 있으면 공개 사이트(path 형식) 기준 — 공유 데모(hash 모드)에서 눌러도 실제 사이트 주소가 나간다.
   없으면 path 모드는 location.origin + base, hash 모드는 지금 문서 주소 + '#/…'(그 모드에서 열리는 유일한 형태). */
function golmokCanonicalUrl(routePath, lang) {
  var rp = cleanRoutePath(routePath);
  var tail = pickLang(lang) + '/' + rp + (rp ? '/' : '');
  var site = (typeof window !== 'undefined') ? window.GOLMOK_SITE_URL : null;
  if (typeof site === 'string' && /^https?:\/\/[^\/]/i.test(site)) return site.replace(/\/*$/, '/') + tail;
  if (ROUTER_MODE === 'path') {
    var origin = '';
    try { origin = location.origin || (location.protocol + '//' + location.host); } catch (e) {}
    return origin + ROUTER_BASE + tail;
  }
  var here = '';
  try { here = String(location.href || '').split('#')[0]; } catch (e) {}
  return here + '#/' + rp;
}

/* 지금 보이는 화면의 정식 routePath(뒤에 붙은 군더더기·없는 id 는 떨어진다) */
function viewRoutePath(r) {
  if (!r) return '';
  if (r.view === 'spot') return 's/' + r.d.id + '/' + r.s.id;
  if (r.view === 'district') return 'd/' + r.d.id;
  if (r.view === 'companion') return 'c/' + r.c.id;
  if (r.view === 'companion_new') return 'companions/new';
  if (r.view === 'companions') return 'companions';
  if (r.view === 'saved') return 'saved';
  if (r.view === 'partner') return 'partner';
  return '';
}

/* ---------- path 모드 history: 스크롤 위치 기억 ----------
   뒤로/앞으로 가기에서 목록의 읽던 자리로 돌아온다. 항목마다 키(gk)를 달고
   위치는 메모리(navY)에, 새로고침 대비로 떠날 때만 history.state(gy)에도 적는다. */
var navKey = null;
var navY = {};
function newNavKey() { return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function histState() {
  try { var s = history.state; return (s && typeof s === 'object') ? s : null; } catch (e) { return null; }
}
function withState(extra) {
  var out = {}, s = histState(), k;
  if (s) for (k in s) if (Object.prototype.hasOwnProperty.call(s, k)) out[k] = s[k];
  for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k];
  return out;
}
function scrollYNow() { return window.scrollY || window.pageYOffset || 0; }
function rememberScroll() {
  if (ROUTER_MODE !== 'path') return;
  var y = scrollYNow();
  if (navKey) navY[navKey] = y;
  try { history.replaceState(withState({ gk: navKey, gy: y }), '', location.href); } catch (e) {}
}
function savedScrollFor(key) {
  if (key && Object.prototype.hasOwnProperty.call(navY, key)) return navY[key];
  var s = histState();
  return (s && typeof s.gy === 'number' && s.gk === key) ? s.gy : 0;
}

/* path 모드: 주소를 정식 형태로 바꿔 쓴다(replaceState — 기록 안 남김).
   옛 '#/…' 해시는 지우고, 쿼리(?utm=…)와 페이지 내 앵커(#foo)는 그대로 둔다. */
function normalizeLocation(path, lang) {
  var h = '', search = '', now = '';
  try {
    h = String(location.hash || '');
    search = String(location.search || '');
    now = String(location.pathname || '') + search + h;
  } catch (e) { return; }
  var keepHash = (h && h.indexOf('#/') !== 0) ? h : '';
  var target = golmokHref(path, lang) + search + keepHash;
  var st = withState({ gk: navKey });
  try {
    if (target !== now) history.replaceState(st, '', target);
    else if (!histState() || histState().gk !== navKey) history.replaceState(st, '', location.href);
  } catch (e) {}
}

/* 화면을 옮길 때마다 똑같이 푸는 상태 — golmokNav · popstate · hashchange 공통 */
function resetRouteState() {
  state.filter = 'all';
  state.cfilter = 'all';
  state.formErrors = null;
  state.formDraft = null;
  state.confirmDelete = null;   /* 화면을 떠나면 삭제 확인도 풀린다 */
}

/* 새 화면 진입 공통 마무리: 상태 초기화 → 그리기 → 스크롤 → 제목으로 포커스(스크린리더가 새 화면을 읽는다) */
function enterRoute(y) {
  resetRouteState();
  render();
  scrollTo(0, y || 0);
  focusMainHeading();
}
function focusMainHeading() {
  var h = document.querySelector ? document.querySelector('#app h1') : null;
  if (!h || !h.setAttribute) return;
  if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  focusQuiet(h);
}

/* 이동. opts.replace = 기록을 남기지 않음, opts.lang = 그 언어로 바꿔서.
   같은 routePath 로 언어만 바꾸는 경우는 '같은 화면 다시 그리기' — 폼 초안·필터·스크롤을 지킨다.
   주소는 도착할 화면의 정식 routePath 로 쓴다(없는 id·이 기기에 없는 내 계획은 홈 주소). */
function golmokNav(routePath, opts) {
  opts = opts || {};
  var rp = viewRoutePath(parseRoute(cleanRoutePath(routePath)));
  var from = viewRoutePath(parseRoute());
  var toLang = opts.lang ? String(opts.lang).toLowerCase() : null;
  var langOnly = !!toLang && isLangCode(toLang) && rp === from;
  if (toLang && isLangCode(toLang)) setLang(toLang);

  if (ROUTER_MODE === 'path') {
    var href = golmokHref(rp);
    var here = '';
    try { here = String(location.pathname || '') + String(location.search || '') + String(location.hash || ''); } catch (e) {}
    var replace = !!opts.replace || href === here;   /* 같은 주소를 또 쌓지 않는다 */
    try {
      if (replace) {
        history.replaceState(withState({ gk: navKey }), '', href);
      } else {
        rememberScroll();
        navKey = newNavKey();
        history.pushState({ gk: navKey }, '', href);
      }
    } catch (e) {
      /* history 를 못 쓰는 환경 — 정적 페이지(미리렌더·404 셸)로 그냥 이동한다 */
      try { location.assign(href); } catch (err) { location.href = href; }
      return;
    }
  } else {
    var h = '#/' + rp;
    if (String(location.hash || '') !== h) {
      if (opts.replace) {
        try { history.replaceState(histState(), '', String(location.href || '').split('#')[0] + h); }
        catch (e) { location.hash = h; }
      } else {
        location.hash = h;   /* 뒤따르는 hashchange 는 '이미 그린 경로'라 건너뛴다 */
      }
    }
  }

  if (langOnly) { render(); return; }
  enterRoute(0);
}

function langSwitcherHTML() {
  return '<div class="langs" role="group" aria-label="Language">' + LANGS.map(function (l) {
    return '<button type="button" data-lang="' + esc(l.code) + '" aria-pressed="' + (state.lang === l.code) + '">' +
      '<span class="full">' + esc(l.label) + '</span><span class="abbr">' + esc(l.abbr) + '</span></button>';
  }).join('') + '</div>';
}

/* 헤더 저장 링크 — 모든 폭에서 보인다(.nav-link 는 600px 이하에서 숨김).
   aria-label 이 링크 내용을 대신하므로 개수 배지는 aria-hidden, 개수는 라벨에 넣는다. */
function savedNavHTML() {
  var n = (typeof golmokSavedKeys === 'function') ? golmokSavedKeys().length : 0;
  var here = parseRoute().view === 'saved';
  var label = n ? String(t(UI.saved_nav_n)).replace('{n}', String(n)) : t(UI.saved_nav);
  return '<a class="nav-saved" href="' + esc(golmokHref('saved')) + '" aria-label="' + esc(label) + '"' +
      (here ? ' aria-current="page"' : '') + '>' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M12 20.3s-7.6-4.6-9.4-9.6C1.5 7.4 3.5 4 7 4c2.1 0 3.8 1.1 5 2.9C13.2 5.1 14.9 4 17 4c3.5 0 5.5 3.4 4.4 6.7-1.8 5-9.4 9.6-9.4 9.6z"></path></svg>' +
    (n ? '<span class="nav-count num" aria-hidden="true">' + (n > 99 ? '99+' : n) + '</span>' : '') +
  '</a>';
}

/* '가이드' 링크: 홈에서는 data-scroll 로 상권 목록까지 스크롤, 다른 화면에서는 홈으로 가서 상권 목록으로. */
function headerHTML() {
  return '<header><div class="wrap bar">' +
    '<a class="brand" href="' + esc(golmokHref('')) + '">Golmok<i>.</i></a>' +
    '<div class="nav-right">' +
      '<a class="nav-link" href="' + esc(golmokHref('')) + '" data-scroll="districts">' + esc(t(UI.nav_guide)) + '</a>' +
      '<a class="nav-link" href="' + esc(golmokHref('companions')) + '">' + esc(t(UI.nav_companions)) + '</a>' +
      '<a class="nav-link" href="' + esc(golmokHref('partner')) + '">' + esc(t(UI.nav_partner)) + '</a>' +
      savedNavHTML() +
      langSwitcherHTML() +
    '</div>' +
  '</div></header>';
}

function footerHTML() {
  return '<footer><div class="wrap row">' +
    '<span>Golmok 골목 · <a href="' + esc(golmokHref('companions')) + '">' + esc(t(UI.nav_companions)) + '</a>' +
    ' · <a href="' + esc(golmokHref('saved')) + '">' + esc(t(UI.saved_nav)) + '</a>' +
    ' · <a href="' + esc(golmokHref('partner')) + '">' + esc(t(UI.nav_partner)) + '</a> · datamingo</span>' +
    '<span>' + esc(t(UI.footer_note)) + '</span>' +
  '</div></footer>';
}

/* ---------- 홈 검색 (뷰가 심어둔 data-hay를 필터) ---------- */
function applySearch() {
  var q = (state.q || '').trim().toLowerCase();
  var cards = document.querySelectorAll('.dcard[data-hay]');
  var shown = 0;
  Array.prototype.forEach.call(cards, function (c) {
    var hit = !q || (c.getAttribute('data-hay') || '').indexOf(q) !== -1;
    c.hidden = !hit;
    if (hit) shown++;
  });
  var empty = document.getElementById('no-match');
  if (empty) empty.hidden = shown > 0;
}

/* ---------- 공유 ----------
   prompt() 은 공유 데모(dist/artifact.html)가 도는 샌드박스 iframe 에서 무시된다 —
   클립보드까지 막히면 공유가 아무 말 없이 실패한다. 그래서 링크를 화면 안에 보여 준다. */
var LINK_BOX_ID = 'share-link-box';

function hideLinkFallback() {
  var old = document.getElementById(LINK_BOX_ID);
  if (old && old.parentNode) old.parentNode.removeChild(old);
}

/* 히어로는 고채도 색면이라 본문용 색이 안 맞는다 — 히어로 '아래' 본문 배경에 붙인다.
   #app 안이라 다음 render() 때 같이 사라진다. */
function showLinkFallback(url) {
  hideLinkFallback();
  if (!document.createElement) { toast(url); return; }

  var btn = document.querySelector('[data-share]');
  var anchor = btn ? (btn.closest('.s-hero') || btn) : null;
  var host = (anchor && anchor.parentNode) ? anchor.parentNode : document.getElementById('app');
  if (!host) { toast(url); return; }

  var box = document.createElement('div');
  if (!box.setAttribute) { toast(url); return; }
  box.id = LINK_BOX_ID;
  box.className = 'c-join-note';
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');

  var lab = document.createElement('label');
  lab.setAttribute('for', LINK_BOX_ID + '-url');
  lab.textContent = t(UI.share_manual_k) + ' ';

  var inp = document.createElement('input');
  inp.type = 'text';
  inp.id = LINK_BOX_ID + '-url';
  inp.readOnly = true;
  inp.value = url;
  inp.setAttribute('spellcheck', 'false');
  inp.setAttribute('autocomplete', 'off');

  box.appendChild(lab);
  box.appendChild(inp);
  if (anchor && anchor.parentNode) host.insertBefore(box, anchor.nextSibling);
  else host.appendChild(box);

  /* 포커스까지 옮겨야 스크린리더가 라벨과 주소를 읽고, 길게 눌러 복사하기도 쉽다 */
  try { inp.focus(); inp.select(); } catch (err) {}
}

/* location.href 가 아니라 정식 주소를 공유한다 — 해시·쿼리(utm 등)가 섞이지 않고, 언어도 주소에 박힌다. */
function shareCurrent(title) {
  var path = viewRoutePath(parseRoute());
  var url = golmokCanonicalUrl(path, state.lang);
  hideLinkFallback();
  track('share', { at: path });
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(function (e) {
      if (e && e.name === 'AbortError') return;
      copyLink(url);
    });
    return;
  }
  copyLink(url);
}
function copyLink(url) {
  var p = null;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { p = navigator.clipboard.writeText(url); } catch (err) { p = null; }
  }
  if (p && p.then) {
    p.then(function () { hideLinkFallback(); toast(t(UI.copied)); }, function () { showLinkFallback(url); });
    return;
  }
  showLinkFallback(url);
}

/* ---------- 새 계획 폼 값 수집 (제출·언어 전환 공용) ---------- */
function collectCompNew(form) {
  var fd = new FormData(form);
  function one(k) { var v = fd.get(k); return typeof v === 'string' ? v : ''; }
  return {
    district: one('district'), date: one('date'), time: one('time'),
    title: one('title'), plan: one('plan'),
    styles: fd.getAll('styles'), langs: fd.getAll('langs'),
    seats: one('seats'), budget: one('budget'), name: one('name'),
    safety: one('safety')   /* 체크 안 하면 '', 체크하면 '1' */
  };
}
/* 새 계획 화면에서 언어가 바뀌기 직전: 쓰던 입력을 초안으로 들고 간다 */
function keepCompNewDraft() {
  if (parseRoute().view !== 'companion_new') return;
  var cfm = document.getElementById('comp-new-form');
  if (cfm) state.formDraft = collectCompNew(cfm);
}

/* render() 가 DOM 을 통째로 바꾼 뒤 키보드 포커스를 되돌린다(스크롤은 건드리지 않음). */
function focusQuiet(el) {
  if (!el) return;
  try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
}
function attrSel(v) {
  return (window.CSS && CSS.escape) ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&');
}

/* ---------- 내 계획 삭제: 페이지 안에서 두 번 눌러 확인 ----------
   confirm() 은 공유 데모가 도는 샌드박스 iframe 에서 무시되고 false 를 돌려준다.
   그러면 삭제 버튼이 아무 반응도 없고, 계획이 10개(cnew_err_limit) 차면 새로 만들 수도 없다.
   그래서 첫 번째 누름은 버튼을 '한 번 더 누르면 삭제'로 바꾸고, 두 번째 누름에 지운다. */
var DELETE_NOTE_ID = 'c-delete-note';

/* 뷰가 넣어 둔 휴지통 SVG 는 두고 글자만 바꾼다(라벨은 HTML 이 아니라 텍스트 노드) */
function setDeleteLabel(btn, text) {
  var last = btn.lastChild;
  if (last && last.nodeType === 3) last.nodeValue = text;
  else if (btn.appendChild && document.createTextNode) btn.appendChild(document.createTextNode(text));
}

function armDeleteButton(btn) {
  setDeleteLabel(btn, t(UI.cnew_delete_again));
  if (btn.setAttribute) btn.setAttribute('aria-describedby', DELETE_NOTE_ID);
  var note = document.getElementById(DELETE_NOTE_ID);
  if (!note) {
    note = document.createElement('span');
    if (!note.setAttribute) return;
    note.id = DELETE_NOTE_ID;
    note.className = 'c-join-note';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    if (btn.parentNode) btn.parentNode.insertBefore(note, btn.nextSibling);
  }
  note.textContent = t(UI.cnew_delete_confirm);
}

/* 확인 상태를 풀고 버튼·안내문을 원래대로 되돌린다 */
function clearDeleteArm() {
  state.confirmDelete = null;
  var note = document.getElementById(DELETE_NOTE_ID);
  if (note && note.parentNode) note.parentNode.removeChild(note);
  var btns = document.querySelectorAll('[data-delete-plan]');
  Array.prototype.forEach.call(btns, function (b) {
    if (b.getAttribute && b.getAttribute('aria-describedby') === DELETE_NOTE_ID) b.removeAttribute('aria-describedby');
    setDeleteLabel(b, t(UI.cnew_delete));
  });
}

/* render() 가 DOM 을 갈아치우면 버튼은 '계획 삭제'로 돌아가는데 state 만 남는다.
   그대로 두면 다음 한 번의 탭이 경고 없이 삭제해 버리므로 매 렌더마다 맞춰 준다. */
function syncDeleteArm() {
  if (!state.confirmDelete) return;
  var btn = document.querySelector('[data-delete-plan="' + attrSel(state.confirmDelete) + '"]');
  if (!btn) { state.confirmDelete = null; return; }   /* 다른 화면으로 갔다 — 확인 상태도 버린다 */
  armDeleteButton(btn);
}

/* ---------- 라우팅 ----------
   view 객체는 모드와 무관하다. routePath 를 옛 해시 문자열로 바꿔 예전 규칙 그대로 맞춘다.
   routePath 를 넘기면 그 경로를, 안 넘기면 지금 주소를 해석한다(주소는 건드리지 않는다). */
function parseRoute(routePath) {
  var h = '#/' + (typeof routePath === 'string' ? cleanRoutePath(routePath) : golmokCurrentPath());
  var m;
  if ((m = h.match(/^#\/s\/([a-z0-9-]+)\/([a-z0-9-]+)/i))) {
    var ds = DISTRICTS.find(function (x) { return x.id === m[1]; });
    var sp = ds && ds.spots.find(function (x) { return x.id === m[2]; });
    if (ds && sp) return { view: 'spot', d: ds, s: sp };
  }
  if ((m = h.match(/^#\/d\/([a-z0-9-]+)/i))) {
    var d = DISTRICTS.find(function (x) { return x.id === m[1]; });
    if (d) return { view: 'district', d: d };
  }
  /* 샘플 + 이 기기에 저장한 내 계획('my-…'). 지워진 id 는 아래로 흘러 홈으로 간다. */
  if ((m = h.match(/^#\/c\/([a-z0-9-]+)/i))) {
    var all = (typeof golmokAllCompanions === 'function') ? golmokAllCompanions() : [];
    var c = all.filter(function (x) { return x && x.id === m[1]; })[0];
    if (c) return { view: 'companion', c: c };
  }
  /* '#/companions/new' 는 '#/companions' 접두사 검사보다 먼저 */
  if (/^#\/companions\/new(?:[\/?]|$)/.test(h)) return { view: 'companion_new' };
  if (h.indexOf('#/companions') === 0) return { view: 'companions' };
  if (h.indexOf('#/partner') === 0) return { view: 'partner' };
  if (h.indexOf('#/saved') === 0) return { view: 'saved' };
  return { view: 'home' };
}

/* path 모드: <head> 의 정식 주소들을 지금 화면에 맞춘다(빌드가 넣어 둔 태그가 있을 때만 — 새로 만들지 않는다).
   hreflang 은 'zh-Hans' 같은 지역 꼬리가 붙어 있어도 앞부분으로 언어를 고른다. x-default 는 건드리지 않는다. */
function syncHeadLinks(r) {
  if (ROUTER_MODE !== 'path' || !document.querySelector) return;
  var rp = viewRoutePath(r);
  var self = golmokCanonicalUrl(rp, state.lang);
  var can = document.querySelector('link[rel="canonical"]');
  if (can && can.setAttribute) can.setAttribute('href', self);
  var og = document.querySelector('meta[property="og:url"]');
  if (og && og.setAttribute) og.setAttribute('content', self);
  var alts = document.querySelectorAll ? document.querySelectorAll('link[rel="alternate"][hreflang]') : [];
  Array.prototype.forEach.call(alts, function (a) {
    var code = String(a.getAttribute('hreflang') || '').toLowerCase().split('-')[0];
    if (isLangCode(code)) a.setAttribute('href', golmokCanonicalUrl(rp, code));
  });
}

/* 마지막으로 그린 routePath — hashchange/popstate 가 '이미 그린 화면'을 또 그리지 않게 */
var lastRenderedPath = null;

/* opts.quiet: 같은 화면을 다시 그리기만 할 때(저장·신청 토글, 폼 에러) 'view' 이벤트를 남기지 않는다 */
function render(opts) {
  var app = document.getElementById('app');
  /* path 모드에서는 URL 의 언어가 원본이다 — 화면과 주소가 다른 언어를 말하지 않게 */
  if (ROUTER_MODE === 'path') {
    var urlLang = readPathUrl().lang;
    if (urlLang && urlLang !== state.lang && legacyHashPath() === null) state.lang = urlLang;
  }
  var r = parseRoute();
  /* path 모드는 화면의 정식 routePath 를 기억한다 — syncFromLocation 이 같은 기준으로 비교한다 */
  lastRenderedPath = (ROUTER_MODE === 'path') ? viewRoutePath(r) : golmokCurrentPath();
  document.documentElement.lang = state.lang;

  var body = '';
  if (r.view === 'spot') body = spotHTML(r.d, r.s);
  else if (r.view === 'district') body = districtHTML(r.d);
  else if (r.view === 'companion') body = companionHTML(r.c);
  else if (r.view === 'companion_new') body = companionNewHTML();
  else if (r.view === 'companions') body = companionsHTML();
  else if (r.view === 'saved') body = savedHTML();
  else if (r.view === 'partner') body = partnerHTML();
  else body = homeHTML();

  document.title = docTitleFor(r);
  app.innerHTML = headerHTML() + body;
  syncHeadLinks(r);

  if (r.view === 'home' && state.q) {
    var inp = document.getElementById('dsearch');
    if (inp) inp.value = state.q;
    applySearch();
  }
  syncDeleteArm();   /* 언어 전환·조용한 재렌더 뒤에도 '한 번 더 누르면 삭제'를 유지 */
  if (!(opts && opts.quiet)) track('view', { route: lastRenderedPath });
}

/* path 모드: 주소가 그 화면의 정식 주소인가(언어 있음·소문자·끝 슬래시·군더더기 없음·옛 '#/…' 해시 없음).
   쿼리와 페이지 안 앵커(#foo)는 보지 않는다 — normalizeLocation 이 그대로 둔다. */
function isCanonicalAddress(routePath, lang) {
  if (legacyHashPath() !== null) return false;
  var now = '';
  try { now = String(location.pathname || ''); } catch (e) { return true; }
  return now === golmokHref(routePath, lang);
}

/* path 모드: 뒤로/앞으로 가기, 주소창에 친 옛 '#/…' 해시 → 주소 정리 후 필요할 때만 다시 그린다.
   주소는 그릴 화면의 정식 주소로 바꿔 쓴다 — 지운 내 계획(c/my-…)으로 돌아온 기록은 홈 주소가 된다. */
function syncFromLocation() {
  var info = readPathUrl();
  var path = viewRoutePath(parseRoute());
  var lang = info.lang || state.lang;
  var needsFix = info.under && !isCanonicalAddress(path, lang);
  var pathChanged = path !== lastRenderedPath;
  var langChanged = lang !== state.lang;
  if (!pathChanged && !langChanged && !needsFix) return;   /* 같은 화면 안의 앵커(#foo) 이동 */

  /* 키는 '도착한' 항목의 것으로 먼저 바꾼다 — 정규화가 그 키를 새 항목에 적는다 */
  if (navKey && (pathChanged || langChanged)) navY[navKey] = scrollYNow();   /* 떠나는 항목의 위치 */
  var s = histState();
  navKey = (s && s.gk) || newNavKey();
  if (needsFix) normalizeLocation(path, lang);
  else if (!(s && s.gk)) { try { history.replaceState(withState({ gk: navKey }), '', location.href); } catch (e) {} }

  if (!pathChanged && !langChanged) return;

  if (!pathChanged) {                                 /* 언어만 바뀐 기록: 같은 화면 다시 그리기 */
    keepCompNewDraft();
    setLang(lang);
    render();
    return;
  }
  setLang(lang);
  enterRoute(savedScrollFor(navKey));
}

addEventListener('popstate', function () {
  if (ROUTER_MODE === 'path') syncFromLocation();
});

addEventListener('hashchange', function () {
  var h = '';
  try { h = String(location.hash || ''); } catch (e) {}
  /* path 모드: 옛 '#/…' 해시만 주소로 바꿔 받는다. 나머지 해시는 브라우저 몫. */
  if (ROUTER_MODE === 'path') {
    if (h.indexOf('#/') === 0) syncFromLocation();
    return;
  }
  /* hash 모드 라우터는 '#/'로 시작하는 해시만 소비한다. 페이지 내 앵커(#foo)까지 여기서
     render()+scrollTo(0,0) 을 돌면 화면이 통째로 갈아치워지고 스크롤도 위로 튄다. */
  if (h && h.indexOf('#/') !== 0) return;
  if (golmokCurrentPath() === lastRenderedPath) return;   /* golmokNav 가 이미 그렸다 */
  enterRoute(0);
});

/* ---------- 링크 가로채기 ----------
   반환: { path, lang } = 라우터가 처리할 내부 링크, { anchor: id } = 페이지 내 앵커, null = 브라우저에 맡긴다.
   새 탭·다운로드·메일·전화·외부 출처(네이버·구글 지도)·base 밖·파일(og-image.png 등)은 절대 가로채지 않는다. */
/* 가운데·오른쪽 버튼이나 수정키(ctrl/cmd 새 탭 · shift 새 창 · alt 다운로드)를 쓴 클릭 — 브라우저 몫이다.
   링크 가로채기 · data-scroll 링크 · data-* 카드 폴백이 같은 판정을 쓴다. */
function browserOwnsClick(e) {
  return !!(e && (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey));
}
function isLinkEl(el) {
  return !!el && String(el.tagName || '').toUpperCase() === 'A' && !!el.hasAttribute && el.hasAttribute('href');
}

function linkRoute(a, e) {
  if (e.defaultPrevented) return null;
  if (browserOwnsClick(e)) return null;                              /* 가운데·오른쪽 버튼 · 새 탭·새 창·다운로드 */
  var tg = a.getAttribute('target');
  if (tg && tg.toLowerCase() !== '_self') return null;
  if (a.hasAttribute('download')) return null;
  if ((' ' + (a.getAttribute('rel') || '').toLowerCase() + ' ').indexOf(' external ') !== -1) return null;

  var raw = String(a.getAttribute('href') || '').trim();
  if (!raw || /^(mailto|tel|sms|javascript|data|blob):/i.test(raw)) return null;

  /* '#foo' 앵커: <base> 가 있으면 브라우저는 base 문서로 이동해 버린다 — 지금 화면 안에서 스크롤로 처리 */
  if (raw.charAt(0) === '#' && raw.indexOf('#/') !== 0) return { anchor: raw.slice(1) };

  if (ROUTER_MODE === 'hash') {
    return raw.indexOf('#/') === 0 ? { path: cleanRoutePath(raw.slice(2)), lang: null } : null;
  }

  /* path 모드: 브라우저가 <base> 로 풀어 준 절대 주소로 판단한다 */
  if (typeof a.pathname !== 'string') return null;                   /* SVG <a> 등 */
  var origin = '';
  try { origin = location.origin || (location.protocol + '//' + location.host); } catch (err) {}
  var aOrigin = a.origin || (a.protocol + '//' + a.host);
  if (!origin || aOrigin !== origin) return null;

  var p = a.pathname, rest;
  if (p.indexOf(ROUTER_BASE) === 0) rest = p.slice(ROUTER_BASE.length);
  else if (p + '/' === ROUTER_BASE) rest = '';
  else return null;

  var hash = String(a.hash || '');
  if (hash.indexOf('#/') === 0) return { path: cleanRoutePath(hash.slice(2)), lang: null };   /* 옛 해시 링크 */

  var segs = rest.split('/').filter(Boolean);
  var last = segs.length ? segs[segs.length - 1] : '';
  if (/\./.test(last) && !/^index\.html?$/i.test(last)) return null;  /* 정적 파일 */
  if (/^index\.html?$/i.test(last)) segs.pop();
  var lang = null;
  if (segs.length && isLangCode(segs[0].toLowerCase())) lang = segs.shift().toLowerCase();
  return { path: cleanRoutePath(segs.join('/')), lang: lang };
}

function scrollToId(id, smooth) {
  var target = id ? document.getElementById(id) : null;
  if (!target) return false;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: (smooth && !reduce) ? 'smooth' : 'auto', block: 'start' });
  return true;
}

/* ---------- 이벤트 위임 ---------- */
document.addEventListener('click', function (e) {
  /* 삭제 확인 중에 다른 곳을 누르면 확인이 풀린다(네이티브 confirm 의 '취소' 자리) */
  if (state.confirmDelete && !e.target.closest('[data-delete-plan]')) clearDeleteArm();

  var lang = e.target.closest('[data-lang]');
  if (lang) {
    var to = String(lang.getAttribute('data-lang') || '');
    if (!isLangCode(to)) return;
    /* 새 계획 페이지에서 쓰던 입력이 언어 전환으로 사라지지 않게 초안으로 들고 간다 */
    keepCompNewDraft();
    setLang(to);
    track('lang', { to: to });
    golmokNav(golmokCurrentPath(), { lang: to });
    /* 다시 그려진 같은 버튼으로 포커스를 돌려준다(키보드로 언어를 고른 사람이 맨 위로 튕기지 않게) */
    focusQuiet(document.querySelector('[data-lang="' + attrSel(to) + '"]'));
    return;
  }

  /* 가게 저장(하트). 카드 버튼과 형제라 [data-spot] 에 잡히지 않지만, 먼저 처리하고 끝낸다. */
  var sv = e.target.closest('[data-save]');
  if (sv) {
    e.preventDefault();
    var key = sv.getAttribute('data-save') || '';
    var kind = sv.classList.contains('save-btn') ? '.save-btn' : '.save-toggle';
    var idxInKind = Array.prototype.indexOf.call(document.querySelectorAll(kind), sv);
    var was = golmokIsSaved(key);
    var before = window.scrollY || window.pageYOffset || 0;
    var now = golmokToggleSave(key);
    if (now === was) {               /* 저장소가 막혔거나 없는 가게 — 바뀐 게 없다 */
      toast(t(UI.saved_toast_failed));
      return;
    }
    track(now ? 'save' : 'unsave', { key: key });
    toast(now ? t(UI.saved_toast_added) : t(UI.saved_toast_removed));
    render({ quiet: true });
    scrollTo(0, before);
    /* 같은 버튼 → (행이 사라졌으면) 같은 자리의 다음 하트 → 없으면 제목 */
    var back = document.querySelector(kind + '[data-save="' + attrSel(key) + '"]');
    if (!back) {
      var rest = document.querySelectorAll(kind);
      back = rest[Math.min(idxInKind, rest.length - 1)] || document.getElementById('saved-title');
    }
    focusQuiet(back);
    return;
  }

  var trk = e.target.closest('[data-track]');
  if (trk) track(trk.getAttribute('data-track'), { at: golmokCurrentPath() });

  /* 페이지 내 이동 — 링크 가로채기보다 먼저. 대상이 지금 화면에 있으면 스크롤하고,
     없으면(다른 화면의 '가이드' 링크) 아래 링크 처리로 넘겨 홈으로 간 뒤 그 자리로 내려간다.
     data-scroll 이 달린 <a> 를 수정키·가운데 버튼으로 누르면 스크롤하지 않고 브라우저에 맡긴다(새 탭). */
  var scr = e.target.closest('[data-scroll]');
  if (scr && !(isLinkEl(scr) && browserOwnsClick(e)) && scrollToId(scr.getAttribute('data-scroll'), true)) {
    e.preventDefault();
    return;
  }

  /* 링크: 내부 라우트면 golmokNav, 아니면 브라우저에 맡기고 끝낸다(아래 data-* 처리로 흘리지 않는다 —
     ctrl+클릭한 카드 링크가 새 탭과 지금 탭에서 동시에 열리는 일을 막는다). */
  var a = e.target.closest('a[href]');
  if (a) {
    var lr = linkRoute(a, e);
    if (!lr) return;
    e.preventDefault();
    if (lr.anchor !== undefined) { scrollToId(lr.anchor, true); return; }
    var opts = (lr.lang && lr.lang !== state.lang) ? { lang: lr.lang } : undefined;
    golmokNav(lr.path, opts);
    var after = a.getAttribute('data-scroll');
    if (after) scrollToId(after, false);
    return;
  }

  /* 링크가 아닌 카드(<button data-*>)의 폴백 이동. 수정키·가운데 버튼이면 아무것도 하지 않는다 —
     버튼은 새 탭을 열 수 없으니, 지금 탭이 몰래 바뀌지 않게 하는 쪽이 맞다. */
  var card = e.target.closest('[data-district]');
  if (card) { if (!browserOwnsClick(e)) golmokNav('d/' + card.getAttribute('data-district')); return; }

  var sp = e.target.closest('[data-spot]');
  if (sp) { if (!browserOwnsClick(e)) golmokNav('s/' + sp.getAttribute('data-spot')); return; }

  var comp = e.target.closest('[data-companion]');
  if (comp) { if (!browserOwnsClick(e)) golmokNav('c/' + comp.getAttribute('data-companion')); return; }

  var f = e.target.closest('[data-filter]');
  if (f) { state.filter = f.getAttribute('data-filter'); track('filter', { f: state.filter }); render(); return; }

  var cf = e.target.closest('[data-cfilter]');
  if (cf) { state.cfilter = cf.getAttribute('data-cfilter'); track('cfilter', { f: state.cfilter }); render(); return; }

  /* 내 계획 삭제 (이 기기의 저장값만 지운다).
     한 번째 누름 = 확인 대기, 두 번째 누름 = 삭제. confirm() 은 쓰지 않는다. */
  var del = e.target.closest('[data-delete-plan]');
  if (del) {
    var pid = del.getAttribute('data-delete-plan');
    if (state.confirmDelete !== pid) {
      clearDeleteArm();                /* 다른 버튼이 확인 대기였다면 먼저 되돌린다 */
      state.confirmDelete = pid;
      armDeleteButton(del);
      return;
    }
    clearDeleteArm();
    if (golmokDeleteMyPlan(pid)) {
      track('plan_delete', {});
      toast(t(UI.cnew_deleted_toast));
      /* 지운 계획의 주소를 기록에 남기지 않는다 — 뒤로 가기로 없는 계획 주소에 닿지 않게 */
      golmokNav('companions', { replace: true });
    } else {
      toast(t(UI.cnew_err_storage));   /* 저장소가 막혀 실제로는 못 지운 경우 */
    }
    return;
  }

  /* 참가 신청 토글. MVP에는 백엔드가 없다 — 이 기기에 관심만 기록하고,
     문구도 전달됐다고 말하지 않는다. 형식은 기존 'golmok-join' 문자열 배열 그대로(스토어가 관리). */
  var join = e.target.closest('[data-join]');
  if (join) {
    if (join.disabled || join.hasAttribute('disabled') || join.getAttribute('aria-disabled') === 'true') return;
    var cid = join.getAttribute('data-join');
    var joinedBefore = golmokJoinedIds().indexOf(cid) !== -1;
    var joinedNow = golmokToggleJoin(cid);
    if (joinedNow === joinedBefore) { toast(t(UI.cnew_err_storage)); return; }   /* 쓰기 실패 또는 허용 안 된 id */
    track(joinedNow ? 'companion_join' : 'companion_unjoin', { id: cid });
    toast(joinedNow ? t(UI.comp_join_sent) : t(UI.cnew_request_cancelled));
    var y = window.scrollY || window.pageYOffset || 0;
    render({ quiet: true });
    scrollTo(0, y);
    focusQuiet(document.querySelector('[data-join="' + attrSel(cid) + '"]'));
    return;
  }

  var sh = e.target.closest('[data-share]');
  if (sh) {
    shareCurrent(docTitleFor(parseRoute()));   /* 문서 제목과 같은 규칙 — 그 언어의 가게 이름 */
    return;
  }
});

/* 확인 대기 중 Esc = 취소. 네이티브 confirm 과 같은 감각으로 되돌린다(포커스는 버튼에 그대로). */
document.addEventListener('keydown', function (e) {
  if (state.confirmDelete && (e.key === 'Escape' || e.key === 'Esc')) clearDeleteArm();
});

document.addEventListener('input', function (e) {
  if (e.target.id !== 'dsearch') return;
  state.q = e.target.value || '';
  applySearch();
  if (state.q.length === 1) track('search', {});
});

document.addEventListener('submit', function (e) {
  /* 새 계획 — 이 기기에만 저장. novalidate 가 없어 required/maxlength/min 네이티브 검증을
     통과해야 이 이벤트가 온다. 최종 검증은 golmokSaveMyPlan 이 한다. */
  if (e.target.id === 'comp-new-form') {
    e.preventDefault();
    var input = collectCompNew(e.target);
    var res = golmokSaveMyPlan(input);
    if (!res.ok) {
      state.formErrors = res.errors;   /* district,date,time,title,plan,styles,langs,seats,budget,name,safety,contact,limit,storage */
      state.formDraft = input;
      render({ quiet: true });
      var box = document.querySelector('.form-errors');
      if (box) {
        var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
        box.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
        focusQuiet(box);               /* tabindex="-1" */
      }
      return;
    }
    state.formErrors = null;
    state.formDraft = null;
    /* title·plan·name 같은 사용자 문구는 track 에 넣지 않는다 */
    track('plan_create', { district: res.plan.district, styles: res.plan.styles.join(','), seats: res.plan.seats.total });
    toast(t(UI.cnew_saved_toast));
    golmokNav('c/' + res.plan.id);   /* render + 맨 위 스크롤 */
    return;
  }

  if (e.target.id !== 'partner-form') return;
  e.preventDefault();
  var fd = new FormData(e.target);
  var shop = fd.get('shop') || '', area = fd.get('area') || '',
      contact = fd.get('contact') || '', msg = fd.get('msg') || '';
  var subject = '[Golmok] 파트너 신청 — ' + shop;
  var body = '가게 이름: ' + shop + '\n동네: ' + area + '\n연락처: ' + contact + '\n\n' + msg;
  /* 사용자가 쓴 '동네' 문구는 계측에 넣지 않는다 — 상권 id 와 정확히 같을 때만 그 id 를 남긴다 */
  var areaId = String(area);
  var knownArea = (typeof DISTRICTS !== 'undefined') && DISTRICTS.some(function (d) { return d && d.id === areaId; });
  track('partner_apply', knownArea ? { area: areaId } : {});
  location.href = 'mailto:sangwan@datamingo.com?subject=' +
    encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
});

/* ---------- PWA ----------
   상대경로 'sw.js' 는 <base href> 로 풀린다 → path 모드에서 base + 'sw.js'(예: /golmok/sw.js),
   서비스워커 기본 scope 도 base 가 되어 언어·라우트 경로 전체를 덮는다.
   path 모드에서만 등록한다 — hash 모드(공유 데모·file:)에는 등록할 sw.js 가 없다.
   샌드박스 iframe(allow-same-origin 없음)에서는 navigator.serviceWorker 에 닿기만 해도 SecurityError 가
   동기로 던져진다(.catch 로 안 잡힌다) — 그래서 판정과 등록을 모두 try 안에서 한다. */
var swSupported = false;
try { swSupported = ROUTER_MODE === 'path' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator; } catch (e) {}
if (swSupported) {
  addEventListener('load', function () {
    try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {}
  });
}

/* ---------- 부팅 ----------
   (a) 모드 판정(위 ROUTER_MODE) → (b) path 모드면 옛 해시 URL 변환 + 언어 접두사 정규화(replaceState)
   → (c) render(). 미리렌더된 #app 내용은 같은 HTML 로 다시 그려진다(하이드레이션 없음). */
function bootPathMode() {
  try { if (history && 'scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var s = histState();
  navKey = (s && s.gk) || newNavKey();
  var info = readPathUrl();
  var lang = info.lang || preferredLang();
  setLang(lang);
  /* 주소 = 그릴 화면의 정식 주소: 옛 해시·언어 없음·모르는 언어·대문자·군더더기 세그먼트·없는 id·
     이 기기에 없는 내 계획(c/my-… → 홈)을 replaceState 로 정리한다. 쿼리·페이지 안 앵커는 남긴다. */
  if (info.under) normalizeLocation(viewRoutePath(parseRoute()), lang);
  /* 새로고침·다른 사이트에서 돌아왔을 때 떠나던 자리로 */
  addEventListener('pagehide', rememberScroll);
}

if (ROUTER_MODE === 'path') bootPathMode();
render();
if (ROUTER_MODE === 'path') {
  var bootY = savedScrollFor(navKey);
  if (bootY) scrollTo(0, bootY);
}
