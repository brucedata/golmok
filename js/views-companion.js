/* Golmok — 동행 매칭 뷰 (라우트 'companions', 'c/{id}', 'companions/new').
   전역으로 노출하는 것은 function 선언 네 개뿐이다:
     golmokAvatarClass(i) / companionsHTML() / companionHTML(c) / companionNewHTML()
   t() · esc() · state · footerHTML() (app.js), UI · LANGS (i18n.js), DISTRICTS (data.js),
   COMPANIONS · COMP_STYLES (companions.js), golmokLoadMyPlans · golmokJoinedIds
   (companion-store.js) 는 **호출 시점(런타임)에만** 참조한다.
   순수 함수 — DOM을 만지지 않고 HTML 문자열만 돌려준다. 이벤트는 app.js 가 위임으로 받는다:
     링크(<a href>) · [data-scroll] · [data-cfilter] · [data-join] · [data-delete-plan] ·
     submit #comp-new-form
   동행 카드(.ccard)는 진짜 링크(golmokHref('c/{id}'))다 — 새 탭 열기·링크 복사가 되고, 이동은
   app.js 의 링크 가로채기가 맡는다. data-companion 은 이동에 쓰이지 않는 표식이다.
   클래스는 css/style.css 의 동행 영역(.comp-* · .ccard · .c-* · cnew-* · .form-errors)에 정의된 것만 쓴다.
   아바타 색은 인라인 style이 아니라 확정 팔레트 3변형(.avatar / .forest / .lime)을
   호스트 순번으로 돌려 쓴다 — 임의 hsl 색은 팔레트를 깨고 대비도 보장되지 않는다.

   정직성: 사용자가 올린 계획(mine)과 참가 신청은 이 기기에만 저장된다.
   화면 어디에서도 "게시됐다 / 전달됐다 / 다른 사람이 본다"고 말하지 않는다.
   내 계획의 title / blurb 는 {en,ja,zh,ko} 객체가 아니라 사용자가 쓴 일반 문자열이다. */

/* 아바타 변형 선택: 확정 팔레트 밖 색을 만들지 않는다. */
function golmokAvatarClass(i) {
  var v = ['', ' forest', ' lime'];
  return v[((Number(i) || 0) % 3 + 3) % 3];
}


