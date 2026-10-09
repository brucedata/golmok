/* Golmok — 동행 로컬 저장소 (내 계획 · 참가 신청).
   index.html 에서 js/companions.js 다음에 평범한 <script> 로 로드된다. 모듈·빌드 없음.

   MVP 에는 백엔드가 없다. 여기 저장되는 것은 **이 기기의 localStorage 에만** 남고,
   어디에도 전송되지 않는다(fetch/XHR 없음). 다른 사람에게 보인다고 말하지 말 것.

   공개 API (전역 function 선언 — 이름 변경 금지):
     golmokLoadMyPlans()         → plan[]            'golmok-myplans' 를 읽어 검증 통과분만
     golmokSanitizePlan(raw)     → plan | null       화이트리스트 검증·정규화
     golmokSaveMyPlan(input)     → {ok:true, plan} | {ok:false, errors:[키...]}
     golmokDeleteMyPlan(id)      → boolean
     golmokAllCompanions()       → 내 계획들 + COMPANIONS (내 계획이 앞)
     golmokJoinedIds()           → string[]          'golmok-join' (기존 app.js 형식 그대로)
     golmokToggleJoin(id)        → boolean           토글 후 신청 상태인가

   보안 원칙
   - localStorage 는 사용자·확장·다른 탭이 마음대로 고칠 수 있다 → 읽은 값은 절대 믿지 않는다.
     모든 항목은 golmokSanitizePlan 을 다시 통과해야 화면에 나온다.
   - verified 는 저장값과 무관하게 항상 false, country/ageBand 는 항상 null(입력받지 않음).
   - id 는 라우터·data 속성에 들어가므로 /^my-[a-z0-9]+$/ 만 허용.
   - 객체 키 검사는 hasOwnProperty 로 한다('constructor', '__proto__' 같은 상속 키 차단).
   - 모든 localStorage 접근은 try/catch (사파리 프라이빗 모드·차단된 저장소에서 throw).

   유니코드 범위는 소스에 보이지 않는 문자를 박지 않도록 \u{...} + u 플래그로만 쓴다.
   이 파일의 내부 헬퍼는 전역 하나(GOLMOK_STORE)에만 모아 둔다. 뷰·app.js 는 쓰지 말 것. */

