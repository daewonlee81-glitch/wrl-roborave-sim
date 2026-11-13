// 종목 정의 — 규정 요약은 worldrobotleague.net/rules 의 각 종목 페이지를 바탕으로 정리했습니다.
// kind: versus(상대와 1:1·팀 대결, 대진표) | record(기록 도전, 라운드마다 가상 팀의 기록을 넘어야 함)
// play: control(조종형, 엑스박스 컨트롤러) | code(자율형, 워드블럭으로 프로그램)
// engine: rc(조종 시뮬레이터) | auto(자율형 코딩 시뮬레이터) | humanoid(MAX-E1 휴머노이드) — status 'soon'이면 준비 중

export const LEAGUES = {
  wrl: {
    name: 'WRL', full: 'World Robot League', sub: '월드로봇리그',
    desc: '휴머노이드 · 로봇 컬링 · 오셀로 · MRC 축구',
    color: '#f2b631', rulesUrl: 'https://worldrobotleague.net/rules/',
    events: ['humanoid_battle', 'humanoid_relay', 'curling', 'othello', 'mrc'],
  },
  roborave: {
    name: 'RoboRAVE', full: 'RoboRAVE Korea Open', sub: '로보레이브 코리아 오픈',
    desc: '스모봇 · 라인 팔로잉 (자율형) · 미들봇 · 사커봇 RC (조종형)',
    color: '#ff8a4c', rulesUrl: 'https://worldrobotleague.net/rules/roborave/',
    events: ['sumo', 'line', 'middlebot', 'soccer_rc'],
  },
};

