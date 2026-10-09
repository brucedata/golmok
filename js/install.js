/* Golmok — 홈 화면 설치 안내 (PWA).

   전역으로 내보내는 것은 installHintHTML() 하나뿐이다. 상태와 리스너는 아래 IIFE 안에 숨는다.
   index.html 에서 views-partner.js 다음, app.js 앞에 로드된다. 그래서 app.js 의 전역
   (t, esc, UI, track, toast, golmokCurrentPath, golmokRouterMode)은 전부 '호출 시점'에만,
   typeof 로 있는지 확인하고 쓴다.

   순수 뷰가 아니다 — 로드 시점에 window 리스너 두 개(beforeinstallprompt · appinstalled)를 달고,
   document 클릭 위임에서는 자기 data 속성 두 개([data-install] · [data-install-dismiss])만 처리한다.
   홈(views-home.js)은 카드 자리에 언제나 빈 <div data-install-slot> 을 두고, 상태가 바뀌면
   이 파일이 그 슬롯 안만 다시 채운다(페이지 전체를 다시 그리지 않는다 — 포커스·스크롤이 튀지 않게).

   installHintHTML() 가 카드를 돌려주는 경우 (나머지는 전부 '')
     prompt / prompt-pc  Chromium(안드로이드·데스크톱)이 beforeinstallprompt 를 줬다
                         → [data-install] 버튼이 보관한 이벤트의 prompt() 를 부른다
     ios                 iOS·iPadOS 의 Safari → 공유 → '홈 화면에 추가' 2단계 안내(설치 이벤트가 없다)
     ios-other           iOS 의 다른 브라우저·인앱 브라우저(CriOS, FxiOS, 카카오톡, 라인, 인스타그램 …)
                         → Safari 로 열라는 안내
   '' 인 경우: 이미 설치해서 standalone 으로 열림 · 사용자가 닫음('golmok-install-dismissed') ·
              공개 사이트가 아님(hash 모드 공유 데모, file:, iframe 안, 서비스워커 없음) · 안내할 수단이 없음.
   미리렌더(빌드)와 스모크 테스트의 node 환경에서는 서비스워커가 없으므로 항상 '' 다 — 정적 HTML 에
   기기별 안내가 박히지 않는다.

   문구는 정직하게: 앱스토어 앱이 아니라 이 웹사이트에 아이콘이 붙는 것이다. 오프라인 약속(가이드만,
   지도는 인터넷 필요)은 서비스워커가 이 페이지를 실제로 제어할 때(navigator.serviceWorker.controller)만
   한다 — 등록이 실패했거나 아직 설치 전이면 오프라인 언급이 없는 문장(inst_p_basic)을 쓴다.
   iOS 는 홈 화면 앱이 Safari 와 저장소가 분리돼 Safari 의 캐시가 넘어가지 않으므로, '추가한 뒤 인터넷이
   될 때 한 번 열어 두면 그다음부터' 라는 조건을 붙인 문장(inst_p_ios)을 쓴다.

   브라우저 기본 설치 안내(beforeinstallprompt 의 기본 동작)는 이 카드를 지금 실제로 보여 줄 수 있을 때만
   막는다 — 매장 QR 로 가게 페이지에 바로 들어온 방문자나 '다시 보지 않기'를 누른 사용자에게는
   브라우저 자체 안내가 남는다. */