var GOLMOK_STORE = (function () {

  var KEY_PLANS = 'golmok-myplans';
  var KEY_JOIN  = 'golmok-join';
  var MAX_PLANS = 10;
  var LANG_CODES = ['EN', 'JA', 'ZH', 'KO'];
  var BUDGETS    = ['₩', '₩₩', '₩₩₩'];

  var idCounter = 0;

  function has(obj, k) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, k);
  }

  /* ---------- 저장소 ---------- */

  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- 문자열 정리 ----------
     1) 문자열이 아니면 null
     2) 줄바꿈·탭 → 공백
     3) C0/C1 제어문자, 소프트 하이픈, 제로폭 문자, 줄/문단 구분자, 양방향 재정렬 문자, BOM 제거
        (제로폭 문자를 kakao 글자 사이에 끼워 연락처 필터를 피하는 수법도 여기서 무력화된다)
     4) 연속 공백 1칸으로, trim */
  var INVISIBLE = /[\u{0}-\u{1F}\u{7F}-\u{9F}\u{AD}\u{200B}-\u{200F}\u{2028}-\u{202E}\u{2060}-\u{2069}\u{FEFF}]/gu;

  function cleanText(v) {
    if (typeof v !== 'string') return null;
    return v
      .replace(/[\r\n\t\f\v]+/g, ' ')
      .replace(INVISIBLE, '')
      .replace(/ {2,}/g, ' ')
      .trim();
  }

  function lenOK(s, min, max) {
    return typeof s === 'string' && s.length >= min && s.length <= max;
  }

  /* ---------- 날짜·시간 ---------- */

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* 기기 로컬 기준 오늘 YYYY-MM-DD (UTC 로 자르면 한국 오전에 '어제'가 된다) */
  function todayLocal() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* 형식 + 실제 달력에 있는 날짜인지(2026-02-30 거부) */
  function validDate(s) {
    if (typeof s !== 'string') return false;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;
    var y = +m[1], mo = +m[2], da = +m[3];
    if (y < 2000 || mo < 1 || mo > 12 || da < 1 || da > 31) return false;
    var dt = new Date(y, mo - 1, da);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === da;
  }

  function validTime(s) {
    return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  }

  /* <input type="time"> 은 step 에 따라 초까지 줄 수 있다 → HH:MM 로 자른다 */
  function normTime(v) {
    var s = cleanText(v);
    if (s && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?$/.test(s)) s = s.slice(0, 5);
    return s;
  }

  function validISO(s) {
    return typeof s === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(s) &&
      !isNaN(new Date(s).getTime());
  }

  /* ---------- 화이트리스트 ---------- */

  function districtIds() {
    var arr = (typeof DISTRICTS !== 'undefined' && Array.isArray(DISTRICTS)) ? DISTRICTS : [];
    return arr.map(function (d) { return d && d.id; })
      .filter(function (id) { return typeof id === 'string'; });
  }

  function styleKeys() {
    var S = (typeof COMP_STYLES !== 'undefined' && COMP_STYLES) ? COMP_STYLES : {};
    return Object.keys(S).filter(function (k) { return has(S, k); });
  }

  /* 엄격한 부분집합 검사. 배열이 아니거나 허용 목록 밖 값이 **하나라도** 있으면 null
     (조용히 걸러내지 않는다 — 변조된 값은 필드 전체를 무효로 본다).
     통과하면 중복 제거 + 허용 목록 순서로 정렬해 돌려준다. */
  function subset(list, allowed) {
    if (!Array.isArray(list) || list.length > allowed.length * 2) return null;
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] !== 'string' || allowed.indexOf(list[i]) === -1) return null;
    }
    return allowed.filter(function (a) { return list.indexOf(a) !== -1; });
  }

  /* 이름 앞 글자(문자·숫자) 2개 대문자, 없으면 'ME' */
  function initialsOf(name) {
    var chars = Array.from(String(name || '')).filter(function (ch) {
      return /[\p{L}\p{N}]/u.test(ch);
    });
    return chars.slice(0, 2).join('').toUpperCase() || 'ME';
  }

  function validId(id) {
    return typeof id === 'string' && /^my-[a-z0-9]{1,40}$/.test(id);
  }

  function newId(existing) {
    var id;
    do {
      idCounter += 1;
      id = 'my-' + Date.now().toString(36) + idCounter.toString(36);
    } while (existing.indexOf(id) !== -1);
    return id;
  }

  /* ---------- 연락처 감지 ----------
     베타에서 낯선 사람에게 공개될 글이다. 연락처는 대화를 앱 밖으로 끌고 나가는 첫 단계라,
     정직한 사용자가 무심코 적는 것을 막는 가드레일로 둔다(작정한 우회까지 막는 필터는 아님).
     NFKC 로 전각 숫자·전각 @ 를 반각으로 접은 뒤 소문자로 검사한다. */

  /* 연락처가 아닌 고유명사·관용구는 먼저 지운다:
     카카오맵·카카오T·카카오페이(길찾기·택시·결제 앱), 카카오프렌즈 매장(쇼핑 명소),
     "인스타 감성" / "インスタ映え" / "insta-worthy" (사진 명소를 뜻하는 흔한 표현),
     "traffic signal"(신호등) · "snap a photo"(사진 찍다) 처럼 메신저 이름과 겹치는 일상어.
     단, 허용어 **바로 뒤에 아이디가 따라붙으면** 지우지 않는다 — 허용어를 방패로 쓴 것이다:
     "카카오 t 아이디 mina", "kakao t mina1234", "인스타 감성 계정 mina_trip". */
  var ALLOW_TAIL =
    '(?!\\s*(?:아이디|아디|계정|친구추가|id(?![a-z])|[:@=]|(?=[a-z0-9._-]*[\\d_])[a-z0-9._-]{3,}))';

  var MESSENGER_ALLOW = [
    'kakao\\s*-?\\s*(map|t(?![a-z])|taxi|navi|friends|pay)',
    '카카오\\s*(맵|지도|t(?![a-z])|택시|내비|프렌즈|페이)',
    'カカオ\\s*(マップ|フレンズ|ペイ|t(?![a-z]))',
    'insta(gram)?\\s*-?\\s*(worthy|able|mable|famous|spot)',
    '인스타\\s*(감성|갬성|각|맛집|핫플)',
    'インスタ\\s*(映え|ばえ|バエ)',
    '(traffic|phone|cell|mobile|wifi|gps|turn|hand)\\s*signals?',
    'snapshots?',
    'snap\\s+(a\\s+|the\\s+|some\\s+|your\\s+|a\\s+few\\s+|lots\\s+of\\s+)?(photos?|pics?|pictures?|shots?|selfies?|away)'
  ].map(function (src) { return new RegExp(src + ALLOW_TAIL, 'g'); });

  /* カカオ 는 일본어로 '카카오(초콜릿 원료)'이기도 해서 メッセンジャー 결합형만 막는다.
     한국어 '카카오' 도 카카오 닙스·음료가 있어 메신저 결합형만 막는다. */
  var MESSENGER_WORDS = [
    /kakao/, /카\s*톡/, /카카오\s*(톡|아이디|id|친구|채팅|오픈)/, /오픈\s*(채팅|카톡)/,
    /갠\s*톡/, /톡\s*방/, /오카\s*방/,
    /[\u{314B}\u{110F}]\s*[\u{314C}\u{1110}]/u,                     /* 'ㅋㅌ' — NFKC 가 호환 자모를 초성으로 바꾼다 */
    /カカオ\s*(トーク|talk|id|友達)/,

    /* LINE — 일본·대만 사용자의 기본 메신저. 지하철 "line 2" · "online" 은 통과시킨다. */
    /(^|[^a-z])line\s*[-_:.]?\s*id(?![a-z])/,
    /(^|[^a-z])line\s*[:@=]\s*(?![0-9]{1,2}(?![0-9]))\S/,          /* "line: abc", "LINE：mina", "LINE@abc" */
    /(add|message|text|find|dm|contact|catch)\s+me\s+on\s+line(?![a-z])/,
    /(^|[^a-z])on\s+line\s*[:@]/,
    /(^|[^a-z])my\s+line\s*(id|is|[:@=])(?![a-z])/,                 /* "my line is abc" */
    /(^|[^a-z])line\s+(?=[a-z0-9._-]*[a-z])(?=[a-z0-9._-]*\d)[a-z0-9._-]{4,}/, /* "line mina123" */
    /(^|[^a-z])line(?=\s?[\u{3040}-\u{30FF}\u{4E00}-\u{9FFF}])/u,   /* "LINE交換", "lineで" */
    /라인\s*(아이디|친구|추가|교환)/,
    /(^|[^\u{30A0}-\u{30FF}])ライン(?![\u{30A0}-\u{30FF}])/u,       /* オンライン·ガイドライン 은 통과 */

    /(^|[^a-z])insta(gram)?(?![a-z])/, /인스타/,
    /インスタ(?!ント)/,                                              /* インスタント(즉석) 은 통과 */
    /(^|[^a-z])ig(?![a-z])/,
    /facebook/, /(^|[^a-z])fb(?![a-z])/, /페이스북/, /フェイスブック/,
    /whats\s*app/, /왓츠\s*앱/, /ワッツ\s*アップ/,
    /telegram/, /텔레그램/, /テレグラム/, /텔레(?!비)/, /(^|[^a-z])tg\s*[:@=]/,
    /wechat/, /weixin/, /微\s*信/, /위챗/, /(^|[^a-z])v\s*信/, /薇信/,   /* "tv信号" 은 통과 */
    /we\s?chat(?![a-z])(?!\s+(about|over|with|while|during|and|in|as|after|before|a\s|to\s|on\s))/,
    /加\s*v(?![a-z])/,
    /(^|[^a-z])qq(?![a-z])/, /(^|[^a-z])vx(?![a-z])/, /(^|[^a-z])wx(?![a-z])/, /企鹅/,
    /小红书/, /小紅書/, /xiaohongshu/, /rednote/, /weibo/, /微博/,
    /抖音/, /(^|[^a-z])douyin(?![a-z])/, /tik\s*tok/, /틱톡/, /ティックトック/,
    /snapchat/, /discord/,
    /(^|[^a-z])snap\s*[:@=]/, /(^|[^a-z])snap\s+[a-z][a-z0-9._-]{2,}/,
    /twitter/, /트위터/, /ツイッター/, /(^|[^a-z])threads(?![a-z])/,
    /(^|[^a-z])signal(?![a-z])/, /(^|[^a-z])viber(?![a-z])/,
    /(^|[^a-z])messenger(?![a-z])/, /메신저/, /メッセンジャー/,
    /(^|[^a-z])dm(?![a-z])/, /디엠/,
    /(아이디|아디|계정)\s*[:@=]?\s*[a-z0-9._-]{3,}/,                 /* "아이디 mina" */
    /(^|[^a-z])id\s*[:@=]\s*[a-z0-9._-]{2,}/
  ];

  /* 이메일 — 도메인 글자를 말로 흘려 쓰는 우회까지. 'naver' 는 네이버 지도를 가리키는 일이 많아
     메일이라는 말이나 콜론이 붙었을 때만 막는다. */
  var MAIL_WORDS = [
    /(^|[^a-z])(gmail|hanmail|hotmail|googlemail|protonmail)(?![a-z])/,
    /(naver|daum|yahoo|outlook|icloud|qq|네이버|다음|야후)\s*(메일|mail|이메일|메일주소)/,
    /(naver|daum|yahoo|outlook|icloud)\s*[:@]\s*\S/,
    /(이메일|메일주소|메일|e-?mail)\s*[:@=]\s*\S/,
    /(^|[^a-z])e-?mail\s+me(?![a-z])/,
    /[a-z0-9._%+-]{2,}\s*[[({<]?\s*(at|골뱅이)\s*[\])}>]?\s*[a-z0-9-]{2,}\s*[[({<]?\s*(dot|점)\s*[\])}>]?\s*(com|net|org|kr|jp|cn|io|me|co)(?![a-z])/
  ];

  /* 송금 유도 — "먼저 보내 주세요"는 안전 수칙과 정면으로 부딪히는 문구다.
     결제 앱 이름만으로는 막지 않고(카카오페이로 더치페이는 정상), 보내 달라는 말과 함께일 때만.
     에러 키는 폼이 이미 아는 'contact' 하나로 돌려보낸다(뷰에 없는 키를 새로 만들지 않는다). */
  var PAY_APP_RE = /(kakao\s*pay|카카오\s*페이|カカオ\s*ペイ|naver\s*pay|네이버\s*페이|toss|토스|paypal|페이팔|venmo|alipay|支付宝|支付寶|微信支付|wechat\s*pay|계좌|account|口座|은행|bank)/;
  var PAY_SEND_RE = /(송금|입금|이체|선금|예약금|보증금|먼저\s*보내|deposit|transfer|remit|wire\s+me|send\s+(me\s+)?(the\s+)?money|pay\s+me|振込|送金|转账|轉帳)/;

  /* 가격 표기는 전화번호 검사 전에 걷어낸다: "₩15000-20000", "15000~20000원", "3000円".
     가격 숫자는 00 으로 끝나는 것만 인정한다 — "010-1234-5678원" 처럼 통화 단위를 붙여
     전화번호를 숨기는 경우까지 가격으로 오인하지 않게.
     0 으로 시작하는 금액(₩010…)은 금액이 아니다 — "₩010.1234.5600" 이 가격으로 지워지던 자리.
     숫자 가운데(1,234 의 234)에서 매칭이 시작되지 않도록 왼쪽 경계도 본다. */
  var MONEY_RE = /([₩￦$€¥]\s*)[1-9][\d,.]*00(?![\d])(\s*[-~]\s*[₩￦$€¥]?\s*\d[\d,.]*00(?![\d]))?|(^|[^\d.,])[1-9][\d,.]*00(\s*[-~]\s*\d[\d,.]*00)?\s*(원|won|krw|円|yen|元|rmb|usd|달러|ドル)/g;

  /* 날짜 — "2026-09-20" 과 "9/20/2026" 둘 다 흔하다 */
  var DATE_RE = [
    /(^|[^0-9])(19|20)\d{2}[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])(?![0-9])/g,
    /(^|[^0-9])(0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])[-./](19|20)?\d{2}(?![0-9])/g
  ];
  var TIME_RE = /([01]?\d|2[0-3])\s*[:시]\s*[0-5]\d분?/g;

  /* 대시류 — NFKC 로는 하이픈이 되지 않는 것들.
     일본어 전각 IME 에서 '-' 를 치면 장음기호 ー(U+30FC) 가 들어간다("090ー1234ー5678").
     쉼표는 가격·버스 번호 오탐이 커서 넣지 않는다(대신 아래 숫자 밀도 검사가 잡는다). */
  var DASHY = /[\u{2010}-\u{2015}\u{2043}\u{2212}\u{301C}\u{30FC}\u{30FB}\u{FF0D}\u{FF70}\u{00B7}\u{4E00}~_\/]/gu;

  var TLD_RE = new RegExp('[^\\s.]\\.(com|net|org|io|me|kr|jp|cn|hk|tw|sg|co|app|ly|gg|link|to|tv|xyz|' +
    'info|biz|page|site|online|shop|store|dev|ai|ee|us|uk|au|ca|fr|de)(?![a-z0-9-])');

  /* 점 앞뒤를 띄운 우회 — "minatrip . kr". 영어 문장 끝('... gate. Me too')을 막지 않도록
     띄어쓰기를 허용하는 TLD 는 영어 낱말이 아닌 것만 둔다. */
  var SPACED_TLD_RE = /[^\s.]\s*\.\s*(com|net|org|kr|jp|cn)(?![a-z0-9-])/;

  /* need 개의 숫자가 span 글자 안에 몰려 있는가 — 구분자를 말로 바꾼 우회를 잡는다
     ("010 then 1234 then 5678"). 날짜·시간·가격을 지운 뒤에 센다. */
  function digitsCrowded(str, need, span) {
    var pos = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 48 && c <= 57) pos.push(i);
    }
    for (var j = 0; j + need - 1 < pos.length; j++) {
      if (pos[j + need - 1] - pos[j] < span) return true;
    }
    return false;
  }

  function hasContact(value) {
    if (typeof value !== 'string' || !value) return false;
    var s = value;
    try { s = s.normalize('NFKC'); } catch (e) {}
    /* 。(U+3002) 는 NFKC 가 '.' 으로 바꾸지 않아 "minatrip。kr" 이 도메인 검사를 피해 갔다 */
    s = s.replace(INVISIBLE, '').replace(/[\u{3002}\u{FF61}]/gu, '.').toLowerCase();

    /* URL·도메인 */
    if (/https?:\/\//.test(s) || /(^|[^a-z0-9])www\./.test(s)) return true;
    if (TLD_RE.test(s) || SPACED_TLD_RE.test(s)) return true;
    if (/(^|[^a-z])dot\s*(com|net|org|kr|jp|cn|io|me)(?![a-z])/.test(s)) return true;

    /* 이메일 */
    if (/[a-z0-9._%+-]+\s*@\s*[a-z0-9-]+(\.[a-z0-9-]+)+/.test(s)) return true;
    if (MAIL_WORDS.some(function (r) { return r.test(s); })) return true;

    /* @핸들 — "@5pm", "@18:30" 같은 시간 표기는 제외 */
    var re = /(^|[^a-z0-9_.])@([a-z0-9_.]+)/g, m;
    while ((m = re.exec(s))) {
      if (!/^\d{1,2}(:\d{2})?(am|pm)?\.?$/.test(m[2])) return true;
    }

    /* 전화번호 — 숫자 7개 이상이 하이픈·공백·점·괄호·+ 로만 이어진 덩어리.
       날짜(2026-09-20)·가격은 흔히 쓰므로 먼저 걷어내고, 대시류는 '-' 로 접는다.
       콜론은 구분자가 아니라 18:30 은 안 걸린다. */
    var noDates = s;
    DATE_RE.forEach(function (r) { noDates = noDates.replace(r, '$1 '); });
    noDates = noDates.replace(MONEY_RE, function (mm) { return mm.replace(/[0-9]/g, ' '); });

    var runs = noDates.replace(DASHY, '-').match(/[+(]?\d[\d\s\-.()]*/g) || [];
    for (var i = 0; i < runs.length; i++) {
      if ((runs[i].match(/\d/g) || []).length >= 7) return true;
    }
    /* 휴대전화 모양(한국 01x · 일본 0[789]0) — 사이에 뭘 끼워 넣든 */
    if (/(\+?82|0)\D{0,3}1[0-9]\D{0,3}\d{3,4}\D{0,3}\d{4}(?!\d)/.test(noDates)) return true;
    if (/(\+?81|0)\D{0,3}[789]0\D{0,3}\d{4}\D{0,3}\d{4}(?!\d)/.test(noDates)) return true;
    /* 숫자를 말로 흩어 놓은 우회 — "010 then 1234 then 5678" */
    if (digitsCrowded(noDates.replace(TIME_RE, ' '), 10, 24)) return true;
    /* 한글로 적은 숫자 — "공일공 일이삼사 오육칠팔" */
    if (/[공영일이삼사오육륙칠팔구]{7,}/.test(s.replace(/\s+/g, ''))) return true;

    /* 송금 유도 */
    if (PAY_APP_RE.test(s) && PAY_SEND_RE.test(s)) return true;

    /* 메신저·SNS 단어 */
    var w = s;
    MESSENGER_ALLOW.forEach(function (r) { w = w.replace(r, ' '); });
    return MESSENGER_WORDS.some(function (r) { return r.test(w); });
  }

  return {
    KEY_PLANS: KEY_PLANS, KEY_JOIN: KEY_JOIN, MAX_PLANS: MAX_PLANS,
    LANG_CODES: LANG_CODES, BUDGETS: BUDGETS,
    has: has, readJSON: readJSON, writeJSON: writeJSON,
    cleanText: cleanText, lenOK: lenOK,
    todayLocal: todayLocal, validDate: validDate, validTime: validTime, normTime: normTime,
    validISO: validISO, districtIds: districtIds, styleKeys: styleKeys, subset: subset,
    initialsOf: initialsOf, validId: validId, newId: newId, hasContact: hasContact
  };
})();


