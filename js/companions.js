/* Golmok companions — 동행 매칭 콘텐츠 데이터.
   샘플 데이터 — 실제 사용자 아님. 호스트 이름·국적·프로필은 전부 가상의 예시입니다.
   Sample data — not real users. Every host below is fictional.

   Loaded as a plain <script> after js/data.js. No modules, no build step.
   Every user-visible string is a {en, ja, zh, ko} object.
   Companion fields: id, host{initials,name,country,ageBand,langs[],verified,hue},
                     district (must match a DISTRICTS id), when{date,time},
                     title, blurb, styles[] (COMP_STYLES keys), seats{taken,total}, budget,
                     plan[] (선택).
   plan — 그날의 코스 타임라인(상세 페이지 .c-plan <ol>). 항목마다
          {time:'HH:MM', t:{en,ja,zh,ko} 단계 제목, d:{en,ja,zh,ko} 한두 문장 설명}.
          첫 단계 time 은 when.time 과 같고, 시간순으로 3단계.
          가게 이름은 js/data.js 의 그 상권 spots 에 이미 있는 곳만 쓴다
          (Sunhui-ne · Daelim Changgo · Nogari Alley · Mangwon Market · Mangwon Hangang Park ·
           Bongbong Bangagan · Lucia’s Garden · Gwangjang Vintage).
          없는 가게·새 사실은 지어내지 않고 "시장 입구에서 만나기"처럼 일반적으로 쓴다.
          사용자가 올린 내 계획(companion-store.js)에는 plan 이 없다 — 그쪽은 blurb 문자열만. */

const COMP_STYLES = {
  food:  {label:{en:'Food',       ja:'食べ歩き',   zh:'美食',   ko:'먹거리'}},
  night: {label:{en:'Night out',  ja:'夜のおでかけ', zh:'夜生活', ko:'밤 나들이'}},
  photo: {label:{en:'Photo walk', ja:'撮影散歩',   zh:'拍照',   ko:'사진'}},
  shop:  {label:{en:'Shopping',   ja:'買い物',     zh:'购物',   ko:'쇼핑'}},
  cafe:  {label:{en:'Cafes',      ja:'カフェ',     zh:'咖啡',   ko:'카페'}},
  walk:  {label:{en:'Walking',    ja:'お散歩',     zh:'散步',   ko:'산책'}},
};

