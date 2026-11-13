# WRL · RoboRAVE 대회 시뮬레이터

월드로봇리그(WRL)와 로보레이브 코리아 오픈 종목을 브라우저에서 연습하는 웹 시뮬레이터입니다.
종목을 고르고 가상 상대와 겨루며, 16팀 대진표에서 이길 때마다 다음 상대가 강해집니다.

**▶ 웹에서 바로 실행:** https://daewonlee81-glitch.github.io/wrl-roborave-sim/ (Chrome · Edge 권장)

## 종목

| 리그 | 종목 | 방식 | 상태 |
|---|---|---|---|
| WRL | 휴머노이드 배틀 | 조종형 (ROBOTIS MAX-E1 공식 모션 ↔ 엑스박스 버튼, 가상 상대 MAX-E1) | ✅ |
| WRL | 휴머노이드 릴레이 (MAX-E1 4대 · U자 코스) | 조종형 · 기록 도전 | ✅ (세부 규정 공개 전 — 사진 기반 가상 코스) |
| WRL | 로봇 컬링 (드라이브 · 휴머노이드 MAX-E1) | 조종형 | ✅ |
| WRL | 로봇배틀 오셀로 | 조종형 · 자율형(AI 오셀로, 캐드 시뮬레이터) 두 가지 | ✅ |
| WRL | MRC 축구 (Open·LEGO · Micro) | 조종형 | ✅ |
| RoboRAVE | 스모봇 | 자율형 (로보메이커스 캐드 시뮬레이터 · 가상 상대 · 3판 2선승) | ✅ |
| RoboRAVE | 라인 팔로잉 (ES · MS · HS) | 자율형 · 기록 도전 (캐드 시뮬레이터 · 탁구공 호퍼) | ✅ |
| RoboRAVE | 미들봇 | 조종형 · 기록 도전 (메카넘 4WD + EEZYbotARM 흡착 로봇) | ✅ |
| RoboRAVE | 사커봇 RC | 조종형 | ✅ |

규정 요약은 [worldrobotleague.net/rules](https://worldrobotleague.net/rules/)를 바탕으로 했습니다. 규정은 바뀔 수 있으니 대회 전 공식 페이지를 확인하세요.

## 구성

| 경로 | 내용 |
|---|---|
| `index.html`, `js/`, `css/` | 첫 화면 · 종목 선택 · 규정 요약 · 대진표 (빌드 없음, ES 모듈) |
| `js/events.js` | 종목 정의와 규정 요약, 라운드별 난이도 |
| `js/tournament.js` | 16팀 대진표, 가상 팀 경기 결과, 진행 저장(localStorage) |
| `games/rc/` | 조종 시뮬레이터 ([Robomakers_Simul](https://github.com/daewonlee81-glitch/Robomakers_Simul)) + `embed.js` 연결 코드 |
| `games/cad/` | [로보메이커스 캐드](https://github.com/daewonlee81-glitch/mindstorms-cad) 시뮬레이터를 같은 사이트(`/mindstorms-cad/`)에서 불러와 대회 진행을 붙이는 화면 + `wrl-addon.js` (스모 가상 상대 · AI 오셀로 판정) + `wrl-line.js` (라인 팔로잉: 속이 빈 타워 · 탁구공 호퍼 · 물리엔진 공 · 점수) · `robots/` 기본 로봇 도면 (스모 CUP + 예제 프로그램, 오셀로 AI OTAI, 라인 팔로잉 LC) |
| `games/middlebot/` | 미들봇 조종 시뮬레이터 — 메카넘 4WD + EEZYbotARM 흡착 로봇, 신호등 기둥·블록 쌓기 점수 (경기장 배치·점수표는 `CFG`에 모은 가정값) |
| `games/humanoid/` | 휴머노이드 배틀 — MAX-E1을 Dynamic-Makers와 같은 방식으로 렌더링(ROBOTIS STEP 부품 메시 `parts-data.js` + 부품 조립 `maxe1-cad.json`), 공식 예제 모션(`maxe1-motions.json`, © ROBOTIS), 타격·다운·링아웃·KO 판정, 가상 상대 AI · 모델·모션·넘어짐 코드는 `maxe1.js` 공용 모듈 |
| `games/curling/` | 로봇 컬링 — 3000 × 1000 mm 경기장 · 하우스 점수 · 블록 미끄럼(쿨롱 마찰, 마찰값은 가정) · 드라이브(집게 + 스트라이커) / 휴머노이드(MAX-E1 킥) 디비전 · 동시에 진행하는 가상 상대 |
| `games/relay/` | 휴머노이드 릴레이 — U자 코스(레인 2줄 · 먼 끝 연결) · 4구간 바통 · 막대 넘기 · 주사위(물리) · 파란 콘 터치 · 레인 이탈 · 가상 팀원 AI (코스 치수 · 벌점은 가정) |
| `img/` | WRL 2027 포스터의 로고와 종목 마스코트 |
| `vendor/` | three.js 0.160 (MIT), cannon-es 0.20 (MIT) |

경기 화면은 iframe으로 열리고, 경기가 끝나면 `postMessage({source:'wrlsim', type:'wrlsim:result', result, score})`로 결과를 돌려줍니다.
캐드 연결 화면은 `daewonlee81-glitch.github.io`에서 열어야 합니다 (캐드와 같은 출처). 로컬에서는 두 리포를 한 폴더에 나란히 두고 그 폴더에서 웹 서버를 여세요.
새 종목 엔진도 같은 방식(`games/<엔진>/index.html?embed=1&mode=match|practice&level=0~1`)으로 붙입니다.

## 로컬 실행
ES 모듈을 쓰므로 파일을 더블클릭하지 말고 간단한 웹 서버로 엽니다.
```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## 라이선스 · 출처
- 부품 형상: LDraw.org Parts Library (CC BY 4.0)
- 3D: three.js (MIT) · 물리: cannon-es (MIT)
- 제작 · 문의: IREA · RoboMakers · robot-league@naver.com
