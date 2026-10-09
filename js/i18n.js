/* Golmok — UI 문자열. (v0.6: cnew_ 내 계획 · saved_ / spot_ 가게 저장 섹션 추가 · v0.7: inst_ 홈 화면 설치 안내)
   빌드 없는 정적 바닐라 JS. import/export 금지, 전역 var/const 선언만 노출한다.
   이 파일이 노출하는 전역: LANGS, UI, PARTNER
   UI의 모든 값은 {en, ja, zh, ko} 4개 언어를 전부 가진다(영어 복사 금지).
   실제 문자열 선택은 app.js의 t(obj)가 런타임에 한다. */

const LANGS = [
  {code:'en', label:'English', abbr:'EN'},
  {code:'ja', label:'日本語',  abbr:'日'},
  {code:'zh', label:'中文',    abbr:'中'},
  {code:'ko', label:'한국어',  abbr:'한'},
];

const UI = {

  /* ---------- 헤더 내비 ---------- */
  nav_guide:{
    en:'Guide', ja:'ガイド', zh:'街区指南', ko:'골목 가이드'},
  nav_companions:{
    en:'Companions', ja:'旅仲間', zh:'结伴', ko:'동행'},
  nav_partner:{
    en:'For shop owners', ja:'店舗オーナー向け', zh:'商家入驻', ko:'사장님 페이지'},

  /* ---------- 홈 히어로 (전면 코랄 색면) ----------
     hero_title / hero_title2 는 초대형 h1을 두 줄로 끊어 쓰는 용도라 각각 짧게. */
  hero_kicker:{
    en:'For travelers, by locals',
    ja:'旅行者のための、ローカル発',
    zh:'为旅行者，由本地人打造',
    ko:'여행자를 위한, 로컬의 시선'},
  hero_title:{
    en:'Skip Myeongdong.',
    ja:'明洞は、スキップ。',
    zh:'跳过明洞。',
    ko:'명동은 건너뛰고,'},
  hero_title2:{
    en:'Go where Seoul goes.',
    ja:'ソウルが行く街へ。',
    zh:'去首尔人真正去的街。',
    ko:'서울이 가는 골목으로.'},
  hero_sub:{
    en:'Street-by-street guides with the stuff no map tells you — English menus, tax refund, how to order.',
    ja:'英語メニュー・免税・注文のしかたまで。地図が教えてくれない情報つきの、通り単位のガイド。',
    zh:'逐街精选，附上地图不会告诉你的信息：英文菜单、退税、怎么点单。',
    ko:'영어 메뉴, 택스리펀, 주문법까지 — 지도가 안 알려주는 골목 단위 가이드.'},
  hero_cta:{
    en:'Explore districts', ja:'エリアを見る', zh:'探索街区', ko:'상권 둘러보기'},
  /* 히어로의 두 버튼은 모바일에서 한 줄에 나란히 서야 한다 — 짧게 유지할 것 */
  hero_cta2:{
    en:'Companions', ja:'旅仲間を探す', zh:'找搭子', ko:'동행 찾기'},

  /* ---------- 검색 ---------- */
  search_ph:{
    en:'Where to? Try “Seongsu”',
    ja:'どこへ？「聖水」で検索',
    zh:'去哪儿？搜搜“圣水”',
    ko:'어디로 갈까요? "성수" 검색'},
  no_match:{
    en:'No district matches — try another word.',
    ja:'該当するエリアがありません。別の言葉でどうぞ。',
    zh:'没有匹配的街区，换个词试试。',
    ko:'일치하는 상권이 없어요. 다른 검색어로 시도해 보세요.'},

  /* ---------- 상권 목록 ---------- */
  districts_title:{
    en:'Pick a district', ja:'エリアを選ぶ', zh:'选一个街区', ko:'상권 고르기'},
  districts_note:{
    en:'Researched shop by shop',
    ja:'一軒ずつ調べて選んだ店',
    zh:'每家店都逐一查证挑选',
    ko:'한 곳씩 자료를 확인해 고른 가게들'},
  chip_full:{
    en:'FULL GUIDE', ja:'完全ガイド', zh:'完整指南', ko:'풀 가이드'},
  chip_prev:{
    en:'PREVIEW', ja:'プレビュー', zh:'预览', ko:'프리뷰'},
  spots_n:{
    en:'{n} spots', ja:'{n}軒', zh:'{n}家店', ko:'가게 {n}곳'},

  /* ---------- 시즌 스트립 / 알아두기 ---------- */
  now_title:{
    en:'Now in Korea', ja:'いま韓国で', zh:'韩国正当季', ko:'지금 한국에서는'},
  sample:{
    en:'SAMPLE', ja:'サンプル', zh:'示例', ko:'샘플'},
  know_title:{
    en:'Good to know', ja:'旅の基本情報', zh:'实用须知', ko:'알아두면 좋은 것'},

  /* ---------- 동행 매칭 ----------
     콘셉트: 혼자 온 여행자가 '하루치 동행'을 찾는다.
     comp_title = 히어로 kicker 겸 문서 제목 / comp_sub = 초대형 h1
     comp_cta  = 버튼용 CTA / comp_all = 필터 pill의 '전체' */
  comp_title:{
    en:'Day companions', ja:'旅仲間さがし', zh:'同行搭子', ko:'동행 매칭'},
  comp_sub:{
    en:'Don’t do Seoul alone.',
    ja:'ソウルを、ひとりにしない。',
    zh:'别一个人逛首尔。',
    ko:'서울, 혼자 걷지 마세요.'},
  comp_note:{  /* 동행은 전부 샘플이다 — 지금 누군가 올리고 있다고 말하지 말 것 */
    en:'In the beta, locals and travelers will post half-day plans you can join. For now, browse the sample plans below.',
    ja:'ベータ版では、ローカルも旅行者も半日のプランを投稿できるようになります。今はサンプルのプランをご覧ください。',
    zh:'测试版开放后，本地人和旅行者都可以发布半日行程。现在先看看下面的示例计划。',
    ko:'베타에서는 로컬과 여행자가 반나절 일정을 올리게 돼요. 지금은 아래 샘플 일정을 둘러보세요.'},
  comp_cta:{
    en:'Find a companion', ja:'旅仲間を探す', zh:'找个搭子', ko:'동행 찾기'},
  comp_all:{
    en:'All', ja:'すべて', zh:'全部', ko:'전체'},
  comp_seats:{  /* 영어는 단수·복수 구분 없이 읽히게('1 seats left' 방지) */
    en:'Room for {n} more', ja:'残り{n}席', zh:'还剩{n}位', ko:'{n}자리 남음'},
  comp_seats_full:{
    en:'Full', ja:'満席', zh:'已满', ko:'마감'},
  comp_join:{
    en:'Request to join', ja:'参加を申し込む', zh:'申请加入', ko:'참가 신청'},
  comp_join_sent:{  /* MVP엔 백엔드가 없다 — '아직'처럼 나중에 자동 전달된다고 읽힐 말은 쓰지 말 것.
                       app.js 가 cnew_join_toast 로 옮겨 가면 이 키는 지워도 된다. */
    en:'Saved on this device. Nothing was sent — real matching opens in the beta.',
    ja:'この端末に保存しました。送信はされていません。実際のマッチングはベータ版からです。',
    zh:'已保存在这台设备上，没有发送给任何人。实际匹配将在测试版开放。',
    ko:'이 기기에 저장했어요. 아무에게도 전달되지 않았어요. 실제 매칭은 베타에서 열립니다.'},
  comp_hosted_by:{
    en:'Hosted by', ja:'ホスト：', zh:'发起人：', ko:'호스트:'},
  comp_verified:{
    en:'ID verified', ja:'本人確認済み', zh:'已实名核验', ko:'본인 확인 완료'},
  comp_when:{
    en:'When', ja:'日時', zh:'时间', ko:'언제'},
  comp_where:{
    en:'Where', ja:'集合場所', zh:'地点', ko:'어디서'},
  comp_langs:{
    en:'Languages', ja:'話せる言語', zh:'语言', ko:'가능 언어'},
  comp_style_k:{
    en:'Style', ja:'スタイル', zh:'风格', ko:'스타일'},
  comp_empty:{
    en:'Nothing here yet — try another filter.',
    ja:'この条件のプランはまだありません。別のフィルターで探してみてください。',
    zh:'这个条件下还没有同行，换个筛选试试。',
    ko:'아직 이 조건의 동행이 없어요. 다른 필터로 찾아보세요.'},
  comp_safety_k:{
    en:'Before you meet', ja:'会う前に', zh:'见面之前', ko:'만나기 전에'},
  comp_safety_1:{
    en:'Meet somewhere busy and public — a café, a station exit, the market gate.',
    ja:'待ち合わせは人の多い公共の場所で。カフェ、駅の出口、市場の入口など。',
    zh:'约在人多的公共场所见面：咖啡馆、地铁出口、市场门口。',
    ko:'만남은 사람 많은 공공장소에서 하세요. 카페, 지하철 출구, 시장 입구처럼요.'},
  comp_safety_2:{  /* '지난 동행 기록'은 아직 없는 기능이라 언급하지 않는다 */
    en:'Read the host’s plan and profile carefully before you say yes.',
    ja:'申し込む前に、ホストのプロフィールと当日の予定をよく読みましょう。',
    zh:'确认之前，先仔细读一遍发起人的资料和当天行程。',
    ko:'신청 전에 호스트 프로필과 그날 일정을 꼼꼼히 읽어보세요.'},
  comp_safety_3:{  /* 여행자에게 제일 위험한 정보는 '집 주소'가 아니라 묵는 곳 이름·방 번호다 */
    en:'Never share where you’re staying or your room number, your home address, or passport and ID numbers — and never send money. Everyone pays their own tab.',
    ja:'宿泊先の名前や部屋番号、自宅の住所、パスポートや身分証の番号は教えないこと。送金もしない。支払いはそれぞれ自分の分を。',
    zh:'不要告诉对方你的住宿名称和房间号、家庭住址，也不要透露护照或证件号码，更不要转账。各付各的。',
    ko:'숙소 이름·방 번호, 집 주소, 여권·신분증 번호는 알려주지 마세요. 송금도 하지 마세요. 계산은 각자.'},
  /* 아래 둘은 이번에 추가한 안전 수칙 — 아직 어느 뷰에도 붙어 있지 않아 화면에 안 보인다.
     views-companion.js 의 .safety <ul> 세 곳(목록 ~165행 · 상세 ~349행 · 작성 폼 ~629행)에
     comp_safety_3 의 <li> 다음 줄로 아래 두 줄을 그대로 넣어야 한다:
       '<li>' + esc(t(UI.cnew_safety_4)) + '</li>' +
       '<li>' + esc(t(UI.cnew_safety_5)) + '</li>' + */
  cnew_safety_4:{
    en:'Tell someone you trust where you’re going and who you’re meeting — share your live location if you can. Keep an eye on your drink, and leave the moment you feel uncomfortable.',
    ja:'会う場所と相手を、信頼できる人に伝えておきましょう。可能ならリアルタイムの位置情報も共有を。飲み物から目を離さず、少しでも不安を感じたら、その場ですぐ帰って構いません。',
    zh:'把见面地点和对方的情况告诉信得过的人，可以的话再共享实时位置。别让自己的饮品离开视线；只要觉得不舒服，随时都可以先走。',
    ko:'만나는 장소와 상대를 믿을 만한 사람에게 알려 두고, 가능하면 실시간 위치도 공유하세요. 음료에서 눈을 떼지 말고, 불편하면 언제든 바로 자리를 떠도 괜찮아요.'},
  cnew_safety_5:{
    en:'Emergency numbers: 112 police, 119 fire and ambulance. The 1330 travel helpline runs 24 hours in English, Japanese and Chinese.',
    ja:'緊急時は警察112、消防・救急119。旅行者向けの1330は24時間、日本語・英語・中国語で対応しています。',
    zh:'紧急电话：报警112，火警和急救119。1330旅游咨询热线24小时提供中文、英文、日文服务。',
    ko:'긴급 전화: 경찰 112, 화재·구급 119. 관광통역안내 1330은 24시간 한국어·영어·일본어·중국어로 연결돼요.'},
  comp_back:{
    en:'All companions', ja:'プラン一覧へ', zh:'返回同行列表', ko:'동행 목록으로'},
  comp_plan_k:{
    en:'The plan', ja:'当日の流れ', zh:'当天行程', ko:'그날의 코스'},
  comp_who_k:{
    en:'Who it’s for', ja:'こんな人に', zh:'适合谁', ko:'이런 분에게'},
  comp_home_teaser_t:{
    en:'Solo today? Find a table.',
    ja:'今日ひとり？席、空いてます。',
    zh:'今天一个人？一起吃吧。',
    ko:'오늘 혼자예요? 같이 가요.'},
  comp_home_teaser_p:{  /* 동행은 전부 샘플 — '지금 올리고 있다'가 아니라 '베타에서 올리게 된다' */
    en:'In the beta, locals and travelers will post half-day plans — market breakfasts, bar crawls, coffee routes. For now, browse the sample plans. Joining is free.',
    ja:'ベータ版では、ローカルと旅行者が半日プランを投稿できるようになります。市場の朝ごはん、はしご酒、コーヒー巡り。今はサンプルのプランをご覧ください。参加は無料です。',
    zh:'测试版开放后，本地人和旅行者可以发布半日行程：市场早餐、小酒馆巡游、咖啡路线。现在先看看示例计划，加入免费。',
    ko:'베타에서는 로컬과 여행자가 반나절 일정을 올리게 돼요 — 시장 아침, 술집 순례, 커피 코스. 지금은 샘플 일정을 둘러보세요. 참가는 무료입니다.'},

  /* ---------- 사장님 밴드 (홈) ---------- */
  merchant_t:{
    en:'Run a shop in one of these streets?',
    ja:'この街でお店を営んでいますか？',
    zh:'您在这些街区经营店铺吗？',
    ko:'이 골목에서 가게를 운영하시나요?'},
  merchant_p:{
    en:'Get your shop foreigner-ready: translated menus, a QR shop page in 4 languages, and payment guidance. Free for early partners.',
    ja:'外国人のお客様を迎える準備を。メニュー翻訳、4言語のQRショップページ、決済案内まで。初期パートナーは無料。',
    zh:'让店铺准备好迎接外国顾客：菜单翻译、四语QR店铺页、支付指引。早期合作伙伴免费。',
    ko:'외국인 손님 받을 준비를 도와드립니다: 메뉴 번역, 4개 언어 QR 가게 페이지, 결제 안내. 초기 파트너는 무료.'},
  merchant_cta:{
    en:'Partner with Golmok', ja:'パートナーになる', zh:'成为合作伙伴', ko:'파트너 신청하기'},

  /* ---------- 상권 상세 ---------- */
  back:{
    en:'All districts', ja:'エリア一覧へ', zh:'返回街区列表', ko:'상권 목록으로'},
  back_district:{
    en:'Back to', ja:'戻る：', zh:'返回', ko:'돌아가기:'},
  story_k:{
    en:'The story', ja:'この街のこと', zh:'街区故事', ko:'동네 이야기'},
  route_k:{
    en:'A half-day on foot', ja:'半日さんぽコース', zh:'徒步半日路线', ko:'반나절 도보 코스'},
  spots_k:{
    en:'Where to go', ja:'行くべき店', zh:'推荐去处', ko:'가볼 곳'},
  st_station:{
    en:'Station', ja:'最寄り駅', zh:'地铁站', ko:'가까운 역'},
  st_walk:{
    en:'On foot', ja:'徒歩圏', zh:'步行范围', ko:'도보 반경'},
  st_best:{
    en:'Best time', ja:'ベスト時間帯', zh:'最佳时段', ko:'좋은 시간대'},
  tip_k:{
    en:'Insider tip', ja:'ローカルのコツ', zh:'本地贴士', ko:'인사이더 팁'},
  order_k:{
    en:'How to order', ja:'注文のしかた', zh:'点单方法', ko:'주문하는 법'},
  f_all:{
    en:'All', ja:'すべて', zh:'全部', ko:'전체'},
  details:{
    en:'Details', ja:'詳しく', zh:'详情', ko:'자세히'},

  /* ---------- 가게 상세 ---------- */
  map_naver:{
    en:'Open in Naver Map', ja:'Naver Mapで開く', zh:'在Naver地图中打开', ko:'네이버지도로 열기'},
  map_google:{
    en:'Google Maps', ja:'Googleマップ', zh:'谷歌地图', ko:'구글맵'},
  share:{
    en:'Share', ja:'共有', zh:'分享', ko:'공유'},
  copied:{
    en:'Link copied!', ja:'リンクをコピーしました', zh:'链接已复制！', ko:'링크 복사됨!'},
  share_manual_k:{  /* 클립보드가 막혔을 때(공유 데모 iframe 등) 링크를 화면에 그대로 보여 주는 라벨 */
    en:'Couldn’t copy automatically. Copy this link:',
    ja:'自動でコピーできませんでした。このリンクをコピーしてください。',
    zh:'无法自动复制，请手动复制这个链接：',
    ko:'자동으로 복사하지 못했어요. 이 링크를 복사해 주세요.'},
  show_local_k:{
    en:'Lost? Show this to any local',
    ja:'迷ったら、これを見せて',
    zh:'迷路了？把这个给本地人看',
    ko:'길을 잃었다면 이 화면을 보여주세요'},
  show_local_pre:{
    en:'I’m trying to get here:',
    ja:'ここへ行きたいです：',
    zh:'我想去这里：',
    ko:'여기로 가려고 해요:'},
  more_in:{
    en:'More nearby', ja:'このエリアの他の店', zh:'附近还有', ko:'주변 가볼 곳'},

  /* ---------- 안내 문구 ---------- */
  lite_note:{
    en:'Preview guide — the full shop-by-shop curation for this district ships in the beta.',
    ja:'プレビュー版 — この街の全店舗ガイドはベータ版で公開予定です。',
    zh:'预览版 — 该街区的完整店铺指南将在测试版上线。',
    ko:'프리뷰 가이드 — 이 상권의 전체 큐레이션은 베타에서 공개됩니다.'},
  /* 모든 페이지 푸터(app.js footerHTML). 가게와 동행은 성격이 달라 두 문장으로 나눈다 —
     가게는 실제 가게를 웹 자료로 확인한 것(현장 확인 전. checked 가 없는 가게도 있어 '확인했다'고 단정하지 않는다),
     동행은 가상의 샘플. 실제 가게까지 샘플로 읽히면 안 된다. */
  footer_note:{
    en:'Shop details are based on web sources and haven’t been checked in person yet — confirm opening hours before you go. Companion listings are fictional samples.',
    ja:'店舗情報はウェブ上の資料をもとにまとめたもので、現地での確認はまだです。営業時間は訪問前にご確認ください。旅仲間の一覧は架空のサンプルです。',
    zh:'店铺信息依据网络资料整理，尚未实地核实，出发前请确认营业时间。结伴列表为虚构的示例。',
    ko:'가게 정보는 웹 자료를 근거로 정리했고 현장 확인은 아직이에요. 방문 전 영업시간을 확인하세요. 동행 목록은 가상의 샘플이에요.'},


  /* ======================================================================
     v0.6 — 내 계획 올리기 (cnew_*) · views-companion.js
     정직성: MVP엔 백엔드가 없다. 내 계획·참가 신청은 이 기기에만 저장된다.
     "게시됐다 / 전달됐다 / 다른 사람이 본다"는 문장을 만들지 말 것.
     {n} 은 뷰에서 .replace() 로 치환한다.
     ====================================================================== */

  /* ---------- 목록 (#/companions) ---------- */
  cnew_cta:{
    en:'Add your plan', ja:'自分のプランを作る', zh:'添加我的计划', ko:'내 계획 만들기'},
  cnew_mine_t:{
    en:'Your plans', ja:'あなたのプラン', zh:'我的计划', ko:'내 계획'},
  cnew_mine_k:{
    en:'Your plan', ja:'あなたのプラン', zh:'我的计划', ko:'내 계획'},
  cnew_samples_t:{
    en:'Sample plans', ja:'サンプルプラン', zh:'示例计划', ko:'샘플 계획'},
  /* 틀: 지금 = 미리보기(MVP, 이 기기에만) / 베타 = 미래(그때 공개가 열린다).
     "베타 동안은 나만 본다"처럼 지금을 베타라고 부르면 cnew_no_contact 와 정면으로 어긋난다. */
  cnew_local_note:{
    en:'For now this stays on this device — nobody else can see it. Sharing opens in the beta.',
    ja:'今はこの端末にだけ保存され、他の人には見えません。公開はベータ版からです。',
    zh:'目前只保存在这台设备上，其他人看不到。公开功能将在测试版开放。',
    ko:'지금은 이 기기에만 저장돼 다른 사람은 볼 수 없어요. 공개는 베타에서 열립니다.'},

  /* ---------- 참가 신청 토글 (이 기기에만 기록) ----------
     cnew_requested 는 버튼·카드 표시 둘 다에 쓰인다. '보냈다'로 읽히지 않게 '저장됨'으로. */
  cnew_requested:{
    en:'Request saved', ja:'申し込みを保存済み', zh:'申请已保存', ko:'신청 저장됨'},
  cnew_requested_note:{  /* 저장해 둔 신청이 베타 때 자동으로 전달되는 경로는 없다 — 그렇게 읽히지 않게 */
    en:'Saved on this device only — it isn’t sent to anyone. When the beta opens you’ll need to request again. Tap again to cancel.',
    ja:'この端末に保存しただけで、誰にも送信されません。ベータ版が始まったら、あらためて申し込んでください。もう一度押すと取り消せます。',
    zh:'只保存在这台设备上，不会发送给任何人。测试版开放后需要重新申请。再点一次即可取消。',
    ko:'이 기기에만 저장됐고, 누구에게도 전달되지 않아요. 베타가 열리면 그때 다시 신청해야 해요. 한 번 더 누르면 취소돼요.'},
  /* app.js 의 신청 토스트용 새 키. comp_join_sent 를 대신하려고 만들었다(app.js 351행). */
  cnew_join_toast:{
    en:'Saved on this device. Nothing was sent — real matching opens in the beta.',
    ja:'この端末に保存しました。送信はされていません。実際のマッチングはベータ版からです。',
    zh:'已保存在这台设备上，没有发送给任何人。实际匹配将在测试版开放。',
    ko:'이 기기에 저장했어요. 아무에게도 전달되지 않았어요. 실제 매칭은 베타에서 열립니다.'},
  cnew_request_cancelled:{
    en:'Request removed from this device.',
    ja:'この端末に保存した申し込みを取り消しました。',
    zh:'已取消保存在这台设备上的申请。',
    ko:'이 기기에 저장한 신청을 취소했어요.'},

  /* ---------- 상세: 내 계획 삭제 ---------- */
  cnew_delete:{
    en:'Delete plan', ja:'プランを削除', zh:'删除计划', ko:'계획 삭제'},
  cnew_delete_confirm:{
    en:'Delete this plan from this device? This can’t be undone.',
    ja:'このプランを端末から削除しますか？元には戻せません。',
    zh:'要从这台设备上删除这个计划吗？删除后无法恢复。',
    ko:'이 기기에서 계획을 삭제할까요? 되돌릴 수 없어요.'},
  cnew_delete_again:{  /* 삭제 2단계 확인: 두 번째 누름을 기다리는 버튼 라벨(설명문은 cnew_delete_confirm) */
    en:'Tap again to delete', ja:'もう一度押すと削除', zh:'再点一次即可删除', ko:'한 번 더 누르면 삭제'},
  cnew_deleted_toast:{
    en:'Plan deleted from this device.',
    ja:'端末からプランを削除しました。',
    zh:'已从这台设备删除计划。',
    ko:'이 기기에서 계획을 삭제했어요.'},
  cnew_saved_toast:{  /* '아직/まだ/暂时'는 나중에 저절로 공개된다고 읽힌다 — 쓰지 않는다 */
    en:'Saved on this device. No one else can see it.',
    ja:'この端末に保存しました。他の人には見えません。',
    zh:'已保存在这台设备上，其他人看不到。',
    ko:'이 기기에 저장했어요. 다른 사람에게는 보이지 않아요.'},

  /* ---------- 새 계획 폼 (#/companions/new) ---------- */
  cnew_new_k:{
    en:'New plan', ja:'新しいプラン', zh:'新计划', ko:'새 계획'},
  cnew_new_t:{
    /* h1 keep-all: ja 는 390px 색면 안(약 300px)에 한 줄로 들어가게 짧게 — 길면 '作/ろう' 처럼 끊긴다 */
    en:'Plan your half-day', ja:'プランを作ろう', zh:'规划你的半日行程', ko:'반나절 계획 만들기'},
  cnew_new_sub:{
    en:'Pick a district, a time and what you’d like to do. Short and friendly works best.',
    ja:'エリアと時間、やりたいことを決めましょう。短く、気軽な書き方がいちばんです。',
    zh:'选好街区、时间和想做的事。写得简短、友好就好。',
    ko:'상권과 시간, 하고 싶은 걸 정해 보세요. 짧고 편하게 쓰는 게 제일 좋아요.'},
  cnew_device_note:{
    en:'For now: saved only on this device. No one else can see it.',
    ja:'現在はこの端末にだけ保存され、他の人には表示されません。',
    zh:'目前只保存在这台设备上，其他人看不到。',
    ko:'지금은 이 기기에만 저장되고 다른 사람에게는 보이지 않아요.'},

  cnew_sec_when:{
    en:'Where and when', ja:'場所と日時', zh:'地点和时间', ko:'어디서, 언제'},
  cnew_sec_plan:{
    en:'What you’ll do', ja:'やること', zh:'要做什么', ko:'무엇을 할까요'},
  cnew_sec_group:{
    en:'Your group', ja:'グループについて', zh:'想怎么结伴', ko:'어떤 동행으로'},
  cnew_sec_you:{
    en:'About you', ja:'あなたについて', zh:'关于你', ko:'나에 대해'},

  cnew_f_district:{
    en:'District', ja:'エリア', zh:'街区', ko:'상권'},
  cnew_f_district_ph:{
    en:'Choose a district', ja:'エリアを選ぶ', zh:'选择街区', ko:'상권 선택'},
  cnew_f_date:{
    en:'Date', ja:'日付', zh:'日期', ko:'날짜'},
  cnew_f_time:{
    en:'Meeting time', ja:'集合時間', zh:'集合时间', ko:'만나는 시간'},
  cnew_f_title:{
    en:'Title', ja:'タイトル', zh:'标题', ko:'제목'},
  cnew_f_title_ph:{
    en:'e.g. Market snacks, then the river',
    ja:'例：市場でおやつ、そのあと川辺へ',
    zh:'例如：先逛市场吃小吃，再去江边',
    ko:'예: 시장 간식 사서 강변으로'},
  cnew_f_plan:{
    en:'Your plan', ja:'プランの内容', zh:'计划内容', ko:'계획 설명'},
  cnew_f_plan_ph:{
    en:'Where you’ll meet, what you’ll do, how the day ends.',
    ja:'どこで会って、何をして、どう締めくくるか。',
    zh:'在哪儿碰面、做些什么、怎么收尾。',
    ko:'어디서 만나 무엇을 하고, 어떻게 마무리할지.'},
  cnew_f_max:{
    en:'Up to {n} characters', ja:'{n}文字まで', zh:'最多{n}个字', ko:'최대 {n}자'},
  cnew_f_styles:{
    en:'Style — pick at least one', ja:'スタイル（1つ以上）', zh:'风格（至少选一个）', ko:'스타일 (하나 이상)'},
  cnew_f_langs:{
    en:'Languages you speak — at least one',
    ja:'話せる言語（1つ以上）',
    zh:'你会说的语言（至少一个）',
    ko:'가능한 언어 (하나 이상)'},
  cnew_f_seats:{
    en:'Group size, including you', ja:'人数（あなたを含む）', zh:'人数（包括你自己）', ko:'인원 (나 포함)'},
  cnew_seats_opt:{
    en:'{n} people', ja:'{n}人', zh:'{n}人', ko:'{n}명'},
  cnew_f_budget:{
    en:'Budget per person', ja:'1人あたりの予算', zh:'人均预算', ko:'1인 예산'},
  cnew_b1:{
    en:'Easy on the wallet', ja:'お手頃', zh:'实惠', ko:'가볍게'},
  cnew_b2:{
    en:'Mid-range', ja:'ふつう', zh:'适中', ko:'보통'},
  cnew_b3:{
    en:'Treat yourself', ja:'ちょっと贅沢', zh:'犒劳自己', ko:'넉넉하게'},
  cnew_f_name:{
    en:'First name or nickname', ja:'名前またはニックネーム', zh:'名字或昵称', ko:'이름 또는 닉네임'},
  cnew_f_name_hint:{
    en:'Shown on your plan. No full name needed.',
    ja:'プランに表示されます。フルネームは必要ありません。',
    zh:'会显示在计划上，不需要填写全名。',
    ko:'계획에 표시돼요. 성까지 다 적을 필요는 없어요.'},
  cnew_no_contact:{
    en:'Don’t write phone numbers, social or messenger IDs, emails or links. Once plans open up in the beta, strangers will read them.',
    ja:'電話番号、SNSやメッセンジャーのID、メールアドレス、リンクは書かないでください。ベータ公開後は、知らない人もプランを読むことになります。',
    zh:'请不要填写电话号码、社交或聊天软件账号、邮箱或链接。测试版公开后，陌生人也会读到这些计划。',
    ko:'전화번호, SNS·메신저 아이디, 이메일, 링크는 적지 마세요. 베타에서 공개되면 모르는 사람도 계획을 읽게 됩니다.'},
  cnew_f_safety:{
    en:'I’ve read the safety tips above and will meet in a busy public place.',
    ja:'上の安全のヒントを読みました。人の多い公共の場所で会います。',
    zh:'我已阅读上面的安全提示，会约在人多的公共场所见面。',
    ko:'위 안전 수칙을 읽었고, 사람 많은 공공장소에서 만날게요.'},
  cnew_submit:{
    en:'Save on this device', ja:'この端末に保存', zh:'保存到这台设备', ko:'이 기기에 저장하기'},
  cnew_submit_note:{
    en:'Nothing is sent anywhere. You can delete it from the plan page any time.',
    ja:'どこにも送信されません。プランのページからいつでも削除できます。',
    zh:'不会发送到任何地方，随时可以在计划页面删除。',
    ko:'어디에도 전송되지 않아요. 계획 페이지에서 언제든 삭제할 수 있어요.'},

  /* ---------- 폼 에러 (키 = companion-store.js 에러 키) ---------- */
  cnew_errs_head:{
    en:'Check these before saving',
    ja:'保存する前に確認してください',
    zh:'保存前请检查以下内容',
    ko:'저장하기 전에 확인해 주세요'},
  cnew_err_district:{
    en:'Choose a district.', ja:'エリアを選んでください。', zh:'请选择街区。', ko:'상권을 선택해 주세요.'},
  cnew_err_date:{
    en:'Pick a valid date — today or later.',
    ja:'今日以降の正しい日付を選んでください。',
    zh:'请选择今天或之后的有效日期。',
    ko:'오늘이나 그 이후의 올바른 날짜를 골라 주세요.'},
  cnew_err_time:{
    en:'Enter a meeting time.', ja:'集合時間を入力してください。', zh:'请填写集合时间。', ko:'만나는 시간을 입력해 주세요.'},
  cnew_err_title:{
    en:'Add a title (up to 60 characters).',
    ja:'タイトルを入力してください（60文字まで）。',
    zh:'请填写标题（最多60个字）。',
    ko:'제목을 입력해 주세요 (최대 60자).'},
  cnew_err_plan:{
    en:'Describe your plan (up to 280 characters).',
    ja:'プランの内容を書いてください（280文字まで）。',
    zh:'请写下计划内容（最多280个字）。',
    ko:'계획 설명을 적어 주세요 (최대 280자).'},
  cnew_err_styles:{
    en:'Pick at least one style.',
    ja:'スタイルを1つ以上選んでください。',
    zh:'请至少选择一种风格。',
    ko:'스타일을 하나 이상 골라 주세요.'},
  cnew_err_langs:{
    en:'Pick at least one language you speak.',
    ja:'話せる言語を1つ以上選んでください。',
    zh:'请至少选择一种你会说的语言。',
    ko:'가능한 언어를 하나 이상 골라 주세요.'},
  cnew_err_seats:{
    en:'Choose a group size from 2 to 6.',
    ja:'人数は2〜6人から選んでください。',
    zh:'请选择2到6人的人数。',
    ko:'인원은 2~6명 중에서 골라 주세요.'},
  cnew_err_budget:{
    en:'Choose a budget.', ja:'予算を選んでください。', zh:'请选择预算。', ko:'예산을 골라 주세요.'},
  cnew_err_name:{
    en:'Add a first name or nickname (up to 20 characters).',
    ja:'名前かニックネームを入力してください（20文字まで）。',
    zh:'请填写名字或昵称（最多20个字）。',
    ko:'이름이나 닉네임을 입력해 주세요 (최대 20자).'},
  cnew_err_safety:{
    en:'Please confirm you’ve read the safety tips.',
    ja:'安全のヒントを読んだことを確認してください。',
    zh:'请确认你已阅读安全提示。',
    ko:'안전 수칙을 읽었는지 체크해 주세요.'},
  cnew_err_contact:{
    en:'Remove contact details — phone numbers, emails, links, @handles or messenger names — from the title, plan or name.',
    ja:'タイトル・内容・名前から連絡先（電話番号、メール、リンク、@ID、メッセンジャー名）を消してください。',
    zh:'请从标题、计划内容或名字中删除联系方式（电话、邮箱、链接、@账号或聊天软件名称）。',
    ko:'제목·설명·이름에서 연락처(전화번호, 이메일, 링크, @아이디, 메신저 이름)를 지워 주세요.'},
  cnew_err_limit:{
    en:'You already have 10 plans on this device. Delete one to add another.',
    ja:'この端末にはすでに10件のプランがあります。追加するには1件削除してください。',
    zh:'这台设备上已有10个计划。删除一个后才能再添加。',
    ko:'이 기기에 이미 계획이 10개 있어요. 하나를 지워야 새로 만들 수 있어요.'},
  cnew_err_storage:{
    en:'Couldn’t save on this device — storage may be blocked (for example in private browsing). Nothing was saved.',
    ja:'この端末に保存できませんでした。プライベートブラウズなどで保存が制限されている可能性があります。何も保存されていません。',
    zh:'无法保存到这台设备，可能是存储被限制（例如无痕模式）。没有保存任何内容。',
    ko:'이 기기에 저장하지 못했어요. 사생활 보호 모드 등에서 저장이 막혀 있을 수 있어요. 아무것도 저장되지 않았어요.'},


  /* ======================================================================
     v0.6 — 가게 저장(하트) · 정보 확인 시점 (saved_* / spot_*)
     views-saved.js · views-guide.js · app.js(헤더 저장 링크)
     저장 목록도 이 기기에만 있다. {n} · {name} · {date} 는 뷰에서 치환.
     ====================================================================== */

  /* ---------- 헤더 링크 · #/saved ---------- */
  saved_nav:{
    en:'Saved places', ja:'保存したお店', zh:'我的收藏', ko:'저장한 가게'},
  saved_nav_n:{
    en:'Saved places ({n})', ja:'保存したお店（{n}件）', zh:'我的收藏（{n}家）', ko:'저장한 가게 ({n}곳)'},
  saved_title:{
    en:'Your shortlist.', ja:'行きたいお店', zh:'想去的店', ko:'가고 싶은 가게'},
  saved_count:{  /* 상태 표시(칩·머리글)다 — 동작('저장하기')으로 읽히지 않게 완료형으로 */
    en:'{n} saved', ja:'保存済み {n}件', zh:'已收藏{n}处', ko:'{n}곳 저장됨'},
  saved_device_note:{
    en:'Saved on this device only — nothing is uploaded or shared. Clearing your browser data erases this list.',
    ja:'この端末だけに保存されています。どこにも送信・公開されません。ブラウザのデータを消すと、このリストも消えます。',
    zh:'只保存在这台设备上，不会上传，也不会公开。清除浏览器数据后，这份清单也会一起消失。',
    ko:'이 기기에만 저장돼요. 어디에도 올라가거나 공유되지 않아요. 브라우저 데이터를 지우면 이 목록도 함께 사라져요.'},
  saved_empty_t:{
    /* h2 는 keep-all 이라 띄어쓰기 없는 ja/zh 는 한 덩어리 — 320px 폰에서 넘치지 않게 짧게 유지 */
    en:'Nothing saved yet', ja:'まだ空っぽです', zh:'还没有收藏的店', ko:'아직 저장한 가게가 없어요'},
  saved_empty_p:{
    en:'Tap the heart on any shop and it lands here, ready for your trip. The list stays on this device.',
    ja:'気になるお店のハートをタップすると、ここにまとまります。旅先でそのまま使えます。リストはこの端末に保存されます。',
    zh:'点一下店铺上的爱心，就会收进这里，旅途中随手就能查看。清单只保存在这台设备上。',
    ko:'가게 카드의 하트를 누르면 여기에 모여요. 여행 중에 바로 꺼내 보세요. 목록은 이 기기에 저장돼요.'},

  /* ---------- 저장 토스트 ---------- */
  saved_toast_added:{
    en:'Saved on this device', ja:'この端末に保存しました', zh:'已收藏到这台设备', ko:'이 기기에 저장했어요'},
  saved_toast_removed:{
    en:'Removed from your saved places', ja:'保存を取り消しました', zh:'已取消收藏', ko:'저장을 취소했어요'},
  saved_toast_failed:{
    en:'Couldn’t save — this browser is blocking storage (private mode?)',
    ja:'保存できませんでした。ブラウザが保存を許可していないようです（プライベートモードなど）',
    zh:'没能收藏 — 浏览器禁止了本地存储（可能是无痕模式）',
    ko:'저장하지 못했어요. 브라우저가 저장을 막고 있는 것 같아요(시크릿 모드 등).'},

  /* ---------- 가게 카드 · 가게 상세 ---------- */
  spot_save:{
    en:'Save', ja:'保存', zh:'收藏', ko:'저장'},
  spot_saved:{
    en:'Saved', ja:'保存済み', zh:'已收藏', ko:'저장됨'},
  spot_save_aria:{  /* 토글 버튼 이름은 상태와 무관하게 고정 — 상태는 aria-pressed 가 전한다 */
    en:'Save {name}', ja:'{name}を保存', zh:'收藏{name}', ko:'{name} 저장'},
  spot_checked:{  /* 뷰에서 spot_verify_hours 와 ' · '로 이어 붙는다 — 지시문이 아니라 '확인 시점'으로 읽히게 */
    en:'Info checked {date}', ja:'{date}時点で確認済み', zh:'信息核实于{date}', ko:'{date}에 확인한 정보'},
  spot_verify_hours:{
    en:'Check opening hours before you go',
    ja:'営業時間は訪問前にご確認ください',
    zh:'营业时间请在出发前再确认',
    ko:'영업시간은 방문 전에 확인하세요'},
  spot_unchecked:{
    en:'Not verified yet — check hours and details before you go',
    ja:'まだ確認前の情報です。営業時間などは訪問前にご確認ください',
    zh:'这些信息尚未核实 — 出发前请先确认营业时间等细节',
    ko:'아직 확인 전인 정보예요. 방문 전에 영업시간 등을 확인하세요'},

  /* ---------- 홈 화면 설치 안내 (js/install.js · 홈의 사장님 밴드 위) ----------
     정직하게: 앱스토어 앱이 아니라 이 웹사이트에 아이콘이 붙는 것. 오프라인 약속은 '가이드'만 —
     iOS 는 홈 화면 앱과 Safari 의 저장소가 분리될 수 있어 저장한 가게·내 계획은 약속하지 않는다.
     iOS 단계 문구의 '공유'·'홈 화면에 추가'·'추가'는 각 언어 iOS 의 실제 메뉴 이름과 같게 둔다. */
  inst_t:{  /* inst-t 는 max-width 20ch · keep-all — ja/zh 는 한 줄에 들어가게 짧게 */
    en:'Keep Golmok on your home screen',
    ja:'Golmok をホーム画面に',
    zh:'把 Golmok 放到主屏幕',
    ko:'Golmok을 홈 화면에 두세요'},
  inst_t_pc:{
    en:'Install Golmok on this computer',
    ja:'このパソコンに Golmok をインストール',
    zh:'在这台电脑上安装 Golmok',
    ko:'이 컴퓨터에 Golmok 설치하기'},
  /* inst_p · inst_p_ios · inst_p_basic 중 하나가 카드 본문이 된다(install.js).
     오프라인 약속은 서비스워커가 이 페이지를 실제로 제어할 때만 — 아니면 inst_p_basic(오프라인 언급 없음).
     inst_p      안드로이드·데스크톱(브라우저와 캐시를 같이 쓴다)
     inst_p_ios  iOS: 홈 화면 앱은 Safari 와 저장소가 따로라, 추가한 뒤 온라인에서 한 번 열어야 오프라인이 된다 */
  inst_p:{
    en:'It’s not an app-store app — just this website with its own icon. Guides open even offline; maps still need a connection.',
    ja:'アプリストアのアプリではなく、このサイトにアイコンが付くだけです。ガイドはオフラインでも開けます（地図は通信が必要です）。',
    zh:'这不是应用商店里的 App，只是给这个网站加一个图标。指南离线也能打开，地图仍需联网。',
    ko:'앱스토어 앱이 아니라 이 웹사이트에 아이콘을 붙이는 거예요. 가이드는 오프라인에서도 열리고, 지도는 인터넷이 필요해요.'},
  inst_p_ios:{
    en:'It’s not an app-store app — just this website with its own icon. Once it’s added, open it from the new icon one time while you’re online; after that, guides open even offline. Maps still need a connection.',
    ja:'アプリストアのアプリではなく、このサイトにアイコンが付くだけです。追加したら、通信できるときに新しいアイコンから一度開いておいてください。その後はガイドをオフラインでも開けます（地図は通信が必要です）。',
    zh:'这不是应用商店里的 App，只是给这个网站加一个图标。添加后，请在联网时从新图标打开一次，之后指南离线也能打开。地图仍需联网。',
    ko:'앱스토어 앱이 아니라 이 웹사이트에 아이콘을 붙이는 거예요. 추가한 뒤 인터넷이 될 때 새 아이콘으로 한 번 열어 두면, 그다음부터 가이드는 오프라인에서도 열려요. 지도는 인터넷이 필요해요.'},
  inst_p_basic:{
    en:'It’s not an app-store app — just this website with its own icon, one tap away.',
    ja:'アプリストアのアプリではなく、このサイトにアイコンが付くだけです。ワンタップで開けます。',
    zh:'这不是应用商店里的 App，只是给这个网站加一个图标，点一下就能打开。',
    ko:'앱스토어 앱이 아니라 이 웹사이트에 아이콘을 붙이는 거예요. 한 번 누르면 바로 열려요.'},
  inst_btn:{
    en:'Add to home screen', ja:'ホーム画面に追加', zh:'添加到主屏幕', ko:'홈 화면에 추가'},
  inst_btn_pc:{
    en:'Install', ja:'インストール', zh:'安装', ko:'설치하기'},
  inst_dismiss:{
    en:'Don’t show again', ja:'今後表示しない', zh:'不再显示', ko:'다시 보지 않기'},
  inst_ios_1:{
    en:'Tap Share in Safari’s toolbar. On newer iPhones, tap the ⋯ button first.',
    ja:'Safari のツールバーで「共有」をタップ。新しい iPhone では先に「⋯」ボタンをタップします。',
    zh:'点按 Safari 工具栏中的“共享”。较新的 iPhone 需先点按“⋯”按钮。',
    ko:'Safari 도구 막대에서 ‘공유’를 누르세요. 최신 iPhone에서는 먼저 ‘⋯’ 버튼을 누르세요.'},
  inst_ios_2:{
    en:'Scroll down, choose “Add to Home Screen”, then tap Add.',
    ja:'下にスクロールして「ホーム画面に追加」を選び、「追加」をタップ。',
    zh:'向下滑动，选择“添加到主屏幕”，再点按“添加”。',
    ko:'아래로 내려 ‘홈 화면에 추가’를 고른 뒤 ‘추가’를 누르세요.'},
  inst_ios_3:{  /* 2단계 뒤 안내 — X·Gmail 등이 링크를 여는 Safari 창·iOS Brave 는 UA 로 못 가리는데 메뉴에 '홈 화면에 추가'가 없다 */
    en:'Not in the list? Open this page in the Safari app, then try again.',
    ja:'一覧にない場合は、Safari アプリでこのページを開いてから、もう一度お試しください。',
    zh:'列表里没有的话，请在 Safari 应用中打开本页，再试一次。',
    ko:'목록에 없으면 Safari 앱에서 이 페이지를 연 뒤 다시 시도하세요.'},
  inst_ios_other:{
    en:'Safari is the surest way on iPhone and iPad: open this page in Safari, then use Share → “Add to Home Screen”.',
    ja:'iPhone・iPad では Safari からの追加が確実です。このページを Safari で開き、「共有」→「ホーム画面に追加」を選んでください。',
    zh:'在 iPhone 和 iPad 上用 Safari 添加最稳妥：请用 Safari 打开本页，再选“共享”→“添加到主屏幕”。',
    ko:'iPhone·iPad에서는 Safari로 추가하는 게 가장 확실해요. 이 페이지를 Safari에서 열고 ‘공유’ → ‘홈 화면에 추가’를 고르세요.'},
  inst_done:{  /* appinstalled 토스트 — toast() 가 textContent 로 넣는다 */
    en:'Installed. Look for the Golmok icon.',
    ja:'インストールしました。Golmok のアイコンを探してください。',
    zh:'已安装，找找 Golmok 图标吧。',
    ko:'설치됐어요. Golmok 아이콘을 찾아보세요.'},
};

