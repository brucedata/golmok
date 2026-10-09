/* Golmok — 저장한 가게 뷰 (라우트 'saved').
   전역으로 노출하는 것은 function savedHTML() 하나뿐이다.
   t() · esc() · CODES · footerHTML() (app.js), UI (i18n.js), DISTRICTS (data.js),
   golmokSavedKeys() (saved-store.js) 는 **호출 시점(런타임)에만** 참조한다.
   순수 함수 — DOM을 만지지 않고 HTML 문자열만 돌려준다.

   정직성: 저장 목록은 이 기기에만 있다. 페이지 머리에서 그 사실을 그대로 말한다.

   구조
   - .saved-head : 코랄 색면 블록(.s-hero 와 같은 문법, .back 뒤에 오므로 전면이 아니라 카드형)
                   h1#saved-title 의 tabindex="-1" 은 app.js 가 저장 취소로 행이 사라졌을 때
                   키보드 포커스를 돌려놓을 자리다(탭 순서에는 들어가지 않는다).
   - .saved-groups > .saved-group: 상권별 묶음. DISTRICTS 순서, 묶음 안에서는 data.js 의 가게 순서.
                   760px 부터 2열(.spots·.comp-list 와 같은 규칙), ≥1024px 에서는 .wrap-wide 폭
   - .saved-row  : 가게 행. 가게 링크 <a class="saved-item" href> 와 <button class="save-toggle" data-save> 는
                   형제(링크 안에 버튼 금지). 하트 aria-label 은 "{가게명} 저장"으로 고정,
                   상태는 aria-pressed="true" 가 전한다.
   - 카드·행은 진짜 링크(<a href>, golmokHref)다 — 새 탭 열기·링크 복사가 되고, 이동은 app.js 의
     링크 가로채기가 맡는다. data-spot / data-district 는 이동에 쓰이지 않는 표식이다.
   - 가게 이름은 화면 언어로(golmokSpotName, app.js). 한글 보조 표기는 표시 이름에 이미 들어 있으면 생략. */

