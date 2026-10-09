/* Golmok — 가이드 뷰 (상권 상세 / 가게 상세)
   전역 function 두 개만 노출한다: districtHTML(d), spotHTML(d, s)

   이 파일은 로드 시점에 전역을 읽지 않는다. t() / esc() / state / CODES /
   badgeHTML() / footerHTML() / naverMapUrl() / googleMapUrl() 는 전부
   app.js 가 정의하며, 아래 함수가 호출될 때(런타임)에만 참조된다.
   golmokIsSaved() 는 js/saved-store.js 가 정의한다(역시 런타임에만 참조).

   마크업 규칙: css/style.css("CORAL FIELD" 디자인 시스템)에 정의된 클래스만 사용.
   인라인 style 금지 · 이모지 금지(인라인 SVG만) · 모든 데이터 문자열 esc().

   카드는 진짜 링크(<a href>)다
   - 가게 카드(.spot)·옆 가게 카드(.sib-card)는 golmokHref('s/{상권}/{가게}') 로 만든 <a> 다.
     버튼이면 미리렌더한 가게 페이지에 닿는 본문 링크가 없어 검색엔진이 sitemap 으로만 찾고,
     사람도 새 탭 열기·길게 눌러 링크 복사를 못 한다. 이동은 app.js 의 링크 가로채기가 맡는다
     (보통 클릭은 golmokNav, ctrl/cmd·가운데 버튼은 브라우저 몫).
   - data-spot 은 이동에 쓰이지 않는다(링크가 먼저 처리된다). 카드를 찾는 표식으로만 남겨 둔다.

   가게 이름은 화면 언어로 — golmokSpotName(s, d, lang) (app.js). ko 는 한글 상호, ja/zh 는 현지 표기.
   한글 보조 표기(.ko-name · .hangul-big)는 표시 이름에 이미 들어 있으면(ko 화면) 되풀이하지 않는다.

   저장(하트) 토글
   - 링크 안에 버튼을 넣으면 중첩 인터랙티브(무효 HTML)가 된다. 그래서 <div class="spot-wrap"> 로
     감싸고 하트 버튼을 카드 링크의 **형제**로 둔다.
   - 하트 버튼의 aria-label 은 상태와 무관하게 "{가게명} 저장"으로 고정하고, 상태는
     aria-pressed 가 전한다(WAI-ARIA APG: 토글 버튼의 이름은 상태에 따라 바꾸지 않는다). */

/* ============================================================
   상권 상세 — 'd/{districtId}'
   ============================================================ */
