/* 홈 화면 뷰 — 전역 homeHTML() 하나만 노출하는 순수 함수(HTML 문자열만 반환). */

function homeHTML() {

  /* ---------- 로컬 헬퍼 (전역 오염 없음) ---------- */

  /* esc() 를 통과한 문자열에서만 호출한다.
     |단어| 파이프 마커를 히어로 라임 형광펜(.hero h1 mark)으로 바꾼다. */
  function markPipes(escaped) {
    return escaped.replace(/\|([^|]+)\|/g, '<mark>$1</mark>');
  }

  /* 검색용 건초더미: id · 한글 타일 · 이름(영문/현지) · 태그라인 · 태그 */
  function hay(d) {
    var parts = [d.id, d.tile, d.hangul, (d.name && d.name.en), t(d.name), t(d.tagline)];
    var tagsNow = t(d.tags);
    if (tagsNow && tagsNow.join) parts = parts.concat(tagsNow);
    if (d.tags && d.tags.en && d.tags.en.join) parts = parts.concat(d.tags.en);
    return parts.filter(function (x) { return !!x; }).join(' ').toLowerCase();
  }

  function code(d) {
    return CODES[d.id] || String(d.id).slice(0, 2).toUpperCase();
  }

  var ICON_SEARCH =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>';

  var ICON_CHEV =
    '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 6l6 6-6 6"></path></svg>';

  /* 문자열이거나 {en,ja,zh,ko} 객체일 수 있는 데이터 값 → 이스케이프된 문자열 */
  function txt(v) {
    return esc(v && typeof v === 'object' ? t(v) : v);
  }

  /* ---------- 1-b. 데스크톱 히어로 프리뷰 ----------
     ≥1024px 에서만 보이는 장식(aria-hidden). CSS 기본값이 display:none 이라
     폰·태블릿 첫 화면에는 레이아웃상 존재하지 않는다.
     가짜 문구를 쓰지 않고 실제 데이터로 만든다:
       (a) 첫 번째 풀 가이드 상권의 첫 가게 — 이름·한글명·배지 2개
       (b) 아래 '동행 카드 규칙'을 통과한 샘플 동행 1개, 없으면 다른 상권의 실제 가게 1개
       (c) "현지인에게 보여주세요" — (a) 가게의 한글명을 크게
     포커스 가능한 요소·링크·data-* 이동 속성을 넣지 않는다
     (보조기기에서 숨긴 영역이 클릭·탭 이동 대상이 되면 안 된다).

     동행 카드 규칙 — aria-hidden 이어도 크롤러는 이 글자를 색인한다:
       · 동행은 전부 가상 인물 샘플이므로 SAMPLE 칩(UI.sample)을 반드시 단다.
       · 날짜가 지난 샘플은 쓰지 않는다('자리 남음'이 상세 화면의 '지난 일정'과 어긋난다).
       · 정적 HTML 로 굳는 환경(빌드 미리렌더·테스트 렌더)에서는 그리지 않는다 — 빌드한 날엔 다가오는
         일정이어도 배포 뒤 날짜가 지나면 색인된 페이지가 계속 '자리 남음'이라고 말하게 되고,
         같은 입력이면 같은 바이트를 내야 하는 빌드가 날짜에 따라 달라진다.
         설치 안내(install.js)와 같은 판단 기준: 서비스워커가 없는 환경 = 굳는 환경. */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayLocal() {
    var n = new Date();
    return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate());
  }
  /* 'YYYY-MM-DD' 이고 오늘(기기 로컬)이거나 그 뒤일 때만 참 — 동행 목록·상세의 '지난 일정'(date < 오늘)과 같은 경계.
     형식이 다르면 '자리 남음'을 말할 근거가 없다. */
  function isUpcoming(w) {
    var v = w && w.date;
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayLocal();
  }
  function frozenRender() {
    try {
      if (typeof navigator === 'undefined' || !navigator) return true;
      if (/GolmokPrerender/i.test(String(navigator.userAgent || ''))) return true;   /* scripts/build.mjs */
      return !('serviceWorker' in navigator);
    } catch (e) { return true; }
  }

  /* 가게 이름(화면 언어) — 이스케이프 전 텍스트. golmokSpotName(app.js)이 없는 옛 번들에서는 s.name */
  function spotName(s, d) {
    if (typeof golmokSpotName === 'function') return String(golmokSpotName(s, d, state.lang) || '');
    return String((s && s.name) || '');
  }

  function spotPreviewHTML(d, s, slot) {
    var name = spotName(s, d);
    /* 한글명 줄은 표시 이름에 이미 들어 있으면(ko 화면) 되풀이하지 않는다 */
    var ko = (s.ko && name.indexOf(String(s.ko)) === -1) ? s.ko : '';
    var badges = (s.badges || []).filter(function (id) {
      return typeof BADGES !== 'undefined' && BADGES && BADGES[id];
    }).slice(0, 2).map(badgeHTML).join('');
    var cat = txt(s.cat);
    return '<div class="pv-card ' + slot + '">' +
        '<div class="pv-row">' +
          '<span class="sq sq-' + esc(d.id) + '">' + esc(code(d)) + '</span>' +
          '<div class="pv-id">' +
            '<div class="pv-name">' + esc(name) + '</div>' +
            (ko ? '<div class="pv-ko" lang="ko">' + txt(ko) + '</div>' : '') +
          '</div>' +
        '</div>' +
        (cat || s.price
          ? '<div class="pv-cat">' + cat +
              (cat && s.price ? ' · ' : '') +
              (s.price ? '<span class="num">' + txt(s.price) + '</span>' : '') +
            '</div>'
          : '') +
        (badges ? '<div class="badges">' + badges + '</div>' : '') +
      '</div>';
  }

  /* 샘플 동행 카드 — 규칙(위)을 통과한 것이 없으면 '' */
  function compPreviewHTML() {
    if (frozenRender()) return '';
    var comps = (typeof COMPANIONS !== 'undefined' && COMPANIONS && COMPANIONS.filter) ? COMPANIONS : [];
    var comp = comps.filter(function (c) { return c && isUpcoming(c.when); })[0];
    if (!comp) return '';

    var host = comp.host || {};
    var when = comp.when || {};
    var seats = comp.seats || {};
    var taken = Number(seats.taken) || 0;
    var total = Number(seats.total) || 0;
    var full = total > 0 && taken >= total;
    var seatLbl = total > 0
      ? String(t(full ? UI.comp_seats_full : UI.comp_seats) || '')
          .replace('{n}', String(Math.max(total - taken, 0)))
      : '';
    var whenLine = [txt(when.date), txt(when.time)]
      .filter(function (s) { return !!s; }).join(' · ');
    /* 목록·상세와 같은 아바타 색 = COMPANIONS 원본 순번.
       golmokAvatarClass 는 views-companion.js(뒤에 로드)에 있다 — 호출 시점에만 참조 */
    var av = (typeof golmokAvatarClass === 'function') ? golmokAvatarClass(comps.indexOf(comp)) : '';

    return '<div class="pv-card pv-comp">' +
        '<div class="pv-row">' +
          '<span class="avatar' + av + '">' + txt(host.initials) + '</span>' +
          '<div class="pv-id">' +
            '<div class="pv-title">' + txt(comp.title) + '</div>' +
            (whenLine ? '<div class="pv-when num">' + whenLine + '</div>' : '') +
          '</div>' +
        '</div>' +
        (seatLbl
          ? '<span class="pv-seats num' + (full ? ' full' : '') + '">' + esc(seatLbl) + '</span> '
          : '') +
        '<span class="tagchip">' + esc(t(UI.sample)) + '</span>' +
      '</div>';
  }

  function heroPreviewHTML() {
    var ds = (typeof DISTRICTS !== 'undefined' && DISTRICTS) ? DISTRICTS : [];
    var withSpots = ds.filter(function (d) { return d && d.spots && d.spots.length; });
    var fulls = withSpots.filter(function (d) { return d.full; });
    var dist = fulls[0] || withSpots[0] || null;
    var spot = dist ? dist.spots[0] : null;

    var cards = [];

    if (spot) cards.push(spotPreviewHTML(dist, spot, 'pv-spot'));

    /* (b) 자리: 샘플 동행이 없으면 다른 상권(풀 가이드 우선)의 첫 가게, 그것도 없으면 같은 상권의 두 번째 가게.
       .pv-comp 는 이 자리의 위치·기울기·떠다니는 움직임을 정하는 클래스라 가게 카드에도 그대로 쓴다
       (안쪽 .pv-row/.pv-name/.pv-cat/.badges 는 .pv-card 공용이라 모양이 같다). */
    var comp = compPreviewHTML();
    if (comp) {
      cards.push(comp);
    } else if (dist) {
      var others = fulls.concat(withSpots).filter(function (d) { return d !== dist; });
      if (others.length) cards.push(spotPreviewHTML(others[0], others[0].spots[0], 'pv-comp'));
      else if (dist.spots[1]) cards.push(spotPreviewHTML(dist, dist.spots[1], 'pv-comp'));
    }

    if (spot && spot.ko) {
      cards.push(
        '<div class="pv-card pv-local">' +
          '<div class="pv-lbl">' + esc(t(UI.show_local_k)) + '</div>' +
          '<div class="pv-big" lang="ko">' + txt(spot.ko) + '</div>' +
          (dist.mapArea ? '<div class="pv-area" lang="ko">' + txt(dist.mapArea) + '</div>' : '') +
        '</div>'
      );
    }

    if (!cards.length) return '';
    return '<div class="hero-preview" aria-hidden="true">' + cards.join('') + '</div>';
  }

  var ph = esc(t(UI.search_ph));
  var out = [];
  var preview = heroPreviewHTML();

  /* ---------- 1. 히어로 — 전면 코랄 색면 (header 바로 다음, .wrap 로 감싸지 않는다) ----------
     .hero-main 은 스타일 없는 블록이라 1024px 미만에서는 기존 마크업과 레이아웃이 같다.
     .hero-grid(2열)와 .wrap-wide(1120px)는 전부 min-width:1024px 안에서만 걸린다. */

  out.push(
    '<section class="hero"><div class="wrap wrap-wide' + (preview ? ' hero-grid' : '') + '">' +
      '<div class="hero-main">' +
      '<p class="kicker">' + esc(t(UI.hero_kicker)) + '</p>' +
      '<h1>' + markPipes(esc(t(UI.hero_title))) +
        '<span class="line2">' + markPipes(esc(t(UI.hero_title2))) + '</span></h1>' +
      '<p class="sub">' + esc(t(UI.hero_sub)) + '</p>' +
      '<div class="hero-cta">' +
        /* 페이지 내 이동은 해시가 아니라 data-scroll — 해시는 라우터가 먹는다 */
        '<button type="button" class="btn btn-primary" data-scroll="districts" data-track="hero_districts">' +
          esc(t(UI.hero_cta)) + '</button>' +
        '<a class="btn btn-ghost" href="' + esc(golmokHref('companions')) + '" data-track="hero_companions">' +
          esc(t(UI.hero_cta2)) + '</a>' +
      '</div>' +

      /* ---------- 2. 검색 (히어로 안이 정위치. 필터링은 app.js 의 applySearch 가 한다) ---------- */
      '<div class="search">' + ICON_SEARCH +
        '<input id="dsearch" type="search" autocomplete="off"' +
        ' placeholder="' + ph + '" aria-label="' + ph + '">' +
      '</div>' +
      '</div>' +
      preview +
    '</div></section>'
  );

  /* ---------- 3. 상권 ----------
     카드는 진짜 링크(<a href>)다 — 버튼이면 미리렌더한 상권·가게 페이지에 닿는 본문 링크가 없어
     검색엔진이 sitemap 으로만 찾고, 사람도 새 탭 열기·길게 눌러 링크 복사를 못 한다.
     이동은 app.js 의 링크 가로채기(linkRoute)가 맡는다: 보통 클릭은 golmokNav, ctrl/cmd·가운데 버튼은 브라우저 몫.
     안에는 span·svg 만 둔다(링크 안에 버튼·링크를 넣지 않는다). data-hay 는 검색 필터(applySearch)가 읽는다. */

  var cards = DISTRICTS.map(function (d) {
    var n = d.spots ? d.spots.length : 0;
    return '<a class="dcard" href="' + esc(golmokHref('d/' + d.id)) + '" data-hay="' + esc(hay(d)) + '">' +
      '<span class="sq sq-' + esc(d.id) + '">' + esc(code(d)) + '</span>' +
      '<span class="body">' +
        '<span class="n">' + esc(t(d.name)) + '</span>' +
        '<span class="d">' + esc(t(d.tagline)) + '</span>' +
        '<span class="chips">' +
          (d.full
            ? '<span class="chip lime">' + esc(t(UI.chip_full)) + '</span>'
            : '<span class="chip ghost">' + esc(t(UI.chip_prev)) + '</span>') +
          '<span class="chip num">' + esc(t(UI.spots_n).replace('{n}', String(n))) + '</span>' +
        '</span>' +
      '</span>' +
      ICON_CHEV +
    '</a>';
  }).join('');

  out.push(
    '<section id="districts"><div class="wrap wrap-wide">' +
      '<div class="sec-head">' +
        '<h2>' + esc(t(UI.districts_title)) + '</h2>' +
        '<span class="note">' + esc(t(UI.districts_note)) + '</span>' +
      '</div>' +
      '<div class="cards">' + cards + '</div>' +
      '<p class="empty-note" id="no-match" hidden>' + esc(t(UI.no_match)) + '</p>' +
    '</div></section>'
  );

  /* ---------- 4. 동행 티저 — 포레스트 색면 ---------- */

  out.push(
    '<section><div class="wrap wrap-wide">' +
      '<div class="comp-teaser">' +
        '<span class="kicker">' + esc(t(UI.comp_title)) + '</span>' +
        '<h2>' + esc(t(UI.comp_home_teaser_t)) + '</h2>' +
        '<p>' + esc(t(UI.comp_home_teaser_p)) + '</p>' +
        '<a class="btn btn-primary" href="' + esc(golmokHref('companions')) + '" data-track="teaser_companions">' +
          esc(t(UI.comp_cta)) + '</a>' +
      '</div>' +
    '</div></section>'
  );

  /* ---------- 5. 지금 한국에서는 ---------- */

  var nowCards = NOW.map(function (item) {
    return '<article class="now-card">' +
      '<div class="when"><span class="dot"></span>' + esc(t(item.when)) + '</div>' +
      '<h3>' + esc(t(item.t)) + '</h3>' +
      '<p>' + esc(t(item.p)) + '</p>' +
    '</article>';
  }).join('');

  out.push(
    '<section><div class="wrap wrap-wide">' +
      '<div class="sec-head">' +
        '<h2>' + esc(t(UI.now_title)) + '</h2>' +
        '<span class="tagchip">' + esc(t(UI.sample)) + '</span>' +
      '</div>' +
      '<div class="strip">' + nowCards + '</div>' +
    '</div></section>'
  );

  /* ---------- 6. 알아두면 좋은 것 ---------- */

  var knowItems = KNOW.map(function (item) {
    return '<div class="know-item">' +
      '<div class="k">' + esc(t(item.k)) + '</div>' +
      '<div class="v">' + esc(t(item.v)) + '</div>' +
    '</div>';
  }).join('');

  out.push(
    '<section id="know"><div class="wrap wrap-wide">' +
      '<div class="sec-head"><h2>' + esc(t(UI.know_title)) + '</h2></div>' +
      '<div class="know">' + knowItems + '</div>' +
    '</div></section>'
  );

  /* ---------- 6-b. 홈 화면 설치 안내 (install.js) ----------
     installHintHTML() 은 기기·상태에 따라 완성된 <section class="inst-sec"> 또는 '' 를 돌려준다.
     자리는 항상 <div data-install-slot> 로 둔다 — 설치 이벤트가 늦게 와도 install.js 가 홈 전체를
     다시 그리지 않고 이 슬롯 안만 채운다(키보드 포커스·스크롤이 튀지 않게).
     빈 슬롯은 스타일 없는 빈 div 라 높이가 0 이고, 카드가 들어가도 section 사이 간격은 그대로다.
     미리렌더(빌드)처럼 서비스워커가 없는 환경에서는 항상 '' — 정적 HTML 에 기기별 안내가 박히지 않는다.
     typeof 가드: install.js 가 없는 옛 번들에서도 홈이 깨지지 않게(빈 슬롯만 남는다). */
  out.push('<div data-install-slot>' +
    (typeof installHintHTML === 'function' ? installHintHTML() : '') +
  '</div>');

  /* ---------- 7. 사장님 밴드 ---------- */

  out.push(
    '<section><div class="wrap wrap-wide">' +
      '<div class="merchant">' +
        '<div>' +
          '<h2>' + esc(t(UI.merchant_t)) + '</h2>' +
          '<p>' + esc(t(UI.merchant_p)) + '</p>' +
        '</div>' +
        '<a class="btn btn-primary" href="' + esc(golmokHref('partner')) + '" data-track="merchant_cta">' +
          esc(t(UI.merchant_cta)) + '</a>' +
      '</div>' +
    '</div></section>'
  );

  /* ---------- 8. 푸터 ---------- */

  out.push(footerHTML());

  return out.join('');
}