/* ---------- 검증·정규화 ----------
   저장된 plan(= COMPANIONS 항목과 같은 모양)을 받아 새 객체를 만든다.
   원본 객체의 다른 필드는 절대 복사하지 않는다(화이트리스트). */
function golmokSanitizePlan(raw) {
  var S = GOLMOK_STORE;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  var host  = (raw.host  && typeof raw.host  === 'object') ? raw.host  : null;
  var when  = (raw.when  && typeof raw.when  === 'object') ? raw.when  : null;
  var seats = (raw.seats && typeof raw.seats === 'object') ? raw.seats : null;
  if (!host || !when || !seats) return null;

  if (!S.validId(raw.id)) return null;

  var district = raw.district;
  if (typeof district !== 'string' || S.districtIds().indexOf(district) === -1) return null;

  var styles = S.subset(raw.styles, S.styleKeys());
  if (!styles || !styles.length) return null;

  var langs = S.subset(host.langs, S.LANG_CODES);
  if (!langs || !langs.length) return null;

  if (typeof raw.budget !== 'string' || S.BUDGETS.indexOf(raw.budget) === -1) return null;

  var total = seats.total;
  if (typeof total !== 'number' || Math.floor(total) !== total || total < 2 || total > 6) return null;

  if (!S.validDate(when.date)) return null;
  if (!S.validTime(when.time)) return null;

  var title = S.cleanText(raw.title);
  var blurb = S.cleanText(raw.blurb);
  var name  = S.cleanText(host.name);
  if (!S.lenOK(title, 1, 60) || !S.lenOK(blurb, 1, 280) || !S.lenOK(name, 1, 20)) return null;

  /* 손으로 고친 저장값에 연락처가 들어와도 화면에 내보내지 않는다 */
  if (S.hasContact(title) || S.hasContact(blurb) || S.hasContact(name)) return null;

  if (!S.validISO(raw.createdAt)) return null;

  return {
    id: raw.id,
    host: {
      initials: S.initialsOf(name),
      name: name,
      country: null,
      ageBand: null,
      langs: langs,
      verified: false          /* 저장값이 true 라도 무시 — 본인 확인은 아직 없는 기능 */
    },
    district: district,
    when: { date: when.date, time: when.time },
    title: title,
    blurb: blurb,
    styles: styles,
    seats: { taken: 1, total: total },
    budget: raw.budget,
    mine: true,
    createdAt: raw.createdAt
  };
}