export const EVENTS = {
  humanoid_battle: {
    name: '휴머노이드 배틀', en: 'Humanoid Battle', league: 'wrl', icon: 'humanoid_battle',
    play: 'control', kind: 'versus', engine: 'humanoid', status: 'ready',
    src: 'https://worldrobotleague.net/rules/humanoid-battle/',
    rules: [
      '1:1 대결 토너먼트 — 상대를 넘어뜨리거나(다운) 경기장 밖으로 밀어내 점수를 얻습니다',
      '경기 3분, 다운이 많은 쪽이 판정승 · 동점이면 1분 연장(먼저 다운을 뺏으면 승리, 골든 다운)',
      '5다운이면 TKO · 다운 뒤 10카운트 안에 기본자세로 돌아오지 못하면 KO패',
      '링아웃·5초 이상 움직이지 않음(스탠딩 다운)도 1다운 · 다리 사이를 밀어 앞뒤로 넘어뜨리면 2다운',
      '경기장: 체급에 따라 90 × 90 cm ~ 약 198 × 198 cm, 두 로봇은 가운데 "11" 선 뒤에서 마주 보고 출발',
    ],
    sim: ['로봇: ROBOTIS MAX-E1 (Dynamic-Makers와 같은 몸체 치수 · 관절 방향) · 1.2 kg → 밴텀급 경기장 120 × 120 cm', '엑스박스 버튼마다 공식 예제 모션: D패드 걷기·돌기 · LT 옆걸음 · RT 빠르게 · A 펀치 · B/X 팔 옆 공격 · RB/LB 킥 · 오른스틱 훅 · 왼스틱 막기 · Y 일어서기', '판정: 모션 재생 + 간이 판정 — 손발 끝이 상대 몸에 닿으면 타격, 힘과 자세(킥 중에는 불안정)에 따라 다운', '가상 상대 MAX-E1: 라운드가 올라갈수록 반응 · 조준 · 막기 · 공격 선택 · 일어서기가 좋아집니다'],
  },
  humanoid_relay: {
    name: '휴머노이드 릴레이', en: 'Humanoid Relay', league: 'wrl', icon: 'humanoid_relay',
    play: 'control', kind: 'record', engine: 'relay', status: 'ready',
    src: 'https://worldrobotleague.net/rules/humanoid-relay/',
    rules: [
      '새 종목 — 체급 구분 없이 모든 선수가 함께 겨루는 통합 리그',
      '대회 당일 선수끼리 연합(얼라이언스)을 만들어 미션을 함께 풀고 기록으로 순위를 정합니다',
      '세부 규정(코스·미션·시간·점수)은 아직 공개 전입니다',
    ],
    sim: ['세부 규정이 나오기 전까지 대회 사진을 바탕으로 만든 코스로 연습합니다 (치수 · 벌점은 가정)', 'U자 코스(흰 레인 2줄 · 폭 60 cm · 길이 4 m)를 MAX-E1 4대가 4구간으로 이어 달림 — 내가 1구간을 맡고 나머지는 가상 팀원(AI)', '1구간 검은 막대 넘기 → 2구간 파란 트레이의 주사위를 킥으로 꺼내기 → 3구간 먼 끝 파란 콘 터치 · 돌기 → 4구간 막대 넘어 결승', '앞 로봇이 구간 경계의 다음 로봇에 닿으면 출발 · 넘어지면 일어서야 계속 · 레인 밖으로 떨어지면 구간 출발점으로', '막대는 빠른 걸음 · 대각선 · 옆걸음으로 넘으면 걸려 넘어지기 쉬움 · 기록 = 완주 시간 + 벌점(주사위 +15초 · 콘 +10초)', '라운드마다 가상 얼라이언스의 기록보다 빨리 완주해야 다음 라운드로'],
  },
  curling: {
    name: '로봇 컬링', en: 'Robot Curling', league: 'wrl', icon: 'curling',
    play: 'control', kind: 'versus', engine: 'curling', status: 'ready',
    src: 'https://worldrobotleague.net/rules/curling/',
    divisions: [{ key: 'drive', name: '드라이브 (바퀴 로봇)' }, { key: 'humanoid', name: '휴머노이드' }],
    rules: [
      '경기장 3000 × 1000 mm: 빨강 진영 · 회색 중앙 구역 · 파랑 진영, 가운데에 하우스(과녁)',
      '하우스: 노랑 Ø500 1점 · 주황 Ø300 3점 · 초록 Ø150 5점 · 검정 Ø30 중심 50점',
      '컬링 블록: 40 mm 정육면체 10 g, 팀당 10개 · 블록을 던지면(공중에 뜨면) 안 됩니다',
      '경기 2분, 두 팀이 동시에 진행 · 대진표 경기에서 블록이 검정 중심에 닿으면 즉시 승리(콜드게임)',
      '승부: 콜드게임 → 초록 블록 수 → 주황 → 노랑 순 · 회색 구역에 바퀴가 모두 들어가면(휴머노이드는 두 발) 실격',
      '드라이브: 500 g 이하, 20 × 20 × 20 cm 이내 · 휴머노이드: 팔 260 mm, 그리퍼 폭 100 mm 이하 · 모두 무선 조종',
    ],
    sim: ['드라이브: 바퀴 로봇을 조종해 집게(A)로 블록을 잡고, LT를 누르는 동안 스트라이커 힘을 모았다가 떼면 블록이 바닥을 미끄러져 나갑니다', '휴머노이드: MAX-E1으로 블록 뒤에 서서 RB · LB를 누르고 있다가 떼면 오른발 · 왼발 킥 (힘은 누른 시간만큼)', '가상 상대는 반대편 파랑 진영에서 동시에 블록을 보냅니다 — 라운드가 올라갈수록 조준 · 힘 조절이 정확해지고 상대 블록을 쳐내기도 합니다', '블록과 매트 사이 마찰(미끄러지는 거리)은 공식 규정에 없어 가정한 값입니다'],
  },
  othello: {
    name: '로봇배틀 오셀로', en: 'Robot Battle Othello', league: 'wrl', icon: 'othello', mixed: true,
    play: 'control', kind: 'versus', engine: 'rc', status: 'ready',
    src: 'https://worldrobotleague.net/rules/othello/',
    divisions: [{ key: 'othello', name: '🎮 조종형 — 엑스박스 컨트롤러로 조종', rs: 'othello' }, { key: 'ai', name: '🧩 자율형 — AI 오셀로 (AI 카메라 · 워드블럭 프로그램)', engine: 'cad', task: 'othello_ai', play: 'code' }],
    rules: [
      '두 가지 색의 미션 블록 11개(원판 10 · 가운데 판 1)를 내 색으로 뒤집는 경기, 2분',
      '11개를 모두 내 색으로 만들면 즉시 승리(콜드게임) · 시간이 끝나면 바닥에 평평하게 놓인 내 색 블록 1개당 1점',
      '시작 신호 뒤 180° 돌아 스타트 타깃(노란 콘)을 먼저 치워야 합니다 — 그 전에 블록·상대를 건드리면 실격',
      '경기장에는 벽이 없습니다 · 로봇이 떨어지면 실격, 내 팀 블록을 떨어뜨려도 실격',
      '로봇 500 g 이하 · 무선 조종 · 상대 밀기·잡기·들기·뒤집기 금지',
      '동점이면 1분 골든포인트',
    ],
    sim: ['조종형과 자율형 두 가지로 진행합니다 — 오른쪽 「조종형 · 자율형」에서 고르세요', '조종형: 플리퍼 A 90° · B 45° · Y 16° (누르는 동안 유지) — OT 로봇 Pybricks 프로그램과 같은 동작', '자율형: 오셀로 AI 로봇 OTAI(허스키렌즈 · 컬러 센서 2개 · 플리퍼, 예제 블록 프로그램 포함)를 불러와 로보메이커스 캐드 시뮬레이터에서 자율 경기 — 상대 로봇은 내 프로그램을 반대편에서 실행하고 라운드마다 빨라집니다'],
  },
  mrc: {
    name: 'MRC 축구', en: 'MRC Soccer', league: 'wrl', icon: 'mrc',
    play: 'control', kind: 'versus', engine: 'rc', status: 'ready',
    src: 'https://worldrobotleague.net/rules/mrc-soccer/',
    divisions: [{ key: 'open', name: 'Open Hardware · LEGO (3 대 3)', rs: 'mrc_open' }, { key: 'micro', name: 'Micro (3 대 3)', rs: 'mrc_micro' }],
    rules: [
      'Open · LEGO: 녹색 카펫 2.0 × 4.2 m, 골대 폭 80 cm, 3호 축구공(Ø14 cm)',
      'Micro: 38 × 64 cm 카펫, 탁구공 크기 공',
      '3 대 3, 전·후반 각 2분 · 시간 안에 골을 더 많이 넣은 팀이 승리',
      '로봇: Open·LEGO 20 × 20 × 20 cm · 1,000 g 이하, Micro 5 × 5 × 8 cm · 100 g 이하, 바퀴 구동만',
      '공을 잡거나 붙드는 장치 금지 · 공 부피의 30%까지만 감쌀 수 있음',
    ],
    sim: ['내가 로봇 1대를 조종하고 우리 팀 나머지 로봇은 AI가 움직입니다', 'LT: 슛(킥 모터, Open·LEGO만) · RB: 조종할 로봇 바꾸기'],
  },
  sumo: {
    name: '스모봇', en: 'SumoBot', league: 'roborave', icon: 'sumo',
    play: 'code', kind: 'versus', engine: 'cad', task: 'sumo', status: 'ready',
    src: 'https://worldrobotleague.net/rules/roborave/',
    rules: [
      '자율 로봇 1:1 대결 · 지름 800 mm 검은 원형 경기장, 가장자리 5 cm 흰 테두리',
      '로봇: 25 × 18 cm 이내(높이 제한 없음), 1 kg 클래스 · 파괴형 장치 금지',
      '두 로봇은 가운데에서 등을 맞대고 출발 → 3초 대기 → 가장자리를 찍고 와서 대결',
      '먼저 경기장 밖 바닥에 닿은 로봇이 집니다 · 한 경기 3분, 두 번 먼저 이기면 승리',
    ],
    sim: ['기본 로봇: 스모 로봇 CUP — 모터 2개 · 컬러센서 2개 · 초음파 거리센서와 예제 프로그램(5초 뒤 출발 → 가장자리에 닿으면 돌아서기 → 상대를 찾아 밀어내기). 처음 열 때 자동으로 불러오고 진행 방법에서 다시 불러올 수 있음', '로보메이커스 캐드 시뮬레이터에서 진행 — 캐드에서 만든 로봇과 워드블럭 프로그램, 물리엔진(Rapier), 자동 튜닝 학습 · AI 카메라를 그대로 사용', '가상 상대 로봇: 라운드가 올라갈수록 속도 · 무게 · 반응 · 조준이 좋아집니다 (1~5단계)', '한 판 60초가 지나면 무승부 · 먼저 2판을 이기면 승리', '시뮬레이션 안에서만 진행합니다 — 실제 허브 연결 · 다운로드 기능은 숨김'],
    sim: ['로봇: 메카넘 4WD + EEZYbotARM MK2 진공 흡착 (ESP32 · Bluepad32 펌웨어와 같은 조종 매핑)', '방향키 주행(RT 파워) · LT+←→ 평행이동 · 오른스틱 어깨 · 왼스틱 엘보 · RB+오른스틱 턴테이블 · A 집기 · B 놓기', '경기장 배치와 점수표(기본 10점 × 층수 × 배수, 출발 매트 +20)는 공식 도면 확인 전 가정값입니다', '라운드마다 가상 팀의 기록을 넘어야 다음 라운드로 올라갑니다'],
  },
  line: {
    name: '라인 팔로잉', en: 'Line Following', league: 'roborave', icon: 'line',
    play: 'code', kind: 'record', engine: 'cad', task: 'line', status: 'ready',
    // 기록 경기: 대진표 없이 3번 시도 중 최고 점수로 순위 (첫 왕복 400점 + 보너스 공 개수)
    format: 'record', record: { tries: 3, first: 400, bonus: { es: 75, ms: 125, hs: 200 } },
    src: 'https://worldrobotleague.net/rules/roborave/',
    divisions: [{ key: 'es', name: 'ES (초등) — 교차로 없음 · 선 폭 1.25 cm' }, { key: 'ms', name: 'MS (중등) — 교차로 1개 · 선 폭 1.25 cm' }, { key: 'hs', name: 'HS · UP (고등 · 대학) — 교차로 2개 · 선 폭 0.75 cm' }],
    rules: [
      '120 × 180 cm 흰 트랙의 검은 선을 따라 타워까지 갔다 돌아오는 자율 주행 경기, 3분',
      '선 폭 ES·MS 1.25 cm, HS 0.75 cm · 교차로 ES 0개, MS 1개, HS 2개',
      '타워: 높이 20 cm · 폭 10 cm · 길이 35 cm, 윗면 10 × 10 cm 구멍, 뒤쪽 열림 — 선 끝에 놓임',
      '첫 번째 왕복 400점: 홈 출발 · T 교차로 · 타워 앞 정지 · 공 넣기 · 돌아가기 · 홈 도착 (디비전마다 배점이 다름)',
      '보너스: 성공한 왕복 뒤 공지된 개수(ES 75~125 · MS 125~200 · HS 200~250)를 정확히 배달 — 모자라면 넣은 개수, 넘치면 넘친 만큼 뺌',
      '경기 내내 선 따라가기 프로그램이 로봇을 움직여야 합니다 · 타워를 만지면 400점만 인정 · 로봇을 만지면 출발점으로',
    ],
    sim: ['기본 로봇: 라인 팔로잉 로봇 LC — 모터 2개(A · E) · 컬러센서 2개(B · C) · 힘센서(D). 처음 열 때 모형만 자동으로 불러오고(블록 프로그램은 직접), 진행 방법에서 다시 불러올 수 있음', '로보메이커스 캐드 시뮬레이터의 RoboRAVE 라인 팔로우 ES · MS · HS 경기장 — 선 끝 타워를 규정대로 속이 빈 상자(윗면 구멍)로 만들었습니다', '🏓 탁구공 싣기 토글: 로봇 위 공 넣는 부분(호퍼)에 공을 넣습니다. 공 하나하나(Ø40 mm · 2.7 g)가 물리엔진의 공이라 많이 실을수록 무거워지고, 무게중심이 높아지고, 출발·정지·회전 때 공이 쏠립니다', '호퍼 문은 문을 여는 모터(바퀴 · 센서가 없는 첫 포트)를 30° 넘게 돌리면 열리고 공이 하나씩 나옵니다 — 배출구 높이 · 길이 · 위치는 설정에서 바꿀 수 있음', '홈에 멈춰 있을 때 토글로 공을 더 실어 보너스 공 배달 · 경기는 시뮬레이션 안에서만 진행합니다', '라운드마다 가상 팀의 기록(목표 점수)을 넘어야 다음 라운드로 올라갑니다'],
  },
  middlebot: {
    name: '미들봇', en: 'MiddleBot', league: 'roborave', icon: 'middlebot',
    play: 'control', kind: 'record', engine: 'middlebot', status: 'ready',
    src: 'https://worldrobotleague.net/rules/roborave/',
    rules: [
      '240 × 180 cm 경기장: 회색 출발 매트, 노란 분류 매트, 가운데 블록 구역, 신호등 기둥',
      '출발 뒤 기둥 버튼을 눌러 시작 → 다른 기둥을 눌러 빨강·파랑·초록 세 색이 모두 나오게 합니다',
      '블록(빨강·파랑·초록 약 7 cm)을 옆 신호등 색과 같은 노란 매트에 놓으면 점수, 쌓으면 배수',
      '출발 구역으로 돌아와 버튼을 누르면 시간 정지 · 조건을 다 채우면 남은 시간도 점수',
      '팀마다 최대 5번 도전, 상위 3번 점수 합산 · MS·HS 디비전',
    ],
    sim: ['로봇: 메카넘 4WD + EEZYbotARM MK2 진공 흡착 (ESP32 · Bluepad32 펌웨어와 같은 조종 매핑)', '방향키 주행(RT 파워) · LT+←→ 평행이동 · 오른스틱 어깨 · 왼스틱 엘보 · RB+오른스틱 턴테이블 · A 집기 · B 놓기', '경기장 배치와 점수표(기본 10점 × 층수 × 배수, 출발 매트 +20)는 공식 도면 확인 전 가정값입니다', '라운드마다 가상 팀의 기록을 넘어야 다음 라운드로 올라갑니다'],
  },
  soccer_rc: {
    name: '사커봇 RC', en: 'SoccerBot RC', league: 'roborave', icon: 'soccer_rc',
    play: 'control', kind: 'versus', engine: 'rc', status: 'ready',
    src: 'https://worldrobotleague.net/rules/roborave/',
    divisions: [{ key: 'std', name: 'ES · MS · HS (800 g, 2 대 2)', rs: 'roborave' }],
    rules: [
      '1.20 × 1.80 m 필드, 골 폭 0.50 m · 공은 골프공 크기(Ø42.67 mm, 45.93 g)',
      '팀당 무선 조종 로봇 2대, 15 × 15 × 15 cm 이내, 800 g 클래스',
      '슈팅·잡기·킥·집게·솔레노이드 금지 — 밀어서만 공을 움직입니다',
      '최대 3분 = 전·후반 각 90초, 하프타임에 진영 교체',
      '킥오프: 각 팀 로봇은 자기 진영 모서리, 공은 가운데 · 엉키거나 공이 모서리에 끼면 5초 뒤 재배치',
      '본선 동점은 골든골',
    ],
    sim: ['내가 로봇 1대를 조종하고 팀원 로봇은 AI가 움직입니다 · RB로 조종 로봇 바꾸기'],
  },
};