const COMPANIONS = [
  /* ---- Gwangjang · food crawl ---- */
  {
    id:'nightmarket',
    host:{initials:'MK', name:'Mika',
          country:{en:'Japan', ja:'日本', zh:'日本', ko:'일본'},
          ageBand:'20s', langs:['JA','EN'], verified:true, hue:12},
    district:'gwangjang',
    when:{date:'2026-09-12', time:'18:30'},
    title:{
      en:'Gwangjang food crawl, then makgeolli',
      ja:'広蔵市場を食べ歩いて、締めはマッコリ',
      zh:'广藏市场吃一圈，最后来杯米酒',
      ko:'광장시장 먹방 한 바퀴, 마무리는 막걸리'},
    blurb:{
      en:'Third trip to Seoul and I still end up eating bindaetteok alone every time. Looking for two or three people who will split plates so we can actually try the whole alley.',
      ja:'ソウルは3回目ですが、ピンデトクはいつも一人で食べています。お皿をシェアして横丁を制覇できる2〜3人を探しています。',
      zh:'第三次来首尔，可绿豆煎饼每次都是一个人吃。想找两三个人一起分着点，把这条小吃巷真正吃遍。',
      ko:'서울은 세 번째인데 빈대떡은 늘 혼자 먹었어요. 접시를 나눠 먹으면서 골목을 통째로 훑을 두세 명을 찾습니다.'},
    styles:['food','night'],
    seats:{taken:2, total:4},
    budget:'₩₩',
    plan:[
      {time:'18:30',
       t:{en:'Meet at the market entrance', ja:'市場の入口で集合', zh:'在市场入口集合', ko:'시장 입구에서 만나기'},
       d:{en:'Come hungry. We say hi, count heads and walk into the food alley together.',
          ja:'お腹を空かせて来てください。軽く挨拶して人数を確認したら、一緒に屋台通りへ。',
          zh:'空着肚子来。打个招呼、确认人数，然后一起走进小吃巷。',
          ko:'배고픈 상태로 오세요. 인사하고 인원 확인한 뒤 같이 먹자골목으로 들어가요.'}},
      {time:'18:45',
       t:{en:'Bindaetteok at Sunhui-ne', ja:'スニネでピンデトク', zh:'在顺姬家吃绿豆煎饼', ko:'순희네에서 빈대떡'},
       d:{en:'We split a mung-bean pancake fresh off the griddle, so everyone gets a taste.',
          ja:'焼きたての緑豆チヂミをみんなでシェア。全員ひと口ずつ味わえます。',
          zh:'刚出锅的绿豆煎饼大家分着吃，每个人都能尝到。',
          ko:'갓 부친 빈대떡을 나눠 먹어요. 다들 한 입씩은 맛볼 수 있게.'}},
      {time:'19:45',
       t:{en:'More plates, then makgeolli', ja:'もう何皿か、締めはマッコリ', zh:'再点几盘，最后来杯米酒', ko:'몇 접시 더, 마무리는 막걸리'},
       d:{en:'Mini gimbap and whatever looks good along the alley, then one shared bottle to finish. Everyone pays their own share.',
          ja:'ミニキンパなど、気になるものを少しずつ。最後にマッコリを1本シェアして締めます。支払いは各自で。',
          zh:'迷你紫菜包饭，再加上巷子里看着好吃的，最后分一瓶米酒收尾。各付各的。',
          ko:'꼬마김밥이랑 골목에서 눈에 띄는 것들 조금씩, 마지막은 막걸리 한 병 나눠 마셔요. 계산은 각자.'}}
    ]
  },

  /* ---- Seongsu · pop-up run ---- */
  {
    id:'popuprun',
    host:{initials:'YT', name:'Yuting',
          country:{en:'Taiwan', ja:'台湾', zh:'台湾', ko:'대만'},
          ageBand:'20s', langs:['ZH','EN'], verified:true, hue:196},
    district:'seongsu',
    when:{date:'2026-09-13', time:'11:00'},
    title:{
      en:'Seongsu pop-up run, cafes in between',
      ja:'聖水のポップアップ巡り、合間にカフェ',
      zh:'圣水快闪店巡礼，中间穿插咖啡',
      ko:'성수 팝업 순례, 사이사이 카페'},
    blurb:{
      en:'I keep a list of the pop-ups that opened this week and like ticking them off in order. Sunday morning, before the crowds — come along if you don’t mind queueing together.',
      ja:'今週オープンしたポップアップのリストを作って、順番に消していくのが好きです。人が増える前の日曜午前に。一緒に並ぶのが苦じゃない人はぜひ。',
      zh:'我会把本周新开的快闪店列成清单，喜欢按顺序一家家打勾。周日上午趁人还不多就出发，愿意一起排队的话就来吧。',
      ko:'이번 주에 열린 팝업 목록을 적어두고 하나씩 지워가는 걸 좋아해요. 사람 몰리기 전 일요일 오전, 같이 줄 서줄 분 환영합니다.'},
    styles:['shop','cafe','photo'],
    seats:{taken:1, total:3},
    budget:'₩₩',
    plan:[
      {time:'11:00',
       t:{en:'Meet at Seongsu Station', ja:'聖水駅で集合', zh:'在圣水站集合', ko:'성수역에서 만나기'},
       d:{en:'I bring this week’s pop-up list and we agree on the order before the queues build.',
          ja:'今週のポップアップリストを持っていくので、行列ができる前に回る順番を決めましょう。',
          zh:'我会带上本周的快闪店清单，趁还没排起长队先商量好顺序。',
          ko:'이번 주 팝업 목록을 가져갈게요. 줄이 길어지기 전에 도는 순서를 같이 정해요.'}},
      {time:'11:30',
       t:{en:'Pop-up run', ja:'ポップアップ巡り', zh:'快闪店巡礼', ko:'팝업 순례'},
       d:{en:'Queue together, take photos for each other and tick the list off one by one.',
          ja:'一緒に並んで、お互いに写真を撮り合いながら、リストをひとつずつ消していきます。',
          zh:'一起排队、互相拍照，把清单一项项打勾。',
          ko:'같이 줄 서고 서로 사진 찍어주면서 목록을 하나씩 지워가요.'}},
      {time:'13:30',
       t:{en:'Coffee break at Daelim Changgo', ja:'大林倉庫でコーヒー休憩', zh:'在大林仓库喝咖啡歇脚', ko:'대림창고에서 커피 한잔'},
       d:{en:'We rest our feet in the warehouse cafe and compare what we found. Leave whenever you like.',
          ja:'倉庫カフェで足を休めて、見つけたものを見せ合いましょう。抜けるタイミングは自由です。',
          zh:'在仓库咖啡馆歇歇脚，交流一下各自的收获。想走随时可以走。',
          ko:'창고 카페에서 다리 좀 쉬면서 건진 것들 서로 보여줘요. 먼저 가도 괜찮아요.'}}
    ]
  },

  /* ---- Euljiro · hidden bars (FULL) ---- */
  {
    id:'hipjiro',
    host:{initials:'CM', name:'Camille',
          country:{en:'France', ja:'フランス', zh:'法国', ko:'프랑스'},
          ageBand:'30s', langs:['FR','EN'], verified:true, hue:268},
    district:'euljiro',
    when:{date:'2026-09-14', time:'19:00'},
    title:{
      en:'Hidden bar hunt up unmarked stairs',
      ja:'看板のない階段の先、乙支路のバー探し',
      zh:'爬上无名楼梯，寻找乙支路隐藏酒吧',
      ko:'간판 없는 계단 위, 을지로 바 찾기'},
    blurb:{
      en:'I have four addresses saved and no idea which staircase belongs to which bar. We start with cold draft in the alley, then climb until a steel door feels right.',
      ja:'住所を4つ保存していますが、どの階段がどのバーなのか分かりません。まずは横丁で生ビール、あとは正解っぽい鉄の扉が見つかるまで階段を上ります。',
      zh:'我存了四个地址，却搞不清哪道楼梯通向哪家店。先在巷子里喝杯冰生啤，然后一层层往上爬，直到某扇铁门看起来对了为止。',
      ko:'주소 네 개를 저장해뒀는데 어느 계단이 어느 바인지 모르겠어요. 골목에서 생맥주로 시작해, 느낌 오는 철문이 나올 때까지 계단을 올라가 봅니다.'},
    styles:['night','food'],
    seats:{taken:3, total:3},
    budget:'₩₩',
    plan:[
      {time:'19:00',
       t:{en:'Cold draft at Nogari Alley', ja:'ノガリ横丁で生ビール', zh:'在明太鱼干巷喝冰生啤', ko:'노가리골목에서 생맥주'},
       d:{en:'Plastic stools, draft beer and dried pollack while we plan the route.',
          ja:'プラスチックの椅子に座り、生ビールと干しスケトウダラをつまみながら作戦会議。',
          zh:'坐在塑料凳上，喝着生啤、嚼着明太鱼干，顺便商量路线。',
          ko:'플라스틱 의자에 앉아 생맥주에 노가리 뜯으며 동선 짜기.'}},
      {time:'20:00',
       t:{en:'The staircase hunt', ja:'階段探し', zh:'寻找那道楼梯', ko:'계단 찾기'},
       d:{en:'We try the four saved addresses one building at a time. Wrong doors are part of the fun.',
          ja:'保存した4つの住所を1棟ずつ確かめます。扉を間違えるのも楽しみのうち。',
          zh:'把存好的四个地址一栋栋试过去。走错门也是乐趣之一。',
          ko:'저장해둔 주소 네 곳을 건물 하나씩 확인해요. 문 잘못 여는 것도 재미의 일부.'}},
      {time:'21:30',
       t:{en:'Settle in behind a steel door', ja:'鉄の扉の向こうで一杯', zh:'在铁门后坐下来', ko:'철문 안쪽에 자리 잡기'},
       d:{en:'One more round wherever feels right. Everyone pays their own tab and heads home when they like.',
          ja:'しっくりきた店でもう一杯。支払いは各自、帰りたくなったら自由に解散。',
          zh:'在感觉对的那家再喝一轮。各付各的，想回去随时回。',
          ko:'느낌 온 곳에서 한 잔 더. 계산은 각자, 가고 싶을 때 자유롭게 해산.'}}
    ]
  },

  /* ---- Mangwon · film camera walk (unverified host) ---- */
  {
    id:'filmwalk',
    host:{initials:'KY', name:'Ka Yan',
          country:{en:'Hong Kong', ja:'香港', zh:'香港', ko:'홍콩'},
          ageBand:'20s', langs:['ZH','EN','JA'], verified:false, hue:332},
    district:'mangwon',
    when:{date:'2026-09-15', time:'16:00'},
    title:{
      en:'One roll of film, market to riverbank',
      ja:'フィルム1本、市場から漢江まで',
      zh:'一卷胶卷，从市场走到江边',
      ko:'필름 한 롤, 시장에서 한강까지'},
    blurb:{
      en:'Market alleys first, then the riverbank until the light turns orange. Digital cameras and phones are just as welcome — the only rule is that we walk slowly.',
      ja:'まずは市場の路地、そのあと光がオレンジ色になるまで川辺を歩きます。デジカメでもスマホでも大歓迎。ルールはひとつだけ、ゆっくり歩くことです。',
      zh:'先逛市场巷子，再到江边等光线变橙。数码相机或手机一样欢迎，唯一的规矩是慢慢走。',
      ko:'시장 골목부터 시작해서, 빛이 주황색이 될 때까지 강변을 걸어요. 디카도 폰카도 환영. 규칙은 천천히 걷는 것 하나뿐입니다.'},
    styles:['photo','walk'],
    seats:{taken:1, total:4},
    budget:'₩',
    plan:[
      {time:'16:00',
       t:{en:'Meet at the Mangwon Market entrance', ja:'望遠市場の入口で集合', zh:'在望远市场入口集合', ko:'망원시장 입구에서 만나기'},
       d:{en:'Any camera is fine. A quick hello, then we set a slow pace.',
          ja:'カメラは何でもOK。軽く挨拶したら、ゆっくりペースで出発。',
          zh:'什么相机都行。简单打个招呼，然后放慢脚步出发。',
          ko:'카메라는 뭐든 좋아요. 가볍게 인사하고 천천히 출발해요.'}},
      {time:'16:15',
       t:{en:'Market alleys', ja:'市場の路地', zh:'市场小巷', ko:'시장 골목'},
       d:{en:'Stalls, signs and steam from the food counters. Ask before photographing vendors up close.',
          ja:'屋台、看板、湯気の立つ食べ物。お店の人を近くで撮るときは、ひと声かけてから。',
          zh:'摊位、招牌、冒着热气的小吃。近距离拍摊主之前先问一声。',
          ko:'가게, 간판, 김 나는 음식들. 상인분을 가까이서 찍을 땐 먼저 여쭤봐요.'}},
      {time:'17:30',
       t:{en:'Riverbank until the light turns orange', ja:'光がオレンジになるまで川辺で', zh:'在江边等光线变橙', ko:'빛이 주황색이 될 때까지 강변에서'},
       d:{en:'About 15 minutes on foot to Mangwon Hangang Park, then we finish the roll by the river.',
          ja:'望遠漢江公園まで歩いて約15分。川辺でフィルムを撮り切ります。',
          zh:'步行约15分钟到望远汉江公园，在江边拍完这卷胶卷。',
          ko:'망원한강공원까지 걸어서 15분쯤. 강변에서 남은 필름을 다 찍어요.'}}
    ]
  },

  /* ---- Gangneung · KTX coffee day trip ---- */
  {
    id:'coffeetrain',
    host:{initials:'RL', name:'Riley',
          country:{en:'Australia', ja:'オーストラリア', zh:'澳大利亚', ko:'호주'},
          ageBand:'30s', langs:['EN'], verified:true, hue:28},
    district:'gangneung',
    when:{date:'2026-09-19', time:'08:30'},
    title:{
      en:'KTX day trip: Gangneung coffee crawl',
      ja:'KTXで日帰り、江陵コーヒー巡り',
      zh:'KTX一日游：江陵咖啡巡礼',
      ko:'KTX 당일치기, 강릉 커피 투어'},
    blurb:{
      en:'Early train out, alley cafes in Myeongju-dong, then Anmok Beach with a cup in hand. Back in Seoul by 9pm — book your own KTX seat and I will share the train times.',
      ja:'朝の列車で出発、明珠洞の路地カフェを回って、最後は安木海岸でコーヒー片手に。21時にはソウルへ戻ります。KTXは各自予約、時間はこちらから共有します。',
      zh:'坐早上的KTX出发，先逛明珠洞的巷弄咖啡馆，再去安木海滩边喝边看海。晚上9点前回首尔——KTX各自订票，我把车次时间发给大家。',
      ko:'아침 기차로 나가서 명주동 골목 카페를 돌고, 안목해변에서 커피 한 잔. 밤 9시엔 서울 복귀합니다. KTX는 각자 예매하시고, 시간표는 제가 공유할게요.'},
    styles:['cafe','walk'],
    seats:{taken:2, total:5},
    budget:'₩₩',
    plan:[
      {time:'08:30',
       t:{en:'KTX out of Seoul', ja:'KTXでソウルを出発', zh:'坐KTX离开首尔', ko:'KTX로 서울 출발'},
       d:{en:'Everyone books their own seat; I share the train times beforehand. We regroup at Gangneung Station.',
          ja:'座席は各自で予約、列車の時間は事前に共有します。江陵駅で合流しましょう。',
          zh:'座位各自预订，车次时间我会提前发给大家。在江陵站会合。',
          ko:'좌석은 각자 예매, 열차 시간은 미리 공유할게요. 강릉역에서 다시 모여요.'}},
      {time:'11:00',
       t:{en:'Alley cafes in Myeongju-dong', ja:'明珠洞の路地カフェ', zh:'明珠洞的巷弄咖啡馆', ko:'명주동 골목 카페'},
       d:{en:'We start at Bongbong Bangagan, the cafe in an old rice mill, then wander the old-town alleys.',
          ja:'古い精米所を改装したカフェ Bongbong Bangagan から始めて、旧市街の路地をぶらぶら。',
          zh:'先去由老碾米坊改造的咖啡馆Bongbong Bangagan，再到老城区的巷子里随便逛逛。',
          ko:'옛 방앗간 자리의 봉봉방앗간에서 시작해서 구도심 골목을 느긋하게 걸어요.'}},
      {time:'15:00',
       t:{en:'Anmok Beach, cup in hand', ja:'コーヒー片手に安木海岸へ', zh:'拿着咖啡去安木海滩', ko:'커피 들고 안목해변으로'},
       d:{en:'A bus to the coast for coffee by the sand, then the train back — in Seoul by 9pm.',
          ja:'バスで海辺へ移動して、砂浜のそばでコーヒー。そのあと列車で戻り、21時にはソウルです。',
          zh:'坐公交去海边，在沙滩旁喝咖啡，然后坐火车回去，晚上9点前到首尔。',
          ko:'버스로 바닷가에 가서 모래사장 옆에서 커피, 그다음 기차로 돌아와 밤 9시엔 서울이에요.'}}
    ]
  },

  /* ---- Gongju · slow afternoon ---- */
  {
    id:'hanokstay',
    host:{initials:'DV', name:'Devin',
          country:{en:'United States', ja:'アメリカ', zh:'美国', ko:'미국'},
          ageBand:'30s', langs:['EN','KO'], verified:true, hue:152},
    district:'gongju',
    when:{date:'2026-09-20', time:'14:00'},
    title:{
      en:'Slow afternoon in Gongju: tea and hanok',
      ja:'公州でゆっくり午後、お茶と韓屋',
      zh:'公州慢下午：喝茶与韩屋',
      ko:'공주에서 느린 오후, 차와 한옥'},
    blurb:{
      en:'Two months in Korea and I have only seen big cities. I want one afternoon along the stream: a hanok tea house, the tiny bookshops, and the fortress wall at dusk.',
      ja:'韓国に来て2か月、見たのは大都市だけ。小川沿いで午後を過ごしたいです。韓屋の茶房、小さな本屋、そして夕暮れの城壁まで。',
      zh:'来韩国两个月，看到的全是大城市。想在溪边过一个下午：韩屋茶室、迷你书店，还有黄昏时的城墙。',
      ko:'한국에 온 지 두 달인데 큰 도시만 봤어요. 개천을 따라 오후 한나절을 보내고 싶습니다. 한옥 찻집, 작은 책방, 그리고 해질녘 성벽까지.'},
    styles:['walk','cafe'],
    seats:{taken:1, total:3},
    budget:'₩₩',
    plan:[
      {time:'14:00',
       t:{en:'Tea at Lucia’s Garden', ja:'ルチアの庭でお茶', zh:'在露西亚的庭院喝茶', ko:'루치아의 뜰에서 차 한잔'},
       d:{en:'Shoes off at the wooden floor, tea in a hanok with a courtyard garden, no rush at all.',
          ja:'板の間で靴を脱いで、中庭のある韓屋でゆっくりお茶を。急ぐことは何もありません。',
          zh:'在木地板前脱鞋，在带庭院的韩屋里慢慢喝茶，完全不用赶。',
          ko:'마루에서 신발 벗고, 마당 있는 한옥에서 천천히 차 마셔요. 서두를 것 하나 없어요.'}},
      {time:'15:30',
       t:{en:'Along the stream', ja:'川沿いを歩く', zh:'沿着小溪走', ko:'개천 따라 걷기'},
       d:{en:'A slow walk beside Jemincheon, stopping at the small bookshops we pass.',
          ja:'済民川沿いをのんびり歩いて、途中の小さな本屋に立ち寄ります。',
          zh:'沿着济民川慢慢走，路过的小书店都进去看看。',
          ko:'제민천 옆을 천천히 걸으면서 지나가는 작은 책방마다 들러요.'}},
      {time:'17:30',
       t:{en:'The fortress wall at dusk', ja:'夕暮れの城壁', zh:'黄昏时的城墙', ko:'해질녘 성벽'},
       d:{en:'We walk up to the old fortress wall and watch the town go quiet as the light fades.',
          ja:'古い城壁まで歩いて、日が落ちて町が静かになっていくのを眺めます。',
          zh:'走到古城墙边，看着天色暗下来、小城慢慢安静。',
          ko:'옛 성벽까지 걸어 올라가서, 해가 지며 조용해지는 동네를 바라봐요.'}}
    ]
  },

  /* ---- Gwangjang · vintage floor upstairs (unverified host) ---- */
  {
    id:'vintagedive',
    host:{initials:'JD', name:'Jordan',
          country:{en:'Canada', ja:'カナダ', zh:'加拿大', ko:'캐나다'},
          ageBand:'20s', langs:['EN','FR'], verified:false, hue:58},
    district:'gwangjang',
    when:{date:'2026-09-17', time:'13:00'},
    title:{
      en:'Digging the vintage racks upstairs',
      ja:'2階の古着ラックを掘る',
      zh:'在二楼古着货架里挖宝',
      ko:'2층 구제상가에서 옷 뒤지기'},
    blurb:{
      en:'The vintage floor takes patience, and it goes much better with someone holding the other sleeve of a jacket. Cash is easier upstairs, and we’ll grab a late lunch downstairs after.',
      ja:'2階の古着フロアは根気勝負。ジャケットの反対側の袖を持ってくれる人がいるとぐっと捗ります。上は現金があると便利です。そのあと1階で遅めのお昼を。',
      zh:'二楼古着区挖货很考验耐心，有人帮忙抓住外套另一只袖子会顺利得多。楼上用现金更方便，逛完下楼吃个迟到的午饭。',
      ko:'2층 구제상가는 인내심 싸움이라, 재킷 반대쪽 소매를 잡아줄 사람이 있으면 훨씬 잘 돼요. 위층은 현금이 편하고, 끝나고 아래층에서 늦은 점심.'},
    styles:['shop','walk'],
    seats:{taken:2, total:3},
    budget:'₩',
    plan:[
      {time:'13:00',
       t:{en:'Meet at the market entrance', ja:'市場の入口で集合', zh:'在市场入口集合', ko:'시장 입구에서 만나기'},
       d:{en:'Bring some cash — it is the easier way to pay at the stalls upstairs. Comfortable shoes help too.',
          ja:'現金を少し持ってきてください。上の階の店は現金の方がスムーズです。歩きやすい靴だと楽です。',
          zh:'记得带些现金，楼上摊位用现金更方便。穿双好走的鞋会轻松些。',
          ko:'현금 조금 챙겨 오세요. 위층 좌판은 현금이 편합니다. 편한 신발이면 더 좋고요.'}},
      {time:'13:15',
       t:{en:'Rack by rack at Gwangjang Vintage', ja:'Gwangjang Vintage でラックを端から', zh:'在Gwangjang Vintage一排排翻货架', ko:'광장시장 구제상가에서 한 줄씩'},
       d:{en:'One holds the jacket, the other checks sleeves and seams. Friendly haggling only.',
          ja:'一人がジャケットを持ち、もう一人が袖と縫い目をチェック。値段交渉は感じよく。',
          zh:'一个人拿着外套，另一个检查袖子和接缝。讲价要客气。',
          ko:'한 명은 재킷 들고, 한 명은 소매랑 박음질 확인. 흥정은 기분 좋게만.'}},
      {time:'15:00',
       t:{en:'Late lunch downstairs', ja:'下の階で遅めのお昼', zh:'下楼吃迟到的午饭', ko:'아래층에서 늦은 점심'},
       d:{en:'Hand-cut noodles or a mung-bean pancake in the food alley, and a look at what we found.',
          ja:'屋台通りでカルグクスかピンデトクを食べながら、戦利品を見せ合います。',
          zh:'在小吃巷吃手擀面或绿豆煎饼，顺便看看彼此淘到的宝贝。',
          ko:'먹자골목에서 칼국수나 빈대떡 먹으면서 건진 옷 구경해요.'}}
    ]
  },

  /* ---- Mangwon · sunset picnic ---- */
  {
    id:'sunsetmat',
    host:{initials:'HR', name:'Haru',
          country:{en:'Japan', ja:'日本', zh:'日本', ko:'일본'},
          ageBand:'20s', langs:['JA','EN','KO'], verified:true, hue:212},
    district:'mangwon',
    when:{date:'2026-09-21', time:'17:00'},
    title:{
      en:'Market snacks, then a mat by the Han',
      ja:'市場でおやつ、そして漢江でシートを広げる',
      zh:'市场买小吃，然后去汉江铺垫子',
      ko:'시장 간식 사서 한강 돗자리'},
    blurb:{
      en:'Buy far too much at Mangwon Market, spread a mat, walk over to the delivery zone when the chicken arrives. Bring a drink you like and we can trade snacks until it gets dark.',
      ja:'望遠市場で買いすぎて、シートを広げて、チキンが届いたらデリバリーゾーンまで取りに行く。好きな飲み物を持ってきて、暗くなるまでおやつ交換しましょう。',
      zh:'在望远市场买上一大堆，铺开野餐垫，炸鸡送到了就走去取餐区拿。带上你喜欢的饮料，我们一直换零食吃到天黑。',
      ko:'망원시장에서 과하게 사고, 돗자리 펴고, 치킨 오면 배달존까지 걸어가서 받아오기. 좋아하는 음료 하나씩 들고 오면 어두워질 때까지 간식을 바꿔 먹어요.'},
    styles:['food','walk'],
    seats:{taken:2, total:5},
    budget:'₩',
    plan:[
      {time:'17:00',
       t:{en:'Snack run at Mangwon Market', ja:'望遠市場でおやつの買い出し', zh:'在望远市场采购小吃', ko:'망원시장에서 간식 장보기'},
       d:{en:'Croquettes, tteokbokki, whatever is still hot. Small bills make it easier.',
          ja:'コロッケ、トッポッキ、まだ温かいものを何でも。千ウォン札があると便利です。',
          zh:'可乐饼、炒年糕，还热乎的都可以。带点小面额纸币会方便很多。',
          ko:'고로케, 떡볶이, 아직 따끈한 건 뭐든. 천 원짜리가 있으면 편해요.'}},
      {time:'17:45',
       t:{en:'Mat down at Mangwon Hangang Park', ja:'望遠漢江公園でシートを広げる', zh:'在望远汉江公园铺垫子', ko:'망원한강공원에 돗자리 펴기'},
       d:{en:'We pick up a mat at a convenience store on the way and walk about 15 minutes to the river.',
          ja:'途中のコンビニでシートを買って、川まで歩いて約15分。',
          zh:'路上在便利店买张垫子，步行约15分钟到江边。',
          ko:'가는 길에 편의점에서 돗자리 사서 강까지 15분쯤 걸어요.'}},
      {time:'18:30',
       t:{en:'Chicken pick-up, snack swap', ja:'チキンを受け取りに、おやつ交換', zh:'去取炸鸡，互换零食', ko:'치킨 찾아오기, 간식 바꿔 먹기'},
       d:{en:'We order fried chicken and walk over to the delivery zone to collect it, then trade snacks until dark. Everyone chips in for their share.',
          ja:'チキンを頼んだらデリバリーゾーンまで受け取りに行って、暗くなるまでおやつ交換。代金は各自の分を出し合います。',
          zh:'叫了炸鸡就走去取餐区拿回来，然后一直换零食吃到天黑。费用各出各的那份。',
          ko:'치킨을 시키고 배달존까지 걸어가서 받아온 다음, 어두워질 때까지 간식 바꿔 먹어요. 돈은 각자 먹은 만큼.'}}
    ]
  },

  /* ---- Seongsu · coffee after work ---- */
  {
    id:'latecafe',
    host:{initials:'SH', name:'Shan',
          country:{en:'Singapore', ja:'シンガポール', zh:'新加坡', ko:'싱가포르'},
          ageBand:'30s', langs:['EN','ZH'], verified:true, hue:288},
    district:'seongsu',
    when:{date:'2026-09-18', time:'17:30'},
    title:{
      en:'Seongsu after work: coffee first, maybe a drink after',
      ja:'仕事帰りの聖水、まずはコーヒー、そのあとは気分で',
      zh:'下班后的圣水：先喝咖啡，再看心情',
      ko:'퇴근 후 성수, 커피 한 잔 그리고 어쩌면 한 잔 더'},
    blurb:{
      en:'I work near Seongsu and usually stay for a coffee after work. If the evening feels right we move on for a drink nearby — that is the whole plan.',
      ja:'聖水の近くで働いていて、仕事帰りにコーヒーを一杯飲んでいきます。雰囲気が合えば、そのまま近くでもう一杯。予定はそれだけです。',
      zh:'我在圣水附近上班，下班后常留下来喝杯咖啡。要是气氛合适，就在附近再喝一杯，计划就这么多。',
      ko:'성수 근처에서 일해요. 퇴근하고 커피 한 잔 하다가, 분위기가 맞으면 근처에서 한 잔 더 하고 헤어지는 정도.'},
    styles:['cafe','night'],
    seats:{taken:1, total:2},
    budget:'₩₩₩',
    plan:[
      {time:'17:30',
       t:{en:'Meet over coffee first', ja:'まずはコーヒーで待ち合わせ', zh:'先约杯咖啡见面', ko:'일단 커피 한 잔으로 만나기'},
       d:{en:'We pick a cafe near the station, take a table and start with coffee.',
          ja:'駅の近くのカフェを選んで席を取り、まずはコーヒーから。',
          zh:'在车站附近挑一家咖啡馆坐下，先从咖啡开始。',
          ko:'역 근처 카페를 골라 자리를 잡고, 일단 커피부터.'}},
      {time:'18:00',
       t:{en:'A drink somewhere nearby', ja:'近くでもう一杯', zh:'在附近再喝一杯', ko:'근처에서 한 잔'},
       d:{en:'If we are both up for it, we find somewhere close by for a drink. We pay separately.',
          ja:'二人とも気が向いたら、近くの店でもう一杯。支払いは別々です。',
          zh:'要是彼此都还有兴致，就在附近找家店再喝一杯，各付各的。',
          ko:'둘 다 괜찮으면 근처에서 한 잔 더. 계산은 따로 해요.'}},
      {time:'19:30',
       t:{en:'No plan after that', ja:'その先はノープラン', zh:'之后没有计划', ko:'그다음은 계획 없음'},
       d:{en:'Stay for another glass, walk the Seongsu streets or call it a night. No pressure either way.',
          ja:'もう一杯飲むもよし、聖水を散歩するもよし、そこで解散するもよし。気軽にどうぞ。',
          zh:'再喝一杯、在圣水逛逛，或者就此散场都行，完全随意。',
          ko:'한 잔 더 해도, 성수 거리를 걸어도, 거기서 헤어져도 좋아요. 부담 없이.'}}
    ]
  },
];