/* 저장된 내 계획. 검증 통과분만, id 중복 제거, 최대 10개. 최신이 앞. */
function golmokLoadMyPlans() {
  var S = GOLMOK_STORE;
  var raw = S.readJSON(S.KEY_PLANS);
  if (!Array.isArray(raw)) return [];
  var seen = {};
  var out = [];
  for (var i = 0; i < raw.length && out.length < S.MAX_PLANS; i++) {
    var p = golmokSanitizePlan(raw[i]);
    if (!p || S.has(seen, p.id)) continue;
    seen[p.id] = true;
    out.push(p);
  }
  return out;
}


/* 폼 입력 → 검증 → 저장.
   input: {district, date, time, title, plan, styles:[], langs:[], seats, budget, name, safety}
   에러 키: district, date, time, title, plan, styles, langs, seats, budget, name,
            safety, contact, limit, storage(기기 저장 실패 — 저장됐다고 말하면 안 되므로 별도 키) */
function golmokSaveMyPlan(input) {
  var S = GOLMOK_STORE;
  var inp = (input && typeof input === 'object') ? input : {};
  var errors = [];
  function err(k) { if (errors.indexOf(k) === -1) errors.push(k); }

  var existing = golmokLoadMyPlans();
  if (existing.length >= S.MAX_PLANS) err('limit');

  var district = S.cleanText(inp.district);
  if (!district || S.districtIds().indexOf(district) === -1) err('district');

  var date = S.cleanText(inp.date);
  if (!S.validDate(date) || date < S.todayLocal()) err('date');

  var time = S.normTime(inp.time);
  if (!S.validTime(time)) err('time');

  var title = S.cleanText(inp.title);
  if (!S.lenOK(title, 1, 60)) err('title');

  var blurb = S.cleanText(inp.plan);
  if (!S.lenOK(blurb, 1, 280)) err('plan');

  var styles = S.subset(inp.styles, S.styleKeys());
  if (!styles || !styles.length) err('styles');

  var langs = S.subset(inp.langs, S.LANG_CODES);
  if (!langs || !langs.length) err('langs');

  var seatsStr = S.cleanText(typeof inp.seats === 'number' ? String(inp.seats) : inp.seats);
  if (!seatsStr || !/^[2-6]$/.test(seatsStr)) err('seats');

  var budget = typeof inp.budget === 'string' ? inp.budget.trim() : '';
  if (S.BUDGETS.indexOf(budget) === -1) err('budget');

  var name = S.cleanText(inp.name);
  if (!S.lenOK(name, 1, 20)) err('name');

  var safety = inp.safety;
  if (!(safety === true || safety === '1' || safety === 'on')) err('safety');

  if (S.hasContact(title) || S.hasContact(blurb) || S.hasContact(name)) err('contact');

  if (errors.length) return { ok: false, errors: errors };

  var plan = golmokSanitizePlan({
    id: S.newId(existing.map(function (p) { return p.id; })),
    host: { name: name, langs: langs },
    district: district,
    when: { date: date, time: time },
    title: title,
    blurb: blurb,
    styles: styles,
    seats: { taken: 1, total: parseInt(seatsStr, 10) },
    budget: budget,
    createdAt: new Date().toISOString()
  });
  /* 위 검증을 통과했다면 여기서 null 일 수 없다 — 그래도 저장하지 않고 실패로 돌려준다 */
  if (!plan) return { ok: false, errors: ['storage'] };

  var next = [plan].concat(existing).slice(0, S.MAX_PLANS);
  if (!S.writeJSON(S.KEY_PLANS, next)) return { ok: false, errors: ['storage'] };

  return { ok: true, plan: plan };
}


