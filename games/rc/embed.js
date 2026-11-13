// embed.js — 대회 시뮬레이터 서비스(상위 화면)에 들어갈 때만 동작하는 연결 코드.
// index.html(Robomakers_Simul 조종 시뮬레이터) 본체 뒤에 불러옵니다. 본체 코드는 고치지 않고 window.__sim 훅만 씁니다.
//   ?embed=1&rs=<규칙 키>&ai=<상대 실력 0.3~1>&mate=<팀원 실력>&mode=practice|match&title=..&opp=..&team=<팀당 로봇 수>
// 경기가 끝나면 상위 화면에 postMessage({type:'wrlsim:result', ...})를 보냅니다.
const P = new URLSearchParams(location.search);
if (P.get('embed') === '1') {
  const sim = window.__sim;
  const $ = s => document.querySelector(s);
  const mode = P.get('mode') || 'practice';
  const post = msg => { try { parent.postMessage(Object.assign({ source: 'wrlsim' }, msg), '*'); } catch (e) {} };

  // 규칙·상대 설정
  const rs = P.get('rs') || 'mrc_open';
  sim.applyRS(rs);
  const S = sim.S;
  if (P.get('team')) { S.teamSize = +P.get('team'); const ts = $('#teamSize'); if (ts) ts.value = S.teamSize; }
  S.aiOpp = Math.max(0.3, Math.min(1, +(P.get('ai') || 0.7)));
  S.aiMate = Math.max(0.3, Math.min(1, +(P.get('mate') || 0.75)));
  S.tie = mode === 'match' ? 'golden' : 'draw';
  S.practice = P.get('free') === '1';
  for (const [id, v] of [['#aiOpp', S.aiOpp], ['#aiMate', S.aiMate], ['#tieMode', S.tie]]) { const el = $(id); if (el) el.value = v; }
  sim.setupMatch(); sim.G.phase = 'idle';

  // 화면 정리: 설정 패널은 숨기고, 대진표 경기에서는 설정을 못 바꾸게 함
  $('#panel').classList.add('hidden');
  if (mode === 'match') { $('#togglePanel').style.display = 'none'; document.querySelector('.tabs button[data-tab=net]')?.remove(); }
  else document.querySelector('.tabs button[data-tab=net]')?.remove();

  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const card = $('#overlay .card');
  const title = P.get('title') || '';
  const opp = P.get('opp') || '';
  const keepPad = card.querySelector('label.row');
  const keepBtns = card.querySelector('.btns');
  card.innerHTML = `<h1>${esc(title)}</h1>` +
    (opp ? `<p style="font-size:16px">상대: <b>${esc(opp)}</b> · 상대 AI 실력 <b>${Math.round(S.aiOpp * 100)}%</b></p>` : `<p>자유 연습 · 상대 AI 실력 <b>${Math.round(S.aiOpp * 100)}%</b></p>`) +
    `<p class="note">엑스박스 컨트롤러를 블루투스로 연결하고 아래 스위치를 켠 뒤 버튼을 한 번 누르세요. 키보드: W/S 전후진 · A/D 회전 · Space 액션 · C 카메라 · P 일시정지.</p>` +
    (mode === 'match' ? `<p class="note">대진표 경기: 동점이면 골든골 / 골든포인트로 승부를 냅니다.</p>` : '');
  card.appendChild(keepPad); card.appendChild(keepBtns);
  $('#startBtn').textContent = '경기 시작';

  // 나가기 버튼
  const exit = document.createElement('button');
  exit.className = 'btn'; exit.textContent = '← 나가기';
  exit.style.cssText = 'position:absolute;left:10px;top:10px;z-index:6';
  exit.addEventListener('click', () => post({ type: 'wrlsim:exit' }));
  $('#view').appendChild(exit);
  $('#side').style.top = '50px';

  // 결과 감시
  let sent = false;
  const watch = () => {
    const G = sim.G;
    if (!sent && G.ended) {
      sent = true;
      const me = S.myTeam;
      const score = [G.score[me], G.score[1 - me]];
      const result = G.winner < 0 ? 'draw' : (G.winner === me ? 'win' : 'loss');
      setTimeout(() => post({ type: 'wrlsim:result', result, score, detail: G.endMsg || '' }), 2500);
    }
    if (sent && !G.ended) sent = false; // 다시 시작함
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
  post({ type: 'wrlsim:ready' });
}