function districtHTML(d) {
  /* 가게 이름(화면 언어) — 이스케이프 전 텍스트. golmokSpotName 이 없는 옛 번들에서는 s.name */
  function spotName(s) {
    if (typeof golmokSpotName === 'function') return String(golmokSpotName(s, d, state.lang) || '');
    return String(s.name || '');
  }
  /* 한글 보조 표기 — 표시 이름에 이미 들어 있으면 '' (ko 화면에서 같은 글자를 두 번 쓰지 않게) */
  function koAside(s, shown) {
    var ko = String(s.ko || '');
    return (!ko || shown.indexOf(ko) !== -1) ? '' : ko;
  }

  /* 하트 아이콘 (로컬 — 전역 노출 없음). 저장 상태면 채움, 아니면 외곽선. */
  function heart(filled) {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.6-4.6-9.4-9.6C1.5 7.4 3.5 4 7 4c2.1 0 3.8 1.1 5 2.9C13.2 5.1 14.9 4 17 4c3.5 0 5.5 3.4 4.4 6.7-1.8 5-9.4 9.6-9.4 9.6z"></path></svg>';
  }
  /* 저장 목록은 렌더마다 한 번만 읽는다(가게마다 localStorage 를 다시 파싱하지 않게). */
  var savedSet = Object.create(null);
  if (typeof golmokSavedKeys === 'function') {
    golmokSavedKeys().forEach(function (k) { savedSet[k] = true; });
  }
  function isSaved(key) {
    return savedSet[key] === true;
  }

  var spots = d.spots || [];
  var route = d.route || [];
  var filter = state.filter || 'all';
  var filtered = filter === 'all'
    ? spots
    : spots.filter(function (s) { return (s.badges || []).indexOf(filter) !== -1; });

  var routeHTML = !route.length ? '' :
    '<div class="route">' +
      '<p class="k">' + esc(t(UI.route_k)) + '</p>' +
      '<ol>' + route.map(function (r, i) {
        return '<li>' +
          '<span class="n num">' + (i + 1) + '</span>' +
          '<div class="t"><span class="time num">' + esc(r.time) + '</span>' + esc(t(r.t)) + '</div>' +
          '<div class="d">' + esc(t(r.d)) + '</div>' +
        '</li>';
      }).join('') + '</ol>' +
    '</div>';

  var filterHTML = '<div class="filters" role="group" aria-label="' + esc(t(UI.spots_k)) + '">' +
    '<button type="button" data-filter="all" aria-pressed="' + (filter === 'all') + '">' +
      esc(t(UI.f_all)) +
    '</button>' +
    FILTERS.map(function (f) {
      var b = BADGES[f];
      if (!b) return '';
      return '<button type="button" data-filter="' + esc(f) + '" aria-pressed="' + (filter === f) + '">' +
        esc(t(b.label)) +
      '</button>';
    }).join('') +
  '</div>';

  var spotsHTML = !filtered.length
    ? '<p class="empty-note">' + esc(t(UI.no_match)) + '</p>'
    : '<div class="spots">' + filtered.map(function (s) {
        var key = d.id + '/' + s.id;
        var saved = isSaved(key);
        var name = spotName(s);
        var ko = koAside(s, name);
        /* 카드 링크와 하트 버튼은 형제다 — 링크 안에 버튼을 넣지 않는다. */
        return '<div class="spot-wrap">' +
          '<a class="spot" href="' + esc(golmokHref('s/' + d.id + '/' + s.id)) + '" data-spot="' + esc(key) + '">' +
            /* h3·p 를 담는 칸은 div — span(구문 콘텐츠) 안에 h3·p 를 넣으면 무효 HTML 이다.
               둘 다 .spot(flex 세로) 의 항목이라 span 이든 div 든 블록으로 놓인다 */
            '<div class="top">' +
              '<h3>' + esc(name) + (ko ? '<span class="ko-name" lang="ko">' + esc(ko) + '</span>' : '') + '</h3>' +
              '<span class="price num">' + esc(s.price) + '</span>' +
            '</div>' +
            '<span class="cat">' + esc(t(s.cat)) + '</span>' +
            '<span class="badges">' + (s.badges || []).map(badgeHTML).join('') + '</span>' +
            '<div class="tipbox">' +
              '<span class="lbl">' + esc(t(UI.tip_k)) + '</span>' +
              '<p>' + esc(t(s.tip)) + '</p>' +
            '</div>' +
            '<span class="go">' + esc(t(UI.details)) + ' &rarr;</span>' +
          '</a>' +
          '<button class="save-toggle" type="button" data-save="' + esc(key) + '"' +
            ' aria-pressed="' + saved + '"' +
            ' aria-label="' + esc(String(t(UI.spot_save_aria) || '').replace('{name}', function () { return name; })) + '">' +
            heart(saved) +
          '</button>' +
        '</div>';
      }).join('') + '</div>';

  return '' +
  '<div class="wrap">' +
    '<a class="back" href="' + esc(golmokHref('')) + '">&larr; ' + esc(t(UI.back)) + '</a>' +

    '<div class="d-head">' +
      '<div class="top">' +
        '<span class="sq sq-' + esc(d.id) + '">' + esc(CODES[d.id] || '') + '</span>' +
        '<div>' +
          '<div class="region">' + esc(t(d.region)) + '</div>' +
          '<h1>' + esc(t(d.name)) + '</h1>' +
          /* ko 화면은 h1 이 이미 한글이라 보조 표기를 되풀이하지 않는다 */
          (state.lang === 'ko' ? '' : '<div class="hangul" lang="ko">' + esc(d.hangul) + '</div>') +
        '</div>' +
      '</div>' +
      '<p class="tagline">' + esc(t(d.tagline)) + '</p>' +
      '<div class="statline">' +
        '<div class="stat"><span class="lbl">' + esc(t(UI.st_station)) + '</span><b>' + esc(t(d.stats.station)) + '</b></div>' +
        '<div class="stat"><span class="lbl">' + esc(t(UI.st_walk)) + '</span><b>' + esc(t(d.stats.walk)) + '</b></div>' +
        '<div class="stat"><span class="lbl">' + esc(t(UI.st_best)) + '</span><b class="num">' + esc(t(d.stats.best)) + '</b></div>' +
      '</div>' +
    '</div>' +

    '<div class="story">' +
      '<p class="k">' + esc(t(UI.story_k)) + '</p>' +
      '<p>' + esc(t(d.story)) + '</p>' +
    '</div>' +

    routeHTML +
  '</div>' +

  '<section><div class="wrap">' +
    '<div class="sec-head"><h2>' + esc(t(UI.spots_k)) + '</h2></div>' +
    filterHTML +
    spotsHTML +
    (d.full ? '' : '<div class="lite-note">' + esc(t(UI.lite_note)) + '</div>') +
  '</div></section>' +

  footerHTML();
}