/* 파트너 페이지 — 한국인 소상공인 대상이라 한국어 단일. */
const PARTNER = {
  kicker:'사장님을 위한 Golmok',
  title:'외국인 손님, 준비만 되면 매출입니다',
  sub:'Golmok은 인바운드 여행자에게 동네 상권을 소개하는 4개 언어 가이드입니다. 사장님 가게가 "외국인이 갈 수 있는 가게"가 되도록 준비를 도와드립니다.',
  benefits:[
    {t:'4개 언어 가게 페이지', d:'영어·일본어·중국어·한국어로 가게 소개, 주문 방법, 결제 안내까지. 링크 하나로 끝.'},
    {t:'매장 QR 스티커',      d:'테이블·입구에 붙이는 QR. 외국인 손님이 스캔하면 모국어로 메뉴와 주문법이 열립니다.'},
    {t:'외국인 준비도 배지',   d:'영어 메뉴·택스리펀·카드 결제 여부를 여행자에게 미리 알려 방문 전 불안을 없앱니다.'},
  ],
  free_note:'초기 파트너는 전부 무료입니다. 등록비도, 수수료도 없습니다.',
  form_t:'파트너 신청',
  f_shop:'가게 이름',
  f_area:'동네 (예: 성수동)',
  f_contact:'연락처 (전화 또는 이메일)',
  f_msg:'하고 싶은 말 (선택)',
  submit:'신청 메일 보내기',
  submit_note:'버튼을 누르면 메일 앱이 열립니다. 내용 확인 후 보내기만 누르시면 됩니다.',
  by:'Golmok은 소상공인 AI 파트너 datamingo 팀이 만듭니다.',
};