function companionsHTML() {

  /* ---- 런타임 로컬 헬퍼 (전역 오염 없음) ---- */
  function txt(v) { return esc(v && typeof v === 'object' ? t(v) : v); }

  function fill(tpl, token, value) {
    /* 함수 치환 — 값에 $& 같은 패턴이 있어도 안전 */
    return String(tpl || '').replace(token, function () { return String(value); });
  }

  function dname(id) {
    var arr = (typeof DISTRICTS !== 'undefined' && DISTRICTS) ? DISTRICTS : [];
    var d = arr.filter(function (x) { return x.id === id; })[0];
    return d ? esc(t(d.name)) : esc(id);
  }

  /* i18n 폴백 — i18n.js 에 같은 키가 생기면 자동으로 그쪽을 쓴다.
     (UI 에 아직 없는 문구는 4개 언어 객체로 여기 둔다) */
  function ui(key, local) {
    return t((typeof UI !== 'undefined' && UI && UI[key]) ? UI[key] : local);
  }

  /* 지난 일정 판정 — 기기 로컬 기준 오늘. 'YYYY-MM-DD' 문자열일 때만 본다
     (ISO 날짜는 문자열 비교가 곧 날짜 비교다). 지난 일정에는 신청 CTA를 걸지 않는다. */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayLocal() {
    var n = new Date();
    return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate());
  }
  function isPast(w) {
    var v = w && w.date;
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && v < todayLocal();
  }

  var PAST_LBL = { en: 'Date passed', ja: '開催日が過ぎました', zh: '日期已过', ko: '지난 일정' };

  var PLUS =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 5v14M5 12h14"></path></svg>';
  var CHECK =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M5 12.5l4.2 4.2L19 7"></path></svg>';
  var DEVICE =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="7" y="2.5" width="10" height="19" rx="2.5"></rect><path d="M11 18.5h2"></path></svg>';

  var STYLES  = (typeof COMP_STYLES !== 'undefined' && COMP_STYLES) ? COMP_STYLES : {};
  var SAMPLES = (typeof COMPANIONS  !== 'undefined' && COMPANIONS)  ? COMPANIONS  : [];
  var MINE    = (typeof golmokLoadMyPlans === 'function') ? golmokLoadMyPlans() : [];
  var JOINED  = (typeof golmokJoinedIds === 'function') ? golmokJoinedIds() : [];
  var cf      = (typeof state !== 'undefined' && state && state.cfilter) ? state.cfilter : 'all';

  /* 필터는 샘플 목록에만 건다 — 내 계획은 항상 전부 보인다 */
  var list = SAMPLES.filter(function (c) {
    if (cf === 'all') return true;
    return (c.styles || []).indexOf(cf) !== -1;
  });

  /* ---- 필터 pill ---- */
  var filters = ['<button type="button" data-cfilter="all" aria-pressed="' +
    (cf === 'all') + '">' + esc(t(UI.comp_all)) + '</button>'];

  Object.keys(STYLES).forEach(function (k) {
    filters.push('<button type="button" data-cfilter="' + esc(k) + '" aria-pressed="' +
      (cf === k) + '">' + esc(t(STYLES[k].label)) + '</button>');
  });

  /* ---- 카드 ----
     avatarIdx: 샘플은 COMPANIONS 원본 순번, 내 계획은 내 계획 목록 순번
     (상세 페이지와 같은 색이 나오도록 필터된 순번을 쓰지 않는다) */
  function card(c, avatarIdx) {
    var host  = c.host  || {};
    var seats = c.seats || {};
    var when  = c.when  || {};
    var mine  = !!c.mine;
    var joined = !mine && JOINED.indexOf(c.id) !== -1;
    var taken = Number(seats.taken) || 0;
    var total = Number(seats.total) || 0;
    var full  = total > 0 && taken >= total;
    var left  = Math.max(total - taken, 0);
    var past  = isPast(when);

    var seatLbl = String(t(full ? UI.comp_seats_full : UI.comp_seats) || '')
      .replace('{n}', String(left))
      .replace('{taken}', String(taken))
      .replace('{total}', String(total));

    var whenLine = [txt(when.date), txt(when.time), dname(c.district)]
      .filter(function (s) { return !!s; }).join(' · ');

    var chips = (c.styles || []).map(function (k) {
      var s = STYLES[k];
      return s ? '<span class="cstyle-chip">' + esc(t(s.label)) + '</span>' : '';
    }).join('');

    /* 마감·지난 일정 카드는 코랄 CTA를 지우고 회색 아웃라인 seats pill만 남겨 강조를 낮춘다.
       내 계획은 참가 대상이 아니므로 '자세히'로 안내한다.
       본인 확인 배지는 렌더하지 않는다 — 신원 확인 기능이 없는데 배지를 달면 가짜 신뢰 신호다. */
    var go = mine
      ? '<span class="go">' + esc(t(UI.details)) + ' →</span>'
      : ((full || past) ? '' : '<span class="go">' + esc(t(UI.comp_join)) + ' →</span>');

    /* 지난 일정에는 '{n}자리 남음'을 띄우지 않는다 — 신청할 수 없는 자리다 */
    var seatCell = past
      ? '<span class="seats full">' + esc(ui('cnew_past', PAST_LBL)) + '</span>'
      : '<span class="seats' + (full ? ' full' : '') + '">' +
          '<span class="num">' + taken + '/' + total + '</span>' +
          (seatLbl ? ' ' + esc(seatLbl) : '') +
        '</span>';

    /* 카드 = 링크. 안에는 버튼·링크를 넣지 않는다. h3 를 담는 칸은 div(span 안의 h3 는 무효 HTML) —
       .head(flex)·.ccard(flex 세로)의 항목이라 span 이든 div 든 블록으로 놓인다 */
    return '<a class="ccard" href="' + esc(golmokHref('c/' + c.id)) + '" data-companion="' + esc(c.id) + '"' +
        (full ? ' data-full="1"' : '') + '>' +
      '<div class="head">' +
        '<span class="avatar' + golmokAvatarClass(avatarIdx) + '">' +
          esc(host.initials) + '</span>' +
        '<div>' +
          '<h3>' + txt(c.title) + '</h3>' +
          '<span class="meta">' +
            '<span>' + esc(t(UI.comp_hosted_by)) + ' ' + esc(host.name) + '</span>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<span class="row">' +
        '<span class="when"><span class="num">' + whenLine + '</span></span>' +
        seatCell +
        (joined ? '<span class="cnew-flag">' + CHECK + esc(t(UI.cnew_requested)) + '</span>' : '') +
      '</span>' +
      (chips ? '<span class="row">' + chips + '</span>' : '') +
      '<p>' + txt(c.blurb) + '</p>' +
      go +
    '</a>';
  }

  var mineCards = MINE.map(function (c, i) { return card(c, i); }).join('');
  var cards = list.map(function (c) { return card(c, SAMPLES.indexOf(c)); }).join('');

  /* ---- 안전 안내 (목록·상세 공통 문구) ---- */
  var safety =
    '<div class="safety">' +
      '<span class="k">' + esc(t(UI.comp_safety_k)) + '</span>' +
      '<ul>' +
        '<li>' + esc(t(UI.comp_safety_1)) + '</li>' +
        '<li>' + esc(t(UI.comp_safety_2)) + '</li>' +
        '<li>' + esc(t(UI.comp_safety_3)) + '</li>' +
        '<li>' + esc(t(UI.cnew_safety_4)) + '</li>' +
        '<li>' + esc(t(UI.cnew_safety_5)) + '</li>' +
      '</ul>' +
    '</div>';

  /* ---- 내 계획 묶음: 목록 맨 위. 이 기기 전용이라는 사실을 제목 바로 아래에서 말한다 ---- */
  var mineBlock = MINE.length
    ? '<div class="cnew-mine" id="mine">' +
        '<div class="sec-head"><h2>' + esc(t(UI.cnew_mine_t)) + '</h2></div>' +
        '<p class="lite-note cnew-local">' + DEVICE +
          '<span>' + esc(t(UI.cnew_local_note)) + '</span></p>' +
        '<div class="comp-list">' + mineCards + '</div>' +
      '</div>'
    : '';

  /* ---- 페이지 ---- */
  return '' +
    '<section class="comp-hero"><div class="wrap">' +
      '<p class="kicker">' + esc(t(UI.comp_title)) + '</p>' +
      '<h1>' + esc(t(UI.comp_sub)) + '</h1>' +
      '<p class="sub">' + esc(t(UI.comp_note)) + '</p>' +
      '<div class="hero-cta">' +
        /* 페이지 내 이동은 해시 링크가 아니라 data-scroll — hash 모드에선 라우터가 먹고,
           path 모드에선 <base> 때문에 사이트 루트로 튄다 */
        '<button type="button" class="btn btn-primary" data-scroll="list">' +
          esc(t(UI.comp_cta)) + '</button>' +
        '<a class="btn btn-ghost" href="' + esc(golmokHref('companions/new')) + '">' + PLUS +
          esc(t(UI.cnew_cta)) + '</a>' +
      '</div>' +
    '</div></section>' +

    '<section id="list"><div class="wrap wrap-wide">' +
      mineBlock +

      '<div class="sec-head">' +
        (MINE.length ? '<h2>' + esc(t(UI.cnew_samples_t)) + '</h2>' : '') +
        '<span class="tagchip">' + esc(t(UI.sample)) + '</span>' +
      '</div>' +

      '<div class="comp-filters" role="group" aria-label="' + esc(t(UI.comp_style_k)) + '">' +
        filters.join('') +
      '</div>' +

      (list.length
        ? '<div class="comp-list">' + cards + '</div>'
        : '<p class="empty-note">' + esc(t(UI.comp_empty)) + '</p>') +

      safety +
    '</div></section>' +

    footerHTML();
}