// 라운드별 상대 난이도(0~1). 대진표 16강 → 8강 → 4강 → 결승.
export const ROUND_NAMES = ['16강', '8강', '4강', '결승'];
export const ROUND_LEVEL = [0.15, 0.45, 0.72, 1.0];
// 엔진별 난이도 → 상대 AI 실력 값
export function targetOf(engine, level, task) { if (engine === 'middlebot') return Math.round(25 + level * 195); if (engine === 'relay') return Math.round(185 - level * 75); if (task === 'line') return Math.round((100 + level * 300) / 5) * 5; return 0; }
export function levelText(engine, level, task) {
  if (engine === 'middlebot' || task === 'line') return `목표 ${targetOf(engine, level, task)}점 넘기기`;
  if (engine === 'relay') return `목표 ${targetOf(engine, level, task)}초 안에 완주`;
  if (engine === 'rc') return `AI ${Math.round(aiSkill('rc', level) * 100)}%`;
  if (engine === 'cad' || engine === 'humanoid' || engine === 'curling') return `상대 로봇 ${1 + Math.round(level * 4)}단계 / 5`;
  return `난이도 ${Math.round(level * 100)}%`;
}
export function aiSkill(engine, level) {
  if (engine === 'rc') return +(0.42 + 0.53 * level).toFixed(2); // 0.50 · 0.66 · 0.80 · 0.95
  return +(0.3 + 0.7 * level).toFixed(2);
}