function savedHTML() {

  /* ---- 로컬 헬퍼 (전역 오염 없음) ---- */
  function heart(filled, size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.6-4.6-9.4-9.6C1.5 7.4 3.5 4 7 4c2.1 0 3.8 1.1 5 2.9C13.2 5.1 14.9 4 17 4c3.5 0 5.5 3.4 4.4 6.7-1.8 5-9.4 9.6-9.4 9.6z"></path></svg>';
  }
  function fill(tpl, token, value) {
    /* 함수 치환 — 값에 $& 같은 패턴이 있어도 안전 */
    return String(tpl || '').replace(token, function () { return String(value); });
  }
  /* 가게 이름(화면 언어) — 이스케이프 전 텍스트. golmokSpotName 이 없는 옛 번들에서는 s.name */
  function spotName(s, d) {
    if (typeof golmokSpotName === 'function') return String(golmokSpotName(s, d, state.lang) || '');
    return String(s.name || '');
  }
  /* 한글 보조 표기 — 표시 이름에 이미 들어 있으면 '' (ko 화면에서 같은 글자를 두 번 쓰지 않게) */
  function koAside(s, shown) {
    var ko = String(s.ko || '');
    return (!ko || shown.indexOf(ko) !== -1) ? '' : ko;
  }
  var CHEV =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M9 6l6 6-6 6"></path></svg>';

  var districts = (typeof DISTRICTS !== 'undefined' && DISTRICTS) ? DISTRICTS : [];
  var keys = (typeof golmokSavedKeys === 'function') ? golmokSavedKeys() : [];
  var savedSet = Object.create(null);
  keys.forEach(function (k) { savedSet[k] = true; });
  var total = keys.length;

  /* ---- 상권별 묶음 (DISTRICTS 순서 → 가게 데이터 순서) ---- */
  var groups = [];
  districts.forEach(function (d) {
    var items = (d.spots || []).filter(function (s) { return savedSet[d.id + '/' + s.id]; });
    if (items.length) groups.push({ d: d, items: items });
  });

  /* ---- 머리: 코랄 색면 블록 ---- */
  var head =
    '<div class="saved-head">' +
      '<p class="kicker">' + heart(true, 14) + esc(t(UI.saved_nav)) + '</p>' +
      '<h1 id="saved-title" tabindex="-1">' + esc(t(UI.saved_title)) + '</h1>' +
      (total
        ? '<p class="saved-count num">' + esc(fill(t(UI.saved_count), '{n}', total)) + '</p>'
        : '') +
      '<p class="sub">' + esc(t(UI.saved_device_note)) + '</p>' +
    '</div>';

  /* ---- 본문 ---- */
  var body;
  if (!groups.length) {
    var fullGuides = districts.filter(function (d) { return d.full; });
    body =
      '<div class="saved-empty">' +
        '<span class="ic">' + heart(false, 30) + '</span>' +
        '<h2>' + esc(t(UI.saved_empty_t)) + '</h2>' +
        '<p>' + esc(t(UI.saved_empty_p)) + '</p>' +
        '<a class="btn btn-primary" href="' + esc(golmokHref('')) + '">' + esc(t(UI.hero_cta)) + '</a>' +
      '</div>' +
      (fullGuides.length
        ? '<div class="sibling">' + fullGuides.map(function (d) {
            return '<a class="sib-card" href="' + esc(golmokHref('d/' + d.id)) + '" data-district="' + esc(d.id) + '">' +
              '<span class="n">' + esc(t(d.name)) + (state.lang === 'ko' ? '' : ' <span class="ko-name" lang="ko">' + esc(d.hangul) + '</span>') + '</span>' +
              '<span class="c">' + esc(t(d.tagline)) + '</span>' +
            '</a>';
          }).join('') + '</div>'
        : '');
  } else {
    body = '<div class="saved-groups">' + groups.map(function (g) {
      var d = g.d;
      var rows = g.items.map(function (s) {
        var key = d.id + '/' + s.id;
        var name = spotName(s, d);
        var ko = koAside(s, name);
        return '<li class="saved-row">' +
          '<a class="saved-item" href="' + esc(golmokHref('s/' + key)) + '" data-spot="' + esc(key) + '">' +
            /* 이름과 한글명 사이는 공백 — 줄이 바뀌면 공백이 사라져 한글명이 들여쓰기 없이 떨어진다 */
            '<span class="n">' + esc(name) + (ko ? ' <span class="ko-name" lang="ko">' + esc(ko) + '</span>' : '') + '</span>' +
            '<span class="c">' + esc(t(s.cat)) + ' &middot; <span class="num">' + esc(s.price) + '</span></span>' +
          '</a>' +
          '<button class="save-toggle" type="button" data-save="' + esc(key) + '" aria-pressed="true"' +
            ' aria-label="' + esc(fill(t(UI.spot_save_aria), '{name}', name)) + '">' +
            heart(true, 22) +
          '</button>' +
        '</li>';
      }).join('');

      return '<div class="saved-group">' +
        '<div class="saved-ghead">' +
          '<span class="sq sq-' + esc(d.id) + '">' + esc(CODES[d.id] || String(d.id).slice(0, 2).toUpperCase()) + '</span>' +
          '<div class="saved-gtitle">' +
            '<span class="saved-region">' + esc(t(d.region)) + '</span>' +
            '<h2><a href="' + esc(golmokHref('d/' + d.id)) + '">' + esc(t(d.name)) + CHEV + '</a></h2>' +
          '</div>' +
          '<span class="chip num">' + esc(fill(t(UI.saved_count), '{n}', g.items.length)) + '</span>' +
        '</div>' +
        '<ul class="saved-list">' + rows + '</ul>' +
      '</div>';
    }).join('') + '</div>';
  }

  return '' +
    '<div class="wrap wrap-wide">' +
      '<a class="back" href="' + esc(golmokHref('')) + '">&larr; ' + esc(t(UI.back)) + '</a>' +
      head +
    '</div>' +

    '<section class="saved-sec"><div class="wrap wrap-wide">' +
      body +
    '</div></section>' +

    footerHTML();
}