function companionHTML(c) {

  function txt(v) { return esc(v && typeof v === 'object' ? t(v) : v); }

  function dname(id) {
    var arr = (typeof DISTRICTS !== 'undefined' && DISTRICTS) ? DISTRICTS : [];
    var d = arr.filter(function (x) { return x.id === id; })[0];
    return d ? esc(t(d.name)) : esc(id);
  }

  function fill(tpl, token, value) {
    return String(tpl || '').replace(token, function () { return String(value); });
  }

  /* i18n 폴백 — i18n.js 에 같은 키가 생기면 자동으로 그쪽을 쓴다 */
  function ui(key, local) {
    return t((typeof UI !== 'undefined' && UI && UI[key]) ? UI[key] : local);
  }

  /* 지난 일정 판정 — 목록 카드와 같은 규칙(기기 로컬 오늘, ISO 문자열 비교) */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayLocal() {
    var n = new Date();
    return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate());
  }
  function isPast(w) {
    var v = w && w.date;
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && v < todayLocal();
  }

  var PAST_LBL = { en: 'Date passed', ja: '開催日が過ぎました', zh: '日期已过', ko: '지난 일정' };
  /* 나이대 — 데이터의 '20s' 를 그대로 쓰면 ja/zh/ko 화면에 영어가 섞인다 */
  var AGE_LBL  = { en: '{n}s', ja: '{n}代', zh: '{n}多岁', ko: '{n}대' };
  /* comp_who_k('이런 분에게')는 대상 설명용 제목이라 호스트 카드에 맞지 않는다 */
  var HOST_K   = { en: 'About the host', ja: 'ホストについて', zh: '关于发起人', ko: '호스트 소개' };
  /* 링크로 바로 들어온 사람이 실존 인물로 읽지 않게, 상세 첫 화면에서 샘플이라고 말한다 */
  var SAMPLE_NOTE = {
    en: 'A sample plan for the preview. The host is made up, and a request stays on this device until the beta.',
    ja: 'プレビュー用のサンプルプランです。ホストは架空の人物で、申し込みはベータ公開までこの端末に保存されるだけです。',
    zh: '这是预览用的示例计划。发起人是虚构的，申请在测试版开放前只保存在这台设备上。',
    ko: '미리보기용 샘플 계획이에요. 호스트는 가상의 인물이고, 신청은 베타 전까지 이 기기에만 저장돼요.'
  };

  var CHECK =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M5 12.5l4.2 4.2L19 7"></path></svg>';
  var DEVICE =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="7" y="2.5" width="10" height="19" rx="2.5"></rect><path d="M11 18.5h2"></path></svg>';
  var TRASH =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"></path></svg>';

  var STYLES = (typeof COMP_STYLES !== 'undefined' && COMP_STYLES) ? COMP_STYLES : {};

  c = c || {};
  var mine  = !!c.mine;
  var host  = c.host  || {};
  var seats = c.seats || {};
  var when  = c.when  || {};
  var taken = Number(seats.taken) || 0;
  var total = Number(seats.total) || 0;
  var full  = total > 0 && taken >= total;
  var left  = Math.max(total - taken, 0);
  var past  = isPast(when);

  var joined = !mine && typeof golmokJoinedIds === 'function' &&
    golmokJoinedIds().indexOf(c.id) !== -1;

  var seatLbl = String(t(full ? UI.comp_seats_full : UI.comp_seats) || '')
    .replace('{n}', String(left))
    .replace('{taken}', String(taken))
    .replace('{total}', String(total));

  var whenLine = [txt(when.date), txt(when.time)]
    .filter(function (s) { return !!s; }).join(' · ');

  var chips = (c.styles || []).map(function (k) {
    var s = STYLES[k];
    return s ? '<span class="cstyle-chip">' + esc(t(s.label)) + '</span>' : '';
  }).join('');

  var langs = (host.langs || []).map(function (l) { return esc(l); }).join(' · ');

  /* 목록과 같은 아바타 변형: 샘플은 COMPANIONS 원본 순번,
     내 계획은 내 계획 목록에서의 순번(스토어가 매번 새 객체를 만드므로 id 로 찾는다) */
  var ci = 0;
  if (mine) {
    var mineList = (typeof golmokLoadMyPlans === 'function') ? golmokLoadMyPlans() : [];
    for (var mi = 0; mi < mineList.length; mi++) {
      if (mineList[mi].id === c.id) { ci = mi; break; }
    }
  } else if (typeof COMPANIONS !== 'undefined' && COMPANIONS) {
    ci = Math.max(COMPANIONS.indexOf(c), 0);
  }

  /* 본인 확인 배지는 어디에도 렌더하지 않는다 — 신원 확인 절차가 없는데 배지를 달면
     낯선 사람을 만나는 결정을 가짜 신뢰 신호 위에서 하게 만든다. */

  /* ---- 코스 타임라인 (샘플만. 형식이 맞는 단계만 그린다) ---- */
  var steps = (!mine && Array.isArray(c.plan))
    ? c.plan.filter(function (s) { return s && typeof s === 'object' && s.t; })
    : [];

  var planBody = steps.length
    ? '<ol>' + steps.map(function (s, i) {
        return '<li>' +
          '<span class="n">' + (i + 1) + '</span>' +
          '<div class="t">' +
            (s.time ? '<span class="time num">' + esc(s.time) + '</span>' : '') +
            txt(s.t) +
          '</div>' +
          (s.d ? '<div class="d">' + txt(s.d) + '</div>' : '') +
        '</li>';
      }).join('') + '</ol>'
    : '<p>' + txt(c.blurb) + '</p>';

  /* ---- 호스트 소개: 나이대는 '20s' 를 그대로 쓰지 않고 현지 표기로 옮긴다 ---- */
  var who = [esc(host.name)];
  if (host.country) who.push(txt(host.country));
  var ageN = parseInt(host.ageBand, 10);
  if (isFinite(ageN)) who.push(esc(fill(ui('cnew_age', AGE_LBL), '{n}', ageN)));

  var safety =
    '<div class="safety">' +
      '<span class="k">' + esc(t(UI.comp_safety_k)) + '</span>' +
      '<ul>' +
        '<li>' + esc(t(UI.comp_safety_1)) + '</li>' +
        '<li>' + esc(t(UI.comp_safety_2)) + '</li>' +
        '<li>' + esc(t(UI.comp_safety_3)) + '</li>' +
        '<li>' + esc(t(UI.cnew_safety_4)) + '</li>' +
        '<li>' + esc(t(UI.cnew_safety_5)) + '</li>' +
      '</ul>' +
    '</div>';

  /* ---- 하단 행동 ----
     내 계획: 삭제(확인은 app.js 가 confirm 으로).
     샘플: 신청 토글. aria-pressed 로 상태를 알리고, 신청한 상태면 라벨·안내도 바꾼다.
     만석이거나 날짜가 지났으면 새 신청은 disabled — 단, 이미 신청해 둔 것은 취소할 수
     있게 열어 둔다 (golmokToggleJoin 도 같은 규칙). */
  var action;
  if (mine) {
    action =
      '<div class="c-join">' +
        '<button type="button" class="btn btn-ghost" data-delete-plan="' + esc(c.id) + '">' +
          TRASH + esc(t(UI.cnew_delete)) + '</button>' +
      '</div>';
  } else {
    var locked = (full || past) && !joined;
    var label = joined
      ? CHECK + esc(t(UI.cnew_requested))
      : (past ? esc(ui('cnew_past', PAST_LBL))
              : esc(t(full ? UI.comp_seats_full : UI.comp_join)));
    var note = joined
      ? esc(t(UI.cnew_requested_note))
      : (locked ? '' : esc(seatLbl));

    action =
      '<div class="c-join">' +
        '<button type="button" class="btn btn-primary" data-join="' + esc(c.id) + '"' +
          ' aria-pressed="' + joined + '"' +
          (note ? ' aria-describedby="c-join-note"' : '') +
          (locked ? ' disabled aria-disabled="true"' : '') + '>' + label + '</button>' +
        (note
          ? '<span class="c-join-note' + (joined ? '' : ' num') + '" id="c-join-note">' + note + '</span>'
          : '') +
      '</div>';
  }

  return '' +
    '<div class="wrap">' +
      '<a class="back" href="' + esc(golmokHref('companions')) + '">← ' + esc(t(UI.comp_back)) + '</a>' +

      '<div class="c-detail">' +
        /* 샘플에는 목록과 같은 SAMPLE 표시를 상세 첫 줄에 단다 — 링크로 바로 들어온
           사람이 실존 인물의 계획으로 읽고 신청을 결정하지 않도록. */
        '<span class="kicker">' +
          esc(t(mine ? UI.cnew_mine_k : UI.sample)) + '</span>' +
        '<div class="head">' +
          '<span class="avatar' + golmokAvatarClass(ci) + '">' +
            esc(host.initials) + '</span>' +
          '<div>' +
            '<h1>' + txt(c.title) + '</h1>' +
            '<div class="meta">' +
              '<span>' + esc(t(UI.comp_hosted_by)) + ' ' + esc(host.name) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="statline">' +
          '<div class="stat"><span class="lbl">' + esc(t(UI.comp_when)) + '</span>' +
            '<b class="num">' + whenLine + '</b></div>' +
          '<div class="stat"><span class="lbl">' + esc(t(UI.comp_where)) + '</span>' +
            '<b><a href="' + esc(golmokHref('d/' + c.district)) + '">' + dname(c.district) + '</a></b></div>' +
          '<div class="stat"><span class="lbl">' + esc(t(UI.comp_langs)) + '</span>' +
            '<b>' + langs + '</b></div>' +
        '</div>' +

        /* 코스 타임라인이 있으면 호스트 한마디(blurb)는 색면 블록의 요약 문단으로 올린다 */
        (steps.length ? '<p>' + txt(c.blurb) + '</p>' : '') +
      '</div>' +

      (mine
        ? '<p class="lite-note cnew-local">' + DEVICE +
            '<span>' + esc(t(UI.cnew_local_note)) + '</span></p>'
        : '<p class="lite-note">' + esc(ui('cnew_sample_note', SAMPLE_NOTE)) + '</p>') +

      '<div class="c-plan">' +
        '<span class="k">' + esc(t(UI.comp_plan_k)) + '</span>' +
        planBody +
        '<span class="chips">' +
          chips +
          (c.budget ? '<span class="chip num">' + txt(c.budget) + '</span>' : '') +
          (past
            ? '<span class="chip ghost">' + esc(ui('cnew_past', PAST_LBL)) + '</span>'
            : (seatLbl ? '<span class="chip' + (full ? ' ghost' : ' lime') + '">' +
                esc(seatLbl) + '</span>' : '')) +
        '</span>' +
      '</div>' +

      /* 호스트 카드는 샘플에만. 내 계획에서는 내 이름·언어가 위 statline 과 겹친다.
         제목은 comp_who_k('이런 분에게')가 아니라 호스트 소개 문구를 쓴다. */
      (mine ? '' :
        '<div class="c-who">' +
          '<span class="k">' + esc(ui('cnew_host_k', HOST_K)) + '</span>' +
          '<p>' + who.join(' · ') + '</p>' +
          '<span class="chips">' +
            '<span class="chip">' + esc(t(UI.comp_langs)) + ' ' + langs + '</span>' +
          '</span>' +
        '</div>') +

      /* 안전 안내는 참가/삭제 버튼 **위**에 둔다 — 아래 두면 결정한 뒤에나 읽힌다 */
      safety +
      action +
    '</div>' +

    footerHTML();
}


