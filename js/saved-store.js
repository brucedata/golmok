/* Golmok — 가게 저장(하트) 저장소.
   전역으로 노출하는 것은 function 선언 세 개뿐이다:
     golmokSavedKeys()      → 'districtId/spotId' 문자열 배열 (저장한 순서, 최대 200개)
     golmokIsSaved(key)     → boolean
     golmokToggleSave(key)  → boolean (토글한 뒤의 저장 상태)

   정직성: MVP에는 백엔드가 없다. 저장 목록은 이 기기의 localStorage('golmok-saved')에만
   있고, 어디로도 전송하지 않는다(fetch/XHR 없음).

   견고성
   - localStorage 접근은 전부 try/catch. 막힌 브라우저에서도 렌더는 절대 깨지지 않는다.
   - 읽을 때마다 DISTRICTS에 실제로 있는 조합만 남긴다. data.js에서 가게가 빠지거나 id가
     바뀌어도 목록·헤더 개수·상세 링크가 깨진 가게를 가리키지 않는다.
   - DISTRICTS 는 data.js 전역이며 호출 시점(런타임)에만 읽는다.
   - 쓰기에 실패하면 상태를 바꾸지 않은 것으로 돌려준다. 호출부는 "토글 전 상태 === 반환값"
     으로 실패를 알아채고, 저장됐다고 거짓말하지 않는다. */

function golmokSavedKeys() {
  var MAX = 200;

  var valid = Object.create(null);
  var districts = (typeof DISTRICTS !== 'undefined' && DISTRICTS) ? DISTRICTS : [];
  for (var i = 0; i < districts.length; i++) {
    var d = districts[i];
    var spots = (d && d.spots) || [];
    for (var j = 0; j < spots.length; j++) {
      if (spots[j] && spots[j].id) valid[d.id + '/' + spots[j].id] = true;
    }
  }

  var raw = [];
  try {
    var parsed = JSON.parse(localStorage.getItem('golmok-saved') || '[]');
    if (Array.isArray(parsed)) raw = parsed;
  } catch (e) {}

  var seen = Object.create(null);
  var out = [];
  for (var k = 0; k < raw.length; k++) {
    var key = raw[k];
    if (typeof key !== 'string' || !valid[key] || seen[key]) continue;
    seen[key] = true;
    out.push(key);
  }
  /* 넘치면 가장 최근에 저장한 200개만 남긴다(뒤쪽이 최신). */
  return out.length > MAX ? out.slice(out.length - MAX) : out;
}

function golmokIsSaved(key) {
  if (typeof key !== 'string' || !key) return false;
  return golmokSavedKeys().indexOf(key) !== -1;
}

function golmokToggleSave(key) {
  var MAX = 200;
  if (typeof key !== 'string' || !key) return false;

  /* 존재하지 않는 가게는 저장하지 않는다. */
  var parts = key.split('/');
  if (parts.length !== 2) return false;
  var districts = (typeof DISTRICTS !== 'undefined' && DISTRICTS) ? DISTRICTS : [];
  var exists = districts.some(function (d) {
    return d && d.id === parts[0] && (d.spots || []).some(function (s) {
      return s && s.id === parts[1];
    });
  });
  if (!exists) return false;

  var list = golmokSavedKeys();          /* 이미 정리된(존재하는 것만) 목록 */
  var at = list.indexOf(key);
  var was = at !== -1;

  if (was) list.splice(at, 1);
  else list.push(key);
  if (list.length > MAX) list = list.slice(list.length - MAX);

  try {
    localStorage.setItem('golmok-saved', JSON.stringify(list));
  } catch (e) {
    return was;                          /* 쓰기 실패 — 아무것도 바뀌지 않았다 */
  }
  return !was;
}