/* ============================================================
   가게 상세 — 's/{districtId}/{spotId}'
   ============================================================ */
function spotHTML(d, s) {
  var siblings = (d.spots || []).filter(function (x) { return x.id !== s.id; }).slice(0, 4);

  /* ---- 로컬 헬퍼 (전역 노출 없음) ---- */

  /* 가게 이름(화면 언어) — 이스케이프 전 텍스트. golmokSpotName 이 없는 옛 번들에서는 s.name.
     문서 제목(app.js docTitleFor)과 같은 함수라 <title> 과 h1 이 같은 언어·같은 표기가 된다. */
  function spotName(x) {
    if (typeof golmokSpotName === 'function') return String(golmokSpotName(x, d, state.lang) || '');
    return String(x.name || '');
  }
  /* 한글 보조 표기 — 표시 이름에 이미 들어 있으면 '' (ko 화면에서 같은 글자를 두 번 쓰지 않게) */
  function koAside(x, shown) {
    var ko = String(x.ko || '');
    return (!ko || shown.indexOf(ko) !== -1) ? '' : ko;
  }
  var name = spotName(s);
  var nameKo = koAside(s, name);

  /* 'YYYY-MM' (또는 'YYYY-MM-DD') → {y, mo}. 형식이 틀리면 null → "확인 전"으로 처리. */
  function parseMonth(ym) {
    var m = String(ym || '').match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
    if (!m) return null;
    var mo = parseInt(m[2], 10);
    if (!(mo >= 1 && mo <= 12)) return null;
    return { y: m[1], mo: mo };
  }
  /* <time datetime> 용 정규형 'YYYY-MM' ('2026-9' 같은 입력도 '2026-09' 로) */
  function monthISO(ym) {
    var p = parseMonth(ym);
    return p ? p.y + '-' + (p.mo < 10 ? '0' : '') + p.mo : '';
  }
  /* 언어별 월 표기: en 'Sep 2026' / ja·zh '2026年9月' / ko '2026년 9월' */
  function monthLabel(ym) {
    var p = parseMonth(ym);
    if (!p) return '';
    var y = p.y;
    var mo = p.mo;
    var lang = (typeof state !== 'undefined' && state && state.lang) || 'en';
    if (lang === 'ja' || lang === 'zh') return y + '年' + mo + '月';
    if (lang === 'ko') return y + '년 ' + mo + '월';
    var EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return EN[mo - 1] + ' ' + y;
  }

  function heart(filled) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.6-4.6-9.4-9.6C1.5 7.4 3.5 4 7 4c2.1 0 3.8 1.1 5 2.9C13.2 5.1 14.9 4 17 4c3.5 0 5.5 3.4 4.4 6.7-1.8 5-9.4 9.6-9.4 9.6z"></path></svg>';
  }

  var saveKey = d.id + '/' + s.id;
  var saved = typeof golmokIsSaved === 'function' && golmokIsSaved(saveKey);

  /* 정보 확인 시점 — s.checked('2026-09')는 웹 근거로 확인한 달이다. 없으면 확인 전이라고 말한다. */
  var checkedLabel = monthLabel(s.checked);
  var icCheck = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M8 12.3l2.6 2.6L16.2 9.3"></path></svg>';
  var icInfo = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5.5M12 7.6v.1"></path></svg>';
  var checkedHTML = checkedLabel
    ? '<p class="s-checked">' + icCheck +
        '<span>' +
          esc(t(UI.spot_checked)).replace('{date}', function () {
            return '<time datetime="' + esc(monthISO(s.checked)) + '">' + esc(checkedLabel) + '</time>';
          }) +
          ' &middot; ' + esc(t(UI.spot_verify_hours)) +
        '</span>' +
      '</p>'
    : '<p class="s-checked warn">' + icInfo +
        '<span>' + esc(t(UI.spot_unchecked)) + '</span>' +
      '</p>';

  /* 인라인 SVG 아이콘 (이모지 금지) */
  var icPin = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"></path><circle cx="12" cy="10" r="2.6"></circle></svg>';
  var icGlobe = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3.4 12h17.2M12 3c2.4 2.6 3.7 5.7 3.7 9s-1.3 6.4-3.7 9c-2.4-2.6-3.7-5.7-3.7-9S9.6 5.6 12 3z"></path></svg>';
  var icShare = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7h16v-7M12 3v13M8 7l4-4 4 4"></path></svg>';

  var siblingHTML = !siblings.length ? '' :
    '<div class="sec-head"><h2>' + esc(t(UI.more_in)) + '</h2></div>' +
    '<div class="sibling">' + siblings.map(function (x) {
      var xn = spotName(x);
      var xk = koAside(x, xn);
      /* 진짜 링크 — 가게 페이지끼리 서로 이어져야 검색엔진이 링크로 찾는다(새 탭·링크 복사도 된다) */
      return '<a class="sib-card" href="' + esc(golmokHref('s/' + d.id + '/' + x.id)) + '" data-spot="' + esc(d.id) + '/' + esc(x.id) + '">' +
        '<span class="n">' + esc(xn) + (xk ? ' <span class="ko-name" lang="ko">' + esc(xk) + '</span>' : '') + '</span>' +
        '<span class="c">' + esc(t(x.cat)) + ' &middot; ' + esc(x.price) + '</span>' +
      '</a>';
    }).join('') + '</div>';

  return '' +
  '<div class="wrap">' +
    '<a class="back" href="' + esc(golmokHref('d/' + d.id)) + '">&larr; ' + esc(t(UI.back_district)) + ' ' + esc(t(d.name)) + '</a>' +

    '<div class="s-hero">' +
      '<div class="cat-row">' +
        '<span class="cat">' + esc(t(s.cat)) + '</span>' +
        '<span class="price num">' + esc(s.price) + '</span>' +
      '</div>' +
      '<h1>' + esc(name) + '</h1>' +
      (nameKo ? '<div class="hangul-big" lang="ko">' + esc(nameKo) + '</div>' : '') +
      '<div class="badges">' + (s.badges || []).map(badgeHTML).join('') + '</div>' +
      '<div class="s-actions">' +
        '<a class="btn btn-primary" href="' + esc(naverMapUrl(s, d)) + '" target="_blank" rel="noopener" data-track="map_naver">' +
          icPin + esc(t(UI.map_naver)) +
        '</a>' +
        '<button class="btn btn-ghost small save-btn" type="button" data-save="' + esc(saveKey) + '" aria-pressed="' + saved + '">' +
          heart(saved) + esc(t(saved ? UI.spot_saved : UI.spot_save)) +
        '</button>' +
        '<a class="btn btn-ghost small" href="' + esc(googleMapUrl(s, d)) + '" target="_blank" rel="noopener" data-track="map_google">' +
          icGlobe + esc(t(UI.map_google)) +
        '</a>' +
        '<button class="btn btn-ghost small" type="button" data-share="1">' +
          icShare + esc(t(UI.share)) +
        '</button>' +
      '</div>' +
    '</div>' +

    checkedHTML +

    '<div class="s-body">' +
      '<div class="s-col">' +
        '<div class="s-card">' +
          '<span class="lbl">' + esc(t(UI.tip_k)) + '</span>' +
          '<p>' + esc(t(s.tip)) + '</p>' +
        '</div>' +
        '<div class="s-card">' +
          '<span class="lbl">' + esc(t(UI.order_k)) + '</span>' +
          '<p>' + esc(t(s.order)) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="s-col">' +
        '<div class="s-card show-local">' +
          '<span class="lbl">' + esc(t(UI.show_local_k)) + '</span>' +
          '<div class="pre">' + esc(t(UI.show_local_pre)) + '</div>' +
          '<div class="big-ko">' + esc(s.ko) + '</div>' +
          '<div class="area">' + esc(d.mapArea) + ' &middot; ' + esc(t(d.stats.station)) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    siblingHTML +
  '</div>' +

  footerHTML();
}