/* 'companions/new' — 내 계획 올리기 폼.
   state.formErrors : 스토어가 돌려준 에러 키 배열 → 폼 위 .form-errors 로 목록화
   state.formDraft  : 제출했던 입력값 → 필드에 복원(전부 esc)
   연락처 필드는 일부러 없다. 검증 규칙의 원본은 companion-store.js 이고,
   여기의 required / maxlength / min 은 먼저 걸러주는 네이티브 안내일 뿐이다. */
function companionNewHTML() {

  function fill(tpl, token, value) {
    return String(tpl || '').replace(token, function () { return String(value); });
  }
  function str(v) {
    return (typeof v === 'string' || typeof v === 'number') ? String(v) : '';
  }
  function inList(arr, v) {
    return Array.isArray(arr) && arr.indexOf(v) !== -1;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var PLUS =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="3" stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 5v14M5 12h14"></path></svg>';
  var DEVICE =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="7" y="2.5" width="10" height="19" rx="2.5"></rect><path d="M11 18.5h2"></path></svg>';
  var SHIELD =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z"></path>' +
    '<path d="M9.5 9.5l5 5M14.5 9.5l-5 5"></path></svg>';

  var ERR_KEYS = ['limit', 'storage', 'contact', 'district', 'date', 'time', 'title',
                  'plan', 'styles', 'langs', 'seats', 'budget', 'name', 'safety'];
  /* 에러 키 → 그 에러를 고치는 요소의 id. 요약 목록에서 여기로 바로 이동한다.
     limit·storage 는 고칠 필드가 없어 이동 버튼을 만들지 않는다.
     contact 는 제목·설명·이름 세 곳이 대상이라 첫 필드로 보낸다. */
  var ERR_TARGET = {
    district: 'cn-district', date: 'cn-date', time: 'cn-time',
    title: 'cn-title', plan: 'cn-plan', styles: 'cn-styles', langs: 'cn-langs',
    seats: 'cn-seats', budget: 'cn-budget', name: 'cn-name', safety: 'cn-safety',
    contact: 'cn-title'
  };
  var CONTACT_FIELDS = ['title', 'plan', 'name'];
  var LANG_CODES = ['EN', 'JA', 'ZH', 'KO'];
  var BUDGETS = [
    { v: '₩',   k: 'cnew_b1' },
    { v: '₩₩',  k: 'cnew_b2' },
    { v: '₩₩₩', k: 'cnew_b3' }
  ];
  var MAX_PLANS = 10;

  var DISTS  = (typeof DISTRICTS   !== 'undefined' && DISTRICTS)   ? DISTRICTS   : [];
  var STYLES = (typeof COMP_STYLES !== 'undefined' && COMP_STYLES) ? COMP_STYLES : {};
  var LANGLIST = (typeof LANGS     !== 'undefined' && LANGS)       ? LANGS       : [];

  var st = (typeof state !== 'undefined' && state) ? state : {};
  var raw = Array.isArray(st.formErrors) ? st.formErrors : [];
  /* 표시 순서는 ERR_KEYS 순서로 고정, 모르는 키는 버린다 */
  var errors = ERR_KEYS.filter(function (k) { return raw.indexOf(k) !== -1; });
  var draft = (st.formDraft && typeof st.formDraft === 'object') ? st.formDraft : null;
  var d = draft || {};

  function bad(k) { return errors.indexOf(k) !== -1; }
  /* 연락처 에러는 제목·설명·이름 중 어디가 문제인지 스토어가 구분하지 않는다 —
     세 필드 모두에 표시하고, 설명도 세 곳 모두에 붙인다. */
  function badField(k) {
    return bad(k) || (bad('contact') && CONTACT_FIELDS.indexOf(k) !== -1);
  }
  function inv(k) { return badField(k) ? ' aria-invalid="true"' : ''; }
  /* 에러 메시지(요약 목록의 항목)를 힌트보다 **먼저** 읽게 붙인다 */
  function describedBy(k, rest) {
    var ids = [];
    if (bad(k)) ids.push('cn-err-' + k);
    if (bad('contact') && CONTACT_FIELDS.indexOf(k) !== -1) ids.push('cn-err-contact');
    if (rest && rest.length) ids = ids.concat(rest);
    return ids.length ? ' aria-describedby="' + ids.join(' ') + '"' : '';
  }
  /* 체크박스·라디오 묶음은 fieldset 링만으로는 보조기기에 전달되지 않는다 —
     묶음 안 입력 하나하나에 상태와 설명을 건다. */
  function groupAttr(k) {
    return bad(k) ? ' aria-invalid="true" aria-describedby="cn-err-' + k + '"' : '';
  }

  /* i18n 폴백 — i18n.js 에 같은 키가 생기면 자동으로 그쪽을 쓴다 */
  function ui(key, local) {
    return t((typeof UI !== 'undefined' && UI && UI[key]) ? UI[key] : local);
  }
  /* 낯선 사람과 만나는 계획이고 술이 있는 일정도 있다 — 나이 값은 받지 않고 동의만 받는다 */
  var ADULT = {
    en: 'I’m 18 or older, and 19 or older for any plan with alcohol, as Korean law requires.',
    ja: '18歳以上です。お酒のあるプランの場合は、韓国の法律に合わせて19歳以上です。',
    zh: '我已年满18岁；若行程中有酒，也已达到韩国法律要求的19岁。',
    ko: '만 18세 이상이고, 술이 있는 일정이라면 한국 법 기준 만 19세 이상이에요.'
  };

  /* 기기 로컬 기준 오늘 — UTC 로 자르면 한국 오전에 어제가 된다 */
  var now = new Date();
  var today = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());

  var mineCount = (typeof golmokLoadMyPlans === 'function') ? golmokLoadMyPlans().length : 0;
  var atLimit = mineCount >= MAX_PLANS;

  /* ---- 에러 박스 ----
     role="alert" 은 빼둔다 — app.js 가 여기로 포커스를 옮기기 때문에, 살아 있는 영역이면
     NVDA/VoiceOver 가 제목을 두 번 읽는다. 이동은 tabindex="-1" + focusQuiet 로 충분하다.
     항목마다 id(cn-err-*)를 두고 그 id 를 해당 입력의 aria-describedby 로 연결한다.
     id 는 <li> 가 아니라 안쪽 요소에 건다 — 이동 버튼의 이름이 곧 설명이 된다. */
  var errBox = errors.length
    ? '<div class="form-errors" tabindex="-1" aria-labelledby="cn-err-h">' +
        '<p class="k" id="cn-err-h">' + esc(t(UI.cnew_errs_head)) + '</p>' +
        '<ul>' + errors.map(function (k) {
          var msg = UI['cnew_err_' + k];
          if (!msg) return '';
          var label = esc(t(msg));
          var target = ERR_TARGET[k];
          /* 페이지 내 이동은 해시 링크가 아니라 data-scroll — hash 모드에선 라우터가 먹고,
             path 모드에선 <base> 때문에 사이트 루트로 튄다 */
          return '<li>' + (target
            ? '<button type="button" id="cn-err-' + k + '" data-scroll="' + target + '">' +
                '<u>' + label + '</u></button>'
            : '<span id="cn-err-' + k + '">' + label + '</span>') + '</li>';
        }).join('') + '</ul>' +
      '</div>'
    : '';

  /* ---- 필드 조각 ---- */
  var districtOpts = '<option value="">' + esc(t(UI.cnew_f_district_ph)) + '</option>' +
    DISTS.map(function (x) {
      return '<option value="' + esc(x.id) + '"' + (str(d.district) === x.id ? ' selected' : '') + '>' +
        esc(t(x.name)) + '</option>';
    }).join('');

  var styleOpts = Object.keys(STYLES).map(function (k) {
    return '<label class="cnew-opt">' +
      '<input type="checkbox" name="styles" value="' + esc(k) + '"' +
        (inList(d.styles, k) ? ' checked' : '') + groupAttr('styles') + '>' +
      '<span>' + esc(t(STYLES[k].label)) + '</span>' +
    '</label>';
  }).join('');

  var langOpts = LANG_CODES.map(function (code) {
    var meta = LANGLIST.filter(function (l) { return l && l.code === code.toLowerCase(); })[0];
    var name = meta ? meta.label : code;
    return '<label class="cnew-opt">' +
      '<input type="checkbox" name="langs" value="' + code + '"' +
        (inList(d.langs, code) ? ' checked' : '') + groupAttr('langs') + '>' +
      '<span lang="' + code.toLowerCase() + '">' + esc(name) + '</span>' +
    '</label>';
  }).join('');

  /* 인원은 초안이 없을 때만 3명을 기본값으로 둔다 */
  var seatsVal = draft ? str(d.seats) : '3';
  var seatOpts = [2, 3, 4, 5, 6].map(function (n) {
    return '<option value="' + n + '"' + (seatsVal === String(n) ? ' selected' : '') + '>' +
      esc(fill(t(UI.cnew_seats_opt), '{n}', n)) + '</option>';
  }).join('');

  var budgetOpts = BUDGETS.map(function (b) {
    return '<label class="cnew-opt">' +
      '<input type="radio" name="budget" value="' + esc(b.v) + '" required' +
        (str(d.budget) === b.v ? ' checked' : '') + groupAttr('budget') + '>' +
      '<span><b class="num">' + esc(b.v) + '</b> ' + esc(t(UI[b.k])) + '</span>' +
    '</label>';
  }).join('');

  var safetyTips =
    '<div class="safety">' +
      '<span class="k">' + esc(t(UI.comp_safety_k)) + '</span>' +
      '<ul>' +
        '<li>' + esc(t(UI.comp_safety_1)) + '</li>' +
        '<li>' + esc(t(UI.comp_safety_2)) + '</li>' +
        '<li>' + esc(t(UI.comp_safety_3)) + '</li>' +
        '<li>' + esc(t(UI.cnew_safety_4)) + '</li>' +
        '<li>' + esc(t(UI.cnew_safety_5)) + '</li>' +
      '</ul>' +
    '</div>';

  var safetyChecked = d.safety === true || d.safety === '1' || d.safety === 'on';

  var form =
    '<form id="comp-new-form" class="p-form cnew-form" aria-labelledby="cn-h">' +

      /* 1. 어디서, 언제 */
      '<fieldset class="cnew-sec">' +
        '<legend class="cnew-k">' + esc(t(UI.cnew_sec_when)) + '</legend>' +
        '<div class="row">' +
          '<div>' +
            '<label for="cn-district">' + esc(t(UI.cnew_f_district)) + '</label>' +
            '<select id="cn-district" name="district" required' +
              inv('district') + describedBy('district') + '>' +
              districtOpts + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="row two">' +
          '<div>' +
            '<label for="cn-date">' + esc(t(UI.cnew_f_date)) + '</label>' +
            '<input id="cn-date" name="date" type="date" required min="' + today + '"' +
              ' value="' + esc(str(d.date)) + '"' + inv('date') + describedBy('date') + '>' +
          '</div>' +
          '<div>' +
            '<label for="cn-time">' + esc(t(UI.cnew_f_time)) + '</label>' +
            '<input id="cn-time" name="time" type="time" required' +
              ' value="' + esc(str(d.time)) + '"' + inv('time') + describedBy('time') + '>' +
          '</div>' +
        '</div>' +
      '</fieldset>' +

      /* 2. 무엇을 */
      '<fieldset class="cnew-sec">' +
        '<legend class="cnew-k">' + esc(t(UI.cnew_sec_plan)) + '</legend>' +
        '<div class="row">' +
          '<div>' +
            '<label for="cn-title">' + esc(t(UI.cnew_f_title)) + '</label>' +
            '<input id="cn-title" name="title" type="text" required maxlength="60" autocomplete="off"' +
              ' placeholder="' + esc(t(UI.cnew_f_title_ph)) + '"' +
              describedBy('title', ['cn-title-hint', 'cn-nocontact']) +
              ' value="' + esc(str(d.title)) + '"' + inv('title') + '>' +
            '<p class="cnew-hint" id="cn-title-hint">' +
              esc(fill(t(UI.cnew_f_max), '{n}', 60)) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div>' +
            '<label for="cn-plan">' + esc(t(UI.cnew_f_plan)) + '</label>' +
            '<textarea id="cn-plan" name="plan" required maxlength="280" rows="4"' +
              ' placeholder="' + esc(t(UI.cnew_f_plan_ph)) + '"' +
              describedBy('plan', ['cn-plan-hint', 'cn-nocontact']) + inv('plan') + '>' +
              esc(str(d.plan)) + '</textarea>' +
            '<p class="cnew-hint" id="cn-plan-hint">' +
              esc(fill(t(UI.cnew_f_max), '{n}', 280)) + '</p>' +
          '</div>' +
        '</div>' +
      '</fieldset>' +

      /* 3. 어떤 동행으로 */
      '<fieldset class="cnew-sec">' +
        '<legend class="cnew-k">' + esc(t(UI.cnew_sec_group)) + '</legend>' +
        '<fieldset id="cn-styles" class="cnew-field' + (bad('styles') ? ' cnew-invalid' : '') + '">' +
          '<legend>' + esc(t(UI.cnew_f_styles)) + '</legend>' +
          '<div class="cnew-opts">' + styleOpts + '</div>' +
        '</fieldset>' +
        '<fieldset id="cn-langs" class="cnew-field' + (bad('langs') ? ' cnew-invalid' : '') + '">' +
          '<legend>' + esc(t(UI.cnew_f_langs)) + '</legend>' +
          '<div class="cnew-opts">' + langOpts + '</div>' +
        '</fieldset>' +
        '<div class="row">' +
          '<div>' +
            '<label for="cn-seats">' + esc(t(UI.cnew_f_seats)) + '</label>' +
            '<select id="cn-seats" name="seats" required' +
              inv('seats') + describedBy('seats') + '>' +
              (seatsVal ? '' : '<option value="">-</option>') +
              seatOpts + '</select>' +
          '</div>' +
        '</div>' +
        '<fieldset id="cn-budget" class="cnew-field' + (bad('budget') ? ' cnew-invalid' : '') + '">' +
          '<legend>' + esc(t(UI.cnew_f_budget)) + '</legend>' +
          '<div class="cnew-opts">' + budgetOpts + '</div>' +
        '</fieldset>' +
      '</fieldset>' +

      /* 4. 나에 대해 — 이름만. 연락처 필드는 만들지 않는다 */
      '<fieldset class="cnew-sec">' +
        '<legend class="cnew-k">' + esc(t(UI.cnew_sec_you)) + '</legend>' +
        '<div class="row">' +
          '<div>' +
            '<label for="cn-name">' + esc(t(UI.cnew_f_name)) + '</label>' +
            '<input id="cn-name" name="name" type="text" required maxlength="20" autocomplete="given-name"' +
              describedBy('name', ['cn-name-hint', 'cn-nocontact']) +
              ' value="' + esc(str(d.name)) + '"' + inv('name') + '>' +
            '<p class="cnew-hint" id="cn-name-hint">' + esc(t(UI.cnew_f_name_hint)) + '</p>' +
          '</div>' +
        '</div>' +
      '</fieldset>' +

      /* 제출 전: 연락처 금지 안내 → 안전 수칙 → 동의 체크 → 저장 */
      '<div class="cnew-nocontact' + (bad('contact') ? ' cnew-invalid' : '') + '" id="cn-nocontact">' +
        SHIELD + '<p>' + esc(t(UI.cnew_no_contact)) + '</p></div>' +
      safetyTips +
      /* 하나의 필수 체크가 안전 수칙 확인 + 성인 확인을 함께 받는다.
         나이 값 자체는 받지 않는다(개인정보 최소화) — 동의만 받는다. */
      '<label class="cnew-agree' + (bad('safety') ? ' cnew-invalid' : '') + '">' +
        '<input id="cn-safety" type="checkbox" name="safety" value="1" required' +
          (safetyChecked ? ' checked' : '') + inv('safety') + describedBy('safety') + '>' +
        /* 일본어·중국어는 문장 사이에 빈칸을 두지 않는다 */
        '<span>' + esc(t(UI.cnew_f_safety)) +
          ((st.lang === 'ja' || st.lang === 'zh') ? '' : ' ') +
          esc(ui('cnew_f_adult', ADULT)) + '</span>' +
      '</label>' +
      '<button type="submit" class="btn btn-primary"' +
        (atLimit ? ' disabled aria-disabled="true" aria-describedby="cn-limit"' : '') + '>' +
        esc(t(UI.cnew_submit)) + '</button>' +
      '<p class="note">' + esc(t(UI.cnew_submit_note)) + '</p>' +
    '</form>';

  return '' +
    '<div class="wrap">' +
      '<a class="back" href="' + esc(golmokHref('companions')) + '">← ' + esc(t(UI.comp_back)) + '</a>' +

      '<div class="cnew-head">' +
        '<p class="kicker">' + PLUS + esc(t(UI.cnew_new_k)) + '</p>' +
        '<h1 id="cn-h">' + esc(t(UI.cnew_new_t)) + '</h1>' +
        '<p class="sub">' + esc(t(UI.cnew_new_sub)) + '</p>' +
        '<p class="cnew-device">' + DEVICE +
          '<span>' + esc(t(UI.cnew_device_note)) + '</span></p>' +
      '</div>' +

      (atLimit
        ? '<p class="lite-note" id="cn-limit">' + esc(t(UI.cnew_err_limit)) + '</p>'
        : '') +
      errBox +
      form +
    '</div>' +

    footerHTML();
}