var installHintHTML = (function () {
  'use strict';

  var DISMISS_KEY = 'golmok-install-dismissed';
  var W = (typeof window !== 'undefined') ? window : null;
  var D = (typeof document !== 'undefined') ? document : null;

  var deferred = null;        /* 보관한 beforeinstallprompt 이벤트 (prompt() 는 이벤트당 한 번) */
  var installed = false;      /* appinstalled 를 받았거나 설치 창에서 수락 */
  var dismissedNow = false;   /* 저장소가 막힌 브라우저에서도 이번 방문 동안은 닫힌 채로 */

  /* ---------- 아이콘 (이모지 금지 — 인라인 SVG, 보조기기에서는 숨김) ---------- */

  /* icon.svg 와 같은 그림. 홈 화면에 생길 아이콘을 미리 보여 준다. */
  var APP_ICON =
    '<svg class="inst-app" width="56" height="56" viewBox="0 0 512 512" aria-hidden="true" focusable="false">' +
      '<rect width="512" height="512" rx="112" fill="#FF5A3C"></rect>' +
      '<path d="M150 372V196c0-14 11-25 25-25h74c14 0 25 11 25 25v176" fill="none" stroke="#FFF6F0"' +
        ' stroke-width="34" stroke-linecap="round"></path>' +
      '<path d="M274 372V262c0-14 11-25 25-25h63c14 0 25 11 25 25v110" fill="none" stroke="#14332B"' +
        ' stroke-width="34" stroke-linecap="round"></path>' +
      '<circle cx="212" cy="140" r="26" fill="#D9F24B"></circle>' +
    '</svg>';

  /* iOS 공유 버튼 모양: 위가 열린 상자 + 위로 나가는 화살표 */
  var ICON_SHARE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M12 14V3"></path><path d="M8.5 6.5L12 3l3.5 3.5"></path>' +
      '<path d="M16 9h1.5A1.5 1.5 0 0 1 19 10.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-9A1.5 1.5 0 0 1 6.5 9H8"></path>' +
    '</svg>';

  /* '홈 화면에 추가' 항목 모양: 둥근 사각형 안의 + */
  var ICON_ADD =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<rect x="4" y="4" width="16" height="16" rx="4"></rect><path d="M12 8.5v7"></path><path d="M8.5 12h7"></path>' +
    '</svg>';

  /* ---------- 환경 판정 (매번 호출 시점에 읽는다 — 스모크가 UA 를 바꿔 끼울 수 있게) ---------- */

  function nav() { return (typeof navigator !== 'undefined' && navigator) ? navigator : {}; }
  function ua() {
    try { return String(nav().userAgent || ''); } catch (e) { return ''; }
  }

  function readDismissed() {
    if (dismissedNow) return true;
    try { return !!localStorage.getItem(DISMISS_KEY); } catch (e) { return false; }
  }

  /* 홈 화면 아이콘으로 열린 상태(또는 안드로이드 TWA) */
  function isStandalone() {
    var modes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];
    try {
      if (W && typeof W.matchMedia === 'function') {
        for (var i = 0; i < modes.length; i++) {
          var mq = W.matchMedia('(display-mode: ' + modes[i] + ')');
          if (mq && mq.matches) return true;
        }
      }
    } catch (e) {}
    try { if (nav().standalone === true) return true; } catch (e) {}
    try {
      if (D && typeof D.referrer === 'string' && D.referrer.indexOf('android-app://') === 0) return true;
    } catch (e) {}
    return false;
  }

  /* 설치해서 의미가 있는 '진짜 사이트' 인가.
     hash 모드(공유 데모 번들·file:)·iframe 안·보안 컨텍스트 아님·서비스워커 API 없음이면 아니다.
     (API 가 있다고 실제로 깔린 것은 아니다 — 오프라인 문장은 따로 swControls() 로 가른다.) */
  function isPublicSite() {
    if (!W || !D) return false;
    if (typeof golmokRouterMode === 'function') {
      if (golmokRouterMode() !== 'path') return false;
    } else {
      if (W.GOLMOK_ROUTER === 'hash') return false;
      var proto = '';
      try { proto = String(location.protocol || ''); } catch (e) {}
      if (!/^https?:$/i.test(proto)) return false;
    }
    if (W.isSecureContext === false) return false;
    if (!('serviceWorker' in nav())) return false;
    try { if (W.top && W.top !== W.self) return false; } catch (e) { return false; }
    return true;
  }

  /* 서비스워커가 이 페이지를 지금 제어하는가 = 사전 캐시까지 끝나 오프라인 폴백이 실제로 돈다.
     app.js 는 등록 실패를 조용히 삼키므로 API 존재가 아니라 controller 를 본다.
     첫 방문의 첫 화면은 설치가 끝나기 전이라 null 이다 — 그때는 오프라인을 약속하지 않는다. */
  function swControls() {
    try {
      var sw = nav().serviceWorker;
      return !!(sw && sw.controller);
    } catch (e) { return false; }
  }

  /* 'ios' | 'ios-other' | 'other'
     iPadOS 13+ 의 Safari 는 맥 UA(Macintosh)를 보내므로 터치 포인트로 가려낸다.
     진짜 Safari 는 'Version/x … Safari/' 가 있고 다른 브라우저·인앱 브라우저 표식이 없다. */
  var OTHER_IOS_BROWSER = new RegExp([
    'CriOS', 'FxiOS', 'EdgiOS', 'OPiOS', 'OPT/', 'YaBrowser', 'DuckDuckGo', 'GSA/', 'Brave',
    'FBAN', 'FBAV', 'Instagram', 'Line/', 'KAKAOTALK', 'NAVER', 'Whale', 'DaumApps',
    'MicroMessenger', 'Weibo', 'Snapchat', 'Twitter', 'TikTok', 'musical_ly', 'Bytedance', 'Pinterest'
  ].join('|'), 'i');

  function platform() {
    var s = ua();
    var touchMac = /Macintosh/.test(s) && (Number(nav().maxTouchPoints) || 0) > 1;
    if (!/iPhone|iPad|iPod/.test(s) && !touchMac) return 'other';
    var safari = /Version\/[0-9.]+.*Safari\//.test(s) && !OTHER_IOS_BROWSER.test(s);
    return safari ? 'ios' : 'ios-other';
  }

  /* 설치 버튼 문구: 폰·태블릿은 '홈 화면', 컴퓨터는 '설치' */
  function isHandheld() {
    var d = nav().userAgentData;
    if (d && (d.mobile === true || d.platform === 'Android')) return true;
    return /Android|iPhone|iPad|iPod|Mobi/i.test(ua());
  }

  /* ---------- 카드 ---------- */

  /* app.js 의 t()/esc() 와 i18n.js 의 UI 가 있어야 그린다. 문구 키(inst_ 로 시작)는 아래에서
     점 표기로 직접 적는다 — 스모크가 소스의 점 표기 키를 훑어 i18n.js 에 있는지 확인하기 때문이다. */
  function ready() {
    return typeof t === 'function' && typeof esc === 'function' && typeof UI !== 'undefined' && !!UI;
  }

  /* 카드가 지금 화면에 나올 수 있는가(설치 이벤트를 받은 뒤라는 전제 — 이벤트가 있으면 kind 는 늘 prompt) */
  function canShowCard() {
    return ready() && !installed && isPublicSite() && !isStandalone() && !readDismissed() && onHome();
  }

  function hintHTML() {
    if (!ready() || installed || !isPublicSite() || isStandalone() || readDismissed()) return '';

    var kind = deferred ? (isHandheld() ? 'prompt' : 'prompt-pc') : platform();
    if (kind === 'other') return '';
    var pc = kind === 'prompt-pc';
    var ios = kind === 'ios' || kind === 'ios-other';

    /* 오프라인 약속은 서비스워커가 실제로 제어할 때만. iOS 는 홈 화면 앱의 저장소가 따로라 조건을 붙인다. */
    var lead = !swControls() ? UI.inst_p_basic : (ios ? UI.inst_p_ios : UI.inst_p);

    var extra = '';
    if (kind === 'ios') {
      /* 3번째 줄: X·Gmail 같은 앱이 링크를 여는 Safari 창(SFSafariViewController)·iOS Brave 는 UA 가
         Safari 와 같아 가려낼 수 없는데, 그 창의 공유 메뉴에는 '홈 화면에 추가'가 없다 — 문구로 보완한다.
         단계(.inst-steps 두 칸 격자)가 아니라 안내라서 기존 .inst-note 로 단다. */
      extra =
        '<ol class="inst-steps">' +
          '<li><span class="inst-ic">' + ICON_SHARE + '</span><span>' + esc(t(UI.inst_ios_1)) + '</span></li>' +
          '<li><span class="inst-ic">' + ICON_ADD + '</span><span>' + esc(t(UI.inst_ios_2)) + '</span></li>' +
        '</ol>' +
        '<p class="inst-note">' + esc(t(UI.inst_ios_3)) + '</p>';
    } else if (kind === 'ios-other') {
      extra = '<p class="inst-note">' + esc(t(UI.inst_ios_other)) + '</p>';
    }

    var actions = '';
    if (kind === 'prompt' || pc) {
      actions += '<button type="button" class="btn btn-primary" data-install="1">' +
        esc(t(pc ? UI.inst_btn_pc : UI.inst_btn)) + '</button>';
    }
    actions += '<button type="button" class="btn btn-ghost" data-install-dismiss="1">' +
      esc(t(UI.inst_dismiss)) + '</button>';

    return '<section class="inst-sec" data-install-card="1" aria-labelledby="inst-t">' +
      '<div class="wrap wrap-wide"><div class="inst">' +
        '<div class="inst-head">' + APP_ICON +
          '<div class="inst-copy">' +
            '<h2 class="inst-t" id="inst-t">' + esc(t(pc ? UI.inst_t_pc : UI.inst_t)) + '</h2>' +
            '<p class="inst-p">' + esc(t(lead)) + '</p>' +
          '</div>' +
        '</div>' +
        extra +
        '<div class="inst-actions">' + actions + '</div>' +
      '</div></div>' +
    '</section>';
  }

  /* ---------- 다시 그리기 ----------
     홈의 [data-install-slot] 안만 다시 채운다. 페이지 전체를 다시 그리지 않으므로 검색창 입력·헤더 링크 등
     슬롯 밖의 포커스는 그대로다. 슬롯 안(누른 버튼)에 포커스가 있었다면 새 카드의 같은 버튼으로,
     카드가 사라졌으면 다음 구역의 첫 조작 요소로 옮긴다 — 키보드·스크린리더 사용자의 위치가 문서 맨 앞으로
     튀지 않게. 슬롯이 없는 화면(홈이 아닌 곳)에서는 아무것도 하지 않는다 — 다음에 홈을 그릴 때 반영된다.
     (슬롯 없이 카드만 있는 옛 홈 마크업이면 그 카드만 제자리에서 바꾸거나 지운다.) */

  function onHome() {
    try {
      if (typeof golmokCurrentPath === 'function') return golmokCurrentPath() === '';
      if (typeof parseRoute === 'function') return parseRoute().view === 'home';
    } catch (e) {}
    return false;
  }

  function focusQuietly(el) {
    if (!el || typeof el.focus !== 'function') return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  /* el 다음 형제 구역에서 첫 조작 요소 */
  function nextFocusable(el) {
    var next = el && el.nextElementSibling;
    return (next && next.querySelector)
      ? next.querySelector('a[href], button:not([disabled]), input:not([disabled]), select, textarea')
      : null;
  }

  /* 포커스가 box 안에 있으면 어느 버튼이었는지(같은 버튼을 새 카드에서 찾으려고) */
  function focusInside(box) {
    var a = D.activeElement;
    if (!a || !box.contains || !box.contains(a)) return null;
    if (typeof a.closest === 'function') {
      if (a.closest('[data-install]')) return '[data-install]';
      if (a.closest('[data-install-dismiss]')) return '[data-install-dismiss]';
    }
    return '*';
  }

  function bottomOf(el) {
    try { return el.getBoundingClientRect().bottom; } catch (e) { return null; }
  }

  function fillSlot(slot, html) {
    var had = focusInside(slot);
    var next = had ? nextFocusable(slot) : null;
    var before = bottomOf(slot);
    slot.innerHTML = html;
    /* 슬롯이 지금 보는 곳보다 위에 있었으면(아래로 스크롤해 둔 상태) 늘거나 준 만큼 스크롤을 맞춰
       보던 내용이 밀리지 않게 한다. 브라우저의 스크롤 고정(scroll anchoring)이 이미 맞췄으면 차이가 0 이다. */
    var after = bottomOf(slot);
    if (before !== null && after !== null && before <= 0 && after !== before && W && typeof W.scrollBy === 'function') {
      W.scrollBy(0, after - before);
    }
    if (had) {
      var same = had !== '*' && slot.querySelector ? slot.querySelector(had) : null;
      focusQuietly(same || next);
    }
  }

  /* 옛 마크업 — 슬롯 없이 카드만 있을 때 */
  function swapCard(card, html) {
    var had = focusInside(card);
    var next = had ? nextFocusable(card) : null;
    if (!html) {
      if (card.parentNode) card.parentNode.removeChild(card);
      if (had) focusQuietly(next);
      return;
    }
    var holder = D.createElement('div');
    holder.innerHTML = html;
    var fresh = holder.firstElementChild || holder.firstChild;
    if (fresh && card.parentNode) card.parentNode.replaceChild(fresh, card);
    if (had && fresh) focusQuietly((had !== '*' && fresh.querySelector && fresh.querySelector(had)) || next);
  }

  function refresh() {
    if (!D || typeof D.querySelector !== 'function') return;
    var slot = D.querySelector('[data-install-slot]');
    if (slot) { fillSlot(slot, hintHTML()); return; }
    var card = D.querySelector('[data-install-card]');
    if (card) swapCard(card, hintHTML());
  }

  function note(event, props) {
    if (typeof track === 'function') track(event, props || {});
  }

  /* ---------- 동작 ---------- */

  function promptInstall() {
    var ev = deferred;
    deferred = null;                   /* 결과와 상관없이 이 이벤트는 다시 못 쓴다 */
    if (!ev || typeof ev.prompt !== 'function') { refresh(); return; }
    note('install_prompt');

    var shown = null;
    try { shown = ev.prompt(); } catch (e) { shown = null; }
    if (shown && typeof shown.then === 'function') shown.then(null, function () {});

    var choice = ev.userChoice;
    if (choice && typeof choice.then === 'function') {
      choice.then(function (res) {
        var accepted = !!(res && res.outcome === 'accepted');
        if (accepted) installed = true;
        note('install_choice', { outcome: accepted ? 'accepted' : 'dismissed' });
        refresh();
      }, function () { refresh(); });
    } else {
      refresh();
    }
  }

  function dismiss() {
    dismissedNow = true;
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    note('install_dismiss');
    refresh();
  }

  /* ---------- 로드 시점 리스너 ---------- */

  if (W && typeof W.addEventListener === 'function') {
    /* 카드를 지금 보여 줄 수 있을 때만(홈 · 공개 사이트 · 닫지 않음 · 설치 전) 브라우저 기본 미니 인포바를
       막고 카드로 안내한다. 아니면 막지 않는다 — 가게 페이지로 바로 들어온 방문자나 '다시 보지 않기'를 누른
       사용자도 브라우저 자체 안내를 받는다. 어느 쪽이든 이벤트는 보관해 두어, 나중에 홈에 오면 카드의
       [설치] 버튼이 쓴다. 메뉴의 '앱 설치'는 언제나 그대로 남는다. */
    W.addEventListener('beforeinstallprompt', function (e) {
      deferred = e;
      if (canShowCard() && e && typeof e.preventDefault === 'function') e.preventDefault();
      refresh();
    });
    W.addEventListener('appinstalled', function () {
      installed = true;
      deferred = null;
      note('install_done');
      /* toast() 는 textContent 로 넣으므로 esc() 하지 않는다 */
      if (typeof toast === 'function' && ready()) toast(t(UI.inst_done));
      refresh();
    });
  }

  if (D && typeof D.addEventListener === 'function') {
    D.addEventListener('click', function (e) {
      var el = e && e.target;
      if (!el || typeof el.closest !== 'function') return;
      if (el.closest('[data-install]')) { e.preventDefault(); promptInstall(); return; }
      if (el.closest('[data-install-dismiss]')) { e.preventDefault(); dismiss(); }
    });
  }

  return hintHTML;
}());