/* 내 계획 삭제. 실제로 지워서 저장까지 됐을 때만 true. */
function golmokDeleteMyPlan(id) {
  var S = GOLMOK_STORE;
  if (!S.validId(id)) return false;
  var plans = golmokLoadMyPlans();
  var next = plans.filter(function (p) { return p.id !== id; });
  if (next.length === plans.length) return false;
  return S.writeJSON(S.KEY_PLANS, next);
}


/* 목록·상세 조회용: 내 계획이 앞, 샘플이 뒤. 샘플 객체는 COMPANIONS 의 원본 참조 그대로. */
function golmokAllCompanions() {
  var samples = (typeof COMPANIONS !== 'undefined' && Array.isArray(COMPANIONS)) ? COMPANIONS : [];
  return golmokLoadMyPlans().concat(samples);
}


/* 참가 신청(이 기기에만 기록된 관심 표시) id 목록.
   기존 app.js 가 쓰던 'golmok-join' = JSON 문자열 배열 형식을 그대로 읽는다. */
function golmokJoinedIds() {
  var S = GOLMOK_STORE;
  var raw = S.readJSON(S.KEY_JOIN);
  if (!Array.isArray(raw)) return [];
  var out = [];
  raw.forEach(function (v) {
    if (typeof v === 'string' && /^[a-z0-9-]{1,64}$/i.test(v) && out.indexOf(v) === -1) out.push(v);
  });
  return out;
}


/* 신청 토글. 존재하는 동행 id 만 허용하고, 내 계획(mine)에는 신청할 수 없다.
   반환: 토글 후 신청 상태인가. 허용되지 않는 id·만석에 새 신청·저장 실패면
   아무것도 바꾸지 않고 **현재 상태**를 그대로 돌려준다(호출 측은 전후 비교로 실패를 안다). */
function golmokToggleJoin(id) {
  var S = GOLMOK_STORE;
  if (typeof id !== 'string') return false;
  var joined = golmokJoinedIds();
  var was = joined.indexOf(id) !== -1;

  var target = golmokAllCompanions().filter(function (c) { return c && c.id === id; })[0];
  if (!target || target.mine) return was;

  /* 만석이면 새 신청은 막고, 이미 한 신청의 취소는 허용한다 */
  var seats = target.seats || {};
  var full = Number(seats.total) > 0 && Number(seats.taken) >= Number(seats.total);
  if (!was && full) return was;

  var next = was
    ? joined.filter(function (v) { return v !== id; })
    : joined.concat([id]);

  if (!S.writeJSON(S.KEY_JOIN, next)) return was;
  return !was;
}
