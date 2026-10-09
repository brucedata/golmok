/* Golmok — 파트너 뷰 (라우트 'partner').
   대상이 한국인 소상공인이므로 이 페이지만 한국어 단일이다. i18n.js의 PARTNER를 쓴다.
   전역 헬퍼(esc / footerHTML)는 app.js가 정의하며, 여기서는 호출 시점(런타임)에만 쓴다.
   순수 함수 — DOM을 만지지 않고 HTML 문자열만 반환한다. */

function partnerHTML() {
  /* 혜택 카드 아이콘: 1) 지구·언어  2) QR 코드  3) 체크 배지 (이모지 금지, 인라인 SVG).
     stroke 색은 css/style.css의 `.p-benefit .ic svg`가 지정하므로 여기서 색을 넣지 않는다. */
  var ICONS = [
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="9"></circle>' +
      '<path d="M3 12h18"></path>' +
      '<path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9s1.3-6.3 3.8-9z"></path>' +
    '</svg>',

    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<rect x="3.4" y="3.4" width="7.2" height="7.2" rx="1.7"></rect>' +
      '<rect x="13.4" y="3.4" width="7.2" height="7.2" rx="1.7"></rect>' +
      '<rect x="3.4" y="13.4" width="7.2" height="7.2" rx="1.7"></rect>' +
      '<path d="M13.4 13.4h3.2v3.2h-3.2z"></path>' +
      '<path d="M20.6 13.4v3.2"></path>' +
      '<path d="M17.4 20.6h3.2v-3.2"></path>' +
    '</svg>',

    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M12 2.9l7.1 2.5v5.7c0 4.2-2.8 7.7-7.1 9.3-4.3-1.6-7.1-5.1-7.1-9.3V5.4L12 2.9z"></path>' +
      '<path d="M8.7 12.1l2.4 2.4 4.4-4.7"></path>' +
    '</svg>'
  ];

  var benefits = (PARTNER.benefits || []).map(function (b, i) {
    return '<div class="p-benefit">' +
      '<span class="ic">' + (ICONS[i] || ICONS[0]) + '</span>' +
      '<h3>' + esc(b.t) + '</h3>' +
      '<p>' + esc(b.d) + '</p>' +
    '</div>';
  }).join('');

  /* .p-hero는 전면 포레스트 색면이다 — <header> 바로 다음 첫 요소여야 하고
     .wrap으로 감싸면 안 된다(헤더 underlap이 깨진다). */
  return '' +
  '<section lang="ko" class="p-hero"><div class="wrap">' +
    '<p class="kicker">' + esc(PARTNER.kicker) + '</p>' +
    '<h1>' + esc(PARTNER.title) + '</h1>' +
    '<p class="sub">' + esc(PARTNER.sub) + '</p>' +
    '<p class="en-sub" lang="en">Golmok is a 4-language neighbourhood guide that helps travellers ' +
      'find and order at real local shops in Korea.</p>' +
    /* 스펙 4.17: 히어로에서 신청 폼으로 바로 가는 CTA.
       페이지 내 이동은 href 해시가 아니라 data-scroll — '#apply' 해시는 라우터와 부딪힌다. */
    '<div class="hero-cta">' +
      '<button type="button" class="btn btn-primary" data-scroll="apply" data-track="partner_hero_cta">' +
        esc(PARTNER.form_t) + '</button>' +
    '</div>' +
  '</div></section>' +

  '<section lang="ko"><div class="wrap">' +
    '<div class="p-benefits">' + benefits + '</div>' +

    '<div class="free-note">' + esc(PARTNER.free_note) + '</div>' +

    /* 히어로 CTA(data-scroll="apply")의 스크롤 대상. 폼 id(partner-form)는 app.js 제출
       핸들러가 쓰므로 건드리지 않고 바깥 래퍼에 id를 둔다. */
    '<div class="p-apply" id="apply">' +
    /* novalidate 는 불리언 속성이라 값이 "false"여도 붙는 순간 required 가 죽는다 — 달지 않는다 */
    '<form class="p-form" id="partner-form">' +
      '<h2>' + esc(PARTNER.form_t) + '</h2>' +
      '<div class="row two">' +
        '<div>' +
          '<label for="pf-shop">' + esc(PARTNER.f_shop) + '</label>' +
          '<input id="pf-shop" name="shop" type="text" autocomplete="organization" required>' +
        '</div>' +
        '<div>' +
          '<label for="pf-area">' + esc(PARTNER.f_area) + '</label>' +
          '<input id="pf-area" name="area" type="text" autocomplete="address-level2" required>' +
        '</div>' +
      '</div>' +
      '<div class="row">' +
        '<div>' +
          '<label for="pf-contact">' + esc(PARTNER.f_contact) + '</label>' +
          '<input id="pf-contact" name="contact" type="text" autocomplete="tel" required>' +
        '</div>' +
      '</div>' +
      '<div class="row">' +
        '<div>' +
          '<label for="pf-msg">' + esc(PARTNER.f_msg) + '</label>' +
          '<textarea id="pf-msg" name="msg" rows="4"></textarea>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-primary" type="submit">' + esc(PARTNER.submit) + '</button>' +
      '<p class="note">' + esc(PARTNER.submit_note) + '</p>' +
    '</form>' +
    '</div>' +

    '<p class="p-by">' + esc(PARTNER.by) + '</p>' +
  '</div></section>' +

  footerHTML();
}
