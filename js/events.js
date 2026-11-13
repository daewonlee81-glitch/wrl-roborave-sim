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
    desc: '스모봇 · 라인 팔로잉 · 미들봇 · 사커봇 RC',
    color: '#ff8a4c', rulesUrl: 'https://worldrobotleague.net/rules/roborave/',
    events: ['sumo', 'line', 'middlebot', 'soccer_rc'],
  },
};

export const EVENTS = {
  humanoid_battle: {
    name: '휴머노이드 배틀', en: 'Humanoid Battle', league: 'wrl', icon: 'humanoid_battle',
    play: 'control', kind: 'versus', engine: 'humanoid', status: 'soon',
    src: 'https://worldrobotleague.net/rules/humanoid-battle/',
    rules: [
      '1:1 대결 토너먼트 — 상대를 넘어뜨리거나(다운) 경기장 밖으로 밀어내 점수를 얻습니다',
      '경기 3분, 다운이 많은 쪽이 판정승 · 동점이면 1분 연장(먼저 다운을 뺏으면 승리, 골든 다운)',
      '5다운이면 TKO · 다운 뒤 10카운트 안에 기본자세로 돌아오지 못하면 KO패',
      '링아웃·5초 이상 움직이지 않음(스탠딩 다운)도 1다운 · 다리 사이를 밀어 앞뒤로 넘어뜨리면 2다운',
      '경기장: 체급에 따라 90 × 90 cm ~ 약 198 × 198 cm, 두 로봇은 가운데 "11" 선 뒤에서 마주 보고 출발',
    ],
    sim: ['로봇: Dynamic-Makers의 MAX-E1 휴머노이드 · 모션을 엑스박스 버튼에 연결'],
  },
  humanoid_relay: {
    name: '휴머노이드 릴레이', en: 'Humanoid Relay', league: 'wrl', icon: 'humanoid_relay',
    play: 'control', kind: 'record', engine: 'humanoid', status: 'soon',
    src: 'https://worldrobotleague.net/rules/humanoid-relay/',
    rules: [
      '새 종목 — 체급 구분 없이 모든 선수가 함께 겨루는 통합 리그',
      '대회 당일 선수끼리 연합(얼라이언스)을 만들어 미션을 함께 풀고 기록으로 순위를 정합니다',
      '세부 규정(코스·미션·시간·점수)은 아직 공개 전입니다',
    ],
    sim: ['세부 규정이 나오기 전까지 가상 코스(걷기 → 바통 넘기기 → 미션)로 연습합니다'],
  },
  curling: {
    name: '로봇 컬링', en: 'Robot Curling', league: 'wrl', icon: 'curling',
    play: 'control', kind: 'versus', engine: 'curling', status: 'soon',
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
    sim: [],
  },
  othello: {
    name: '로봇배틀 오셀로', en: 'Robot Battle Othello', league: 'wrl', icon: 'othello',
    play: 'control', kind: 'versus', engine: 'rc', status: 'ready',
    src: 'https://worldrobotleague.net/rules/othello/',
    divisions: [{ key: 'othello', name: '경기장 v1 (팔각 198 cm)', rs: 'othello' }, { key: 'othello2', name: '경기장 v2 (2396 × 1196 mm)', rs: 'othello2' }],
    rules: [
      '두 가지 색의 미션 블록 11개(원판 10 · 가운데 판 1)를 내 색으로 뒤집는 경기, 2분',
      '11개를 모두 내 색으로 만들면 즉시 승리(콜드게임) · 시간이 끝나면 바닥에 평평하게 놓인 내 색 블록 1개당 1점',
      '시작 신호 뒤 180° 돌아 스타트 타깃(노란 콘)을 먼저 치워야 합니다 — 그 전에 블록·상대를 건드리면 실격',
      '경기장에는 벽이 없습니다 · 로봇이 떨어지면 실격, 내 팀 블록을 떨어뜨려도 실격',
      '로봇 500 g 이하 · 무선 조종 · 상대 밀기·잡기·들기·뒤집기 금지',
      '동점이면 1분 골든포인트',
    ],
    sim: ['플리퍼: A 90° · B 45° · Y 16° (누르는 동안 유지) — OT 로봇 Pybricks 프로그램과 같은 동작'],
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
    play: 'code', kind: 'versus', engine: 'auto', status: 'soon',
    src: 'https://worldrobotleague.net/rules/roborave/',
    rules: [
      '자율 로봇 1:1 대결 · 지름 800 mm 검은 원형 경기장, 가장자리 5 cm 흰 테두리',
      '로봇: 25 × 18 cm 이내(높이 제한 없음), 1 kg 클래스 · 파괴형 장치 금지',
      '두 로봇은 가운데에서 등을 맞대고 출발 → 3초 대기 → 가장자리를 찍고 와서 대결',
      '먼저 경기장 밖 바닥에 닿은 로봇이 집니다 · 한 경기 3분, 두 번 먼저 이기면 승리',
    ],
    sim: ['워드블럭으로 프로그램을 만들어 로봇에 넣고 경기합니다 (컬러 센서 · 거리 센서 사용)'],
  },
  line: {
    name: '라인 팔로잉', en: 'Line Following', league: 'roborave', icon: 'line',
    play: 'code', kind: 'record', engine: 'auto', status: 'soon',
    src: 'https://worldrobotleague.net/rules/roborave/',
    rules: [
      '120 × 180 cm 흰 트랙의 검은 선을 따라 타워까지 갔다 돌아오는 자율 주행 경기, 3분',
      '선 폭 ES·MS 1.25 cm, HS 0.75 cm · 교차로 ES 0개, MS 1개, HS 2개',
      '타워에 공을 넣고 출발점으로 돌아오기 → 이후 정해진 개수만큼 공을 더 배달하면 보너스',
      '경기 내내 선 따라가기 프로그램이 로봇을 움직여야 합니다 · 로봇을 만지면 출발점으로',
    ],
    sim: ['라운드마다 가상 팀의 기록을 넘어야 다음 라운드로 올라갑니다'],
  },
  middlebot: {
    name: '미들봇', en: 'MiddleBot', league: 'roborave', icon: 'middlebot',
    play: 'code', kind: 'record', engine: 'auto', status: 'soon',
    src: 'https://worldrobotleague.net/rules/roborave/',
    rules: [
      '240 × 180 cm 경기장: 회색 출발 매트, 노란 분류 매트, 가운데 블록 구역, 신호등 기둥',
      '출발 뒤 기둥 버튼을 눌러 시작 → 다른 기둥을 눌러 빨강·파랑·초록 세 색이 모두 나오게 합니다',
      '블록(빨강·파랑·초록 약 7 cm)을 옆 신호등 색과 같은 노란 매트에 놓으면 점수, 쌓으면 배수',
      '출발 구역으로 돌아와 버튼을 누르면 시간 정지 · 조건을 다 채우면 남은 시간도 점수',
      '팀마다 최대 5번 도전, 상위 3번 점수 합산 · MS·HS 디비전',
    ],
    sim: ['라운드마다 가상 팀의 기록을 넘어야 다음 라운드로 올라갑니다'],
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
export function aiSkill(engine, level) {
  if (engine === 'rc') return +(0.42 + 0.53 * level).toFixed(2); // 0.50 · 0.66 · 0.80 · 0.95
  return +(0.3 + 0.7 * level).toFixed(2);
}
