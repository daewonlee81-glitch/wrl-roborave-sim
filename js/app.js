import { LEAGUES, EVENTS, ROUND_NAMES, aiSkill, levelText, targetOf } from './events.js';
import { ICONS, LEAGUE_ICONS } from './icons.js';
const MASCOT = k => `<img class="mascot" src="img/mascot/${k}.png" alt="" draggable="false">`;
import * as T from './tournament.js';

const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const store = {
  get(k, d) { try { const v = localStorage.getItem('wrlsim.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('wrlsim.' + k, JSON.stringify(v)); } catch (e) {} },
};

const myName = () => store.get('team', '') || '우리 팀';
const stars = lv => { const n = Math.round(1 + lv * 4); return '★'.repeat(n) + '☆'.repeat(5 - n); };
const playBadge = ev => ev.mixed ? '<span class="badge ctl">🎮 조종형</span> <span class="badge code">🧩 자율형</span>' : ev.play === 'control' ? '<span class="badge ctl">🎮 조종형</span>' : '<span class="badge code">🧩 자율형 · 코딩</span>';
const kindBadge = ev => ev.kind === 'versus' ? '<span class="badge">⚔ 가상 상대와 대결</span>' : '<span class="badge">⏱ 기록 도전</span>';
const divOf = (ev, key) => (ev.divisions || []).find(d => d.key === key) || (ev.divisions || [])[0] || { key: 'std', name: '' };
const tKey = (evKey, div) => evKey + '.' + div;
const eff = (ev, div) => Object.assign({}, ev, { mixed: false, engine: div.engine || ev.engine, play: div.play || ev.play, task: div.task || ev.task });

/* ---------------- 라우팅 ---------------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  closeGame(true);
  if (!h.length) return home();
  if (h[0] === 'league' && LEAGUES[h[1]]) return league(h[1]);
  if (h[0] === 'event' && EVENTS[h[1]]) return h[3] === 'bracket' ? bracket(h[1], h[2]) : eventPage(h[1], h[2]);
  return home();
}
window.addEventListener('hashchange', route);
const go = h => { if (location.hash === h) route(); else location.hash = h; };

/* ---------------- 첫 화면 ---------------- */
function dday() { const d = Math.ceil((new Date('2027-02-19T00:00:00+09:00') - Date.now()) / 864e5); return d > 0 ? 'D-' + d : d === 0 ? 'D-DAY' : '대회 종료'; }
function home() {
  document.title = 'WRL · RoboRAVE 대회 시뮬레이터';
  app.innerHTML = `
  <section class="home">
    <header class="hero">
      <img class="wrl-logo" src="img/wrl-logo.png" alt="WRL">
      <div class="kicker">INTERNATIONAL ROBOTICS COMPETITION · GOYANG, KOREA</div>
      <h1>WORLD ROBOT<br><span class="gold">LEAGUE 2027</span></h1>
      <div class="with">with RoboRAVE Korea Open 2027</div>
      <div class="simname">대회 시뮬레이터</div>
      <p>종목을 고르고 가상 상대와 겨뤄 보세요. 이길수록 다음 상대가 강해집니다.</p>
      <div class="chips">
        <div class="chip"><b>FEB 19 – 21, 2027</b><small>FRI – SUN · 3 DAYS</small></div>
        <div class="chip"><b>Goyang YMCA Youth Center</b><small>GOYANG, GYEONGGI-DO, KOREA</small></div>
        <div class="chip dday"><b>${dday()}</b><small>대회까지</small></div>
      </div>
      <div class="mascots">${[...LEAGUES.wrl.events, ...LEAGUES.roborave.events].map(k => `<a href="#/event/${k}" title="${esc(EVENTS[k].name)}">${MASCOT(EVENTS[k].icon)}</a>`).join('')}</div>
      <label class="team">우리 팀 이름 <input id="teamName" maxlength="16" placeholder="우리 팀" value="${esc(store.get('team', ''))}"></label>
    </header>
    <div class="leagues">
      ${Object.entries(LEAGUES).map(([k, L]) => `
        <a class="league" href="#/league/${k}" style="--c:${L.color}">
          <div class="li">${LEAGUE_ICONS[k]}</div>
          <div class="lt"><b>${L.name}</b><small>${esc(L.full)}</small></div>
          <div class="ls">${esc(L.sub)}</div>
          <div class="ld">${esc(L.desc)}</div>
          <div class="go">종목 고르기 →</div>
        </a>`).join('')}
    </div>
    <footer class="foot">주최 IREA 국제로봇교육협의회 · RoboRAVE Korea · 참가 신청 <a href="https://worldrobotleague.net" target="_blank" rel="noopener">worldrobotleague.net</a><br>규정 출처: <a href="https://worldrobotleague.net/rules/" target="_blank" rel="noopener">worldrobotleague.net/rules</a> · 규정은 바뀔 수 있으니 대회 전 공식 페이지를 확인하세요 · 문의 robot-league@naver.com</footer>
  </section>`;
  $('#teamName').addEventListener('change', e => store.set('team', e.target.value.trim()));
}

/* ---------------- 종목 선택 ---------------- */
function league(k) {
  const L = LEAGUES[k];
  document.title = L.name + ' 종목 — 대회 시뮬레이터';
  app.innerHTML = `
  <section class="page" style="--c:${L.color}">
    <nav class="top"><a href="#/" class="back">← 처음으로</a><span class="crumb">${L.name}</span></nav>
    <h2 class="ttl">${L.name} <small>${esc(L.full)}</small></h2>
    <p class="lead">종목 아이콘을 누르면 규정 요약과 연습·대진표 도전 화면으로 갑니다.</p>
    <div class="grid">
      ${L.events.map(e => { const ev = EVENTS[e]; const t = T.loadT(tKey(e, divOf(ev).key));
        return `<a class="tile ${ev.status}" href="#/event/${e}">
          <div class="ic">${MASCOT(ev.icon)}</div>
          <div class="nm">${esc(ev.name)}</div><div class="en">${esc(ev.en)}</div>
          <div class="bd">${playBadge(ev)}</div>
          ${ev.status === 'soon' ? '<div class="soon">준비 중</div>' : (t ? `<div class="prog">${t.state === 'champion' ? '🏆 우승' : t.state === 'out' ? '탈락' : ROUND_NAMES[t.round] + ' 진행 중'}</div>` : '')}
        </a>`; }).join('')}
    </div>
  </section>`;
}

/* ---------------- 종목 로비 ---------------- */
function eventPage(e, divKey) {
  const ev0 = EVENTS[e], L = LEAGUES[ev0.league], div = divOf(ev0, divKey || store.get('div.' + e, null));
  const ev = eff(ev0, div);
  document.title = ev.name + ' — 대회 시뮬레이터';
  const t = T.loadT(tKey(e, div.key));
  const ready = ev.status === 'ready';
  const practiceLv = store.get('lv.' + e, 0.45);
  app.innerHTML = `
  <section class="page" style="--c:${L.color}">
    <nav class="top"><a href="#/league/${ev.league}" class="back">← ${L.name} 종목</a><span class="crumb">${esc(ev.name)}</span></nav>
    <div class="evhead">
      <div class="ic big">${MASCOT(ev.icon)}</div>
      <div><h2 class="ttl">${esc(ev.name)} <small>${esc(ev.en)}</small></h2><div class="bd">${playBadge(ev)} ${kindBadge(ev)}</div></div>
    </div>
    ${ready ? '' : `<div class="notice">이 종목은 지금 만드는 중입니다. 규정 요약은 먼저 볼 수 있고, 연습·대진표는 다음 업데이트에서 열립니다.</div>`}
    <div class="cols">
      <div class="card rules">
        <h3>규정 요약</h3>
        <ul>${ev.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        ${ev.sim && ev.sim.length ? `<h3>시뮬레이터에서는</h3><ul class="mute">${ev.sim.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
        <p class="src">출처: <a href="${ev.src}" target="_blank" rel="noopener">${ev.src.replace('https://', '')}</a></p>
      </div>
      <div class="side">
        ${ev.divisions && ev.divisions.length > 1 ? `<div class="card"><h3>${ev0.mixed ? '조종형 · 자율형' : '디비전 · 경기장'}</h3>
          <select id="div">${ev.divisions.map(d => `<option value="${d.key}" ${d.key === div.key ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>` : (div.name ? `<div class="card"><h3>디비전</h3><div>${esc(div.name)}</div></div>` : '')}
        <div class="card">
          <h3>🏆 대진표 도전</h3>
          <p class="mute">16팀 토너먼트 · 16강 → 8강 → 4강 → 결승. 이길 때마다 상대 AI가 강해집니다.</p>
          ${t ? `<div class="tstat">${t.state === 'champion' ? '🏆 우승했습니다!' : t.state === 'out' ? `${ROUND_NAMES[t.round]}에서 탈락` : `지금: <b>${ROUND_NAMES[t.round]}</b>`}</div>` : ''}
          <div class="btns">
            ${t && t.state === 'playing' ? `<button class="btn pri" id="cont" ${ready ? '' : 'disabled'}>이어서 하기</button><button class="btn" id="newT" ${ready ? '' : 'disabled'}>새 대진표</button>`
              : `<button class="btn pri" id="newT" ${ready ? '' : 'disabled'}>${t ? '새 대진표로 다시 도전' : '대진표 만들기'}</button>${t ? '<button class="btn" id="cont">지난 대진표 보기</button>' : ''}`}
          </div>
        </div>
        <div class="card">
          <h3>🎯 자유 연습</h3>
          <label class="row">${ev.kind === 'versus' ? '상대 실력' : '연습 목표'} <b id="lvV">${stars(practiceLv)}</b></label>
          <input type="range" id="lv" min="0" max="1" step="0.05" value="${practiceLv}">
          <div class="btns"><button class="btn" id="practice" ${ready ? '' : 'disabled'}>연습 경기</button>
          ${ev.engine === 'rc' ? `<button class="btn" id="free" ${ready ? '' : 'disabled'}>시간 무제한 연습</button>` : ''}</div>
        </div>
        ${ev.play === 'control' ? controlsCard(ev, div.key) : ''}
      </div>
    </div>
  </section>`;
  $('#div')?.addEventListener('change', x => { store.set('div.' + e, x.target.value); go(`#/event/${e}/${x.target.value}`); });
  $('#lv')?.addEventListener('input', x => { store.set('lv.' + e, +x.target.value); $('#lvV').textContent = stars(+x.target.value); });
  $('#newT')?.addEventListener('click', () => {
    if (t && t.state === 'playing' && !confirm('진행 중인 대진표를 지우고 새로 만들까요?')) return;
    T.saveT(tKey(e, div.key), T.newTournament(myName())); go(`#/event/${e}/${div.key}/bracket`);
  });
  $('#cont')?.addEventListener('click', () => go(`#/event/${e}/${div.key}/bracket`));
  $('#practice')?.addEventListener('click', () => openGame(e, div, { mode: 'practice', level: +$('#lv').value }));
  $('#free')?.addEventListener('click', () => openGame(e, div, { mode: 'practice', level: +$('#lv').value, free: true }));
}

function controlsCard(ev, dk) {
  const rows = ev.icon === 'humanoid_battle'
    ? [['D패드 ↑ ↓ / ← →', '걷기 / 제자리 돌기 (RT 빠르게)'], ['LT + D패드 ← →', '옆걸음'], ['A · B · X', '펀치 · 오른팔 옆 공격 · 왼팔 옆 공격'], ['RB · LB', '오른발 킥 · 왼발 킥'], ['오른스틱 ← →', '왼팔 훅 · 오른팔 훅'], ['왼스틱 ← →', '왼쪽 · 오른쪽 막기'], ['Y', '일어서기'], ['View · Menu', '카메라 · 일시정지']]
    : ev.icon === 'middlebot'
    ? [['방향키 ↑ ↓ / ← →', '전진·후진 / 제자리 회전 (50%)'], ['LT + 방향키 ← →', '좌우 평행이동'], ['RT', '파워 50% → 100%'], ['RB + 오른스틱 ← →', '턴테이블 회전'], ['오른스틱 ↕ · 왼스틱 ↕', '어깨 · 엘보'], ['A · B', '흡착 집기 · 놓기'], ['Y', '카메라']]
    : ev.icon === 'curling' && dk === 'humanoid'
    ? [['D패드 ↑ ↓ / ← →', '걷기 / 제자리 돌기'], ['LT + D패드 ← →', '옆걸음'], ['RB · LB (누르고 있다가 떼기)', '오른발 · 왼발 킥 — 누른 시간만큼 세게'], ['Y · View', '카메라'], ['Menu', '일시정지']]
    : ev.icon === 'curling'
    ? [['D패드 ↑ ↓', '전진 · 후진 (기본 50%)'], ['D패드 ← → · 대각선', '포인트 턴 · 스윙턴'], ['RT', '파워 50% → 100%'], ['A', '집게 닫기 · 열기 (블록 잡기)'], ['LT (누르고 있다가 떼기)', '스트라이커 — 누른 시간만큼 세게 침'], ['Y · View', '카메라'], ['Menu', '일시정지']]
    : ev.key === 'othello' || ev.icon === 'othello'
    ? [['D패드 ↑ ↓', '전진 · 후진 (기본 50%)'], ['D패드 ← →', '제자리 회전'], ['RT', '파워 50% → 100%'], ['A · B · Y', '플리퍼 90° · 45° · 16°'], ['키보드 C', '카메라 전환 (Y는 플리퍼)'], ['Menu', '일시정지']]
    : [['D패드 ↑ ↓', '전진 · 후진'], ['D패드 ← →', '포인트 턴'], ['D패드 대각선', '스윙턴'], ['RT', '누르는 동안 파워 100'], ['LT', '슛 (MRC Open·LEGO)'], ['RB', '조종 로봇 바꾸기'], ['Y', '카메라']];
  return `<div class="card"><h3>🎮 엑스박스 컨트롤러</h3>
    <table class="keys">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
    <p class="mute">블루투스로 페어링한 뒤 경기 화면 왼쪽 아래 스위치를 켜고 버튼을 한 번 누르세요. 키보드: W/S · A/D · Space.</p></div>`;
}

/* ---------------- 대진표 ---------------- */
function bracket(e, divKey) {
  const ev0 = EVENTS[e], L = LEAGUES[ev0.league], div = divOf(ev0, divKey);
  const ev = eff(ev0, div);
  const key = tKey(e, div.key);
  let t = T.loadT(key);
  if (!t) return go(`#/event/${e}/${div.key}`);
  document.title = ev.name + ' 대진표 — 대회 시뮬레이터';
  const m = T.myMatch(t), opp = m ? T.opponentOf(t, m) : null;
  const lv = T.levelOf(t.round);
  const champ = T.champion(t);
  const teamCell = (id, match, r) => {
    if (id === null || id === undefined) return `<div class="tm empty">—</div>`;
    const tm = t.teams[id]; const won = match.winner === id, lost = match.winner !== null && match.winner !== id;
    const sc = match.score ? (match.a === id ? match.score[0] : match.score[1]) : '';
    return `<div class="tm ${tm.me ? 'me' : ''} ${won ? 'won' : ''} ${lost ? 'lost' : ''}"><span class="nat">${tm.nat}</span><span class="n">${esc(tm.name)}</span><span class="s">${sc}</span></div>`;
  };
  app.innerHTML = `
  <section class="page wide" style="--c:${L.color}">
    <nav class="top"><a href="#/event/${e}/${div.key}" class="back">← ${esc(ev.name)}</a><span class="crumb">대진표${div.name ? ' · ' + esc(div.name) : ''}</span></nav>
    <div class="bhead">
      <div class="ic">${MASCOT(ev.icon)}</div>
      <h2 class="ttl">${esc(ev.name)} 대진표</h2>
      <div class="sp"></div>
      <button class="btn" id="reset">새 대진표</button>
    </div>
    ${t.state === 'playing' ? `
      <div class="next">
        <div><div class="rd">${ROUND_NAMES[t.round]}</div><div class="vs"><b>${esc(t.teams[0].name)}</b> <span>VS</span> <b>${esc(opp.name)}</b> <span class="nat">${opp.nat}</span></div>
        <div class="mute">상대 실력 <span class="st">${stars(lv)}</span> · ${levelText(ev.engine, lv)}</div></div>
        <button class="btn pri big" id="play">경기 시작 ▶</button>
      </div>` : t.state === 'champion' ? `
      <div class="next win"><div><div class="rd">🏆 우승!</div><div class="vs">${esc(t.teams[0].name)} 팀이 16팀 토너먼트에서 우승했습니다.</div></div><button class="btn pri" id="again">다시 도전</button></div>` : `
      <div class="next out"><div><div class="rd">${ROUND_NAMES[t.round]} 탈락</div><div class="vs">우승: <b>${esc(champ ? champ.name : '-')}</b></div><div class="mute">새 대진표로 다시 도전해 보세요.</div></div><button class="btn pri" id="again">다시 도전</button></div>`}
    <div class="bracket">
      ${t.rounds.map((round, r) => `<div class="col"><div class="ch">${ROUND_NAMES[r]} <small>${stars(T.levelOf(r))}</small></div>
        <div class="ms">${round.map(mt => `<div class="mt ${(mt.a === 0 || mt.b === 0) ? 'mine' : ''}">${teamCell(mt.a, mt, r)}${teamCell(mt.b, mt, r)}</div>`).join('')}</div></div>`).join('')}
      <div class="col champ"><div class="ch">우승</div><div class="ms"><div class="mt trophy">${champ ? `<div class="tm ${champ.me ? 'me won' : 'won'}">🏆 <span class="n">${esc(champ.name)}</span></div>` : '<div class="tm empty">?</div>'}</div></div></div>
    </div>
  </section>`;
  $('#play')?.addEventListener('click', () => openGame(e, div, { mode: 'match', level: lv, opp, round: t.round }));
  const again = () => { T.saveT(key, T.newTournament(myName())); bracket(e, div.key); };
  $('#again')?.addEventListener('click', again);
  $('#reset').addEventListener('click', () => { if (t.state !== 'playing' || confirm('진행 중인 대진표를 지우고 새로 만들까요?')) again(); });
}

/* ---------------- 경기 화면 (iframe) ---------------- */
let GAME = null;
function gameUrl(ev, div, o) {
  const p = new URLSearchParams({ embed: '1', mode: o.mode });
  const title = `${ev.name}${div.name ? ' · ' + div.name : ''}` + (o.mode === 'match' ? ` — ${ROUND_NAMES[o.round]}` : ' — 연습');
  p.set('title', title);
  if (o.opp) p.set('opp', `${o.opp.name} (${o.opp.nat})`);
  if (o.free) p.set('free', '1');
  if (ev.engine === 'rc') { p.set('rs', div.rs); p.set('ai', aiSkill('rc', o.level)); p.set('mate', 0.75); return 'games/rc/index.html?' + p; }
  p.set('event', ev.key || ''); p.set('div', div.key || ''); p.set('level', o.level); if (ev.task) p.set('task', ev.task);
  const tg = targetOf(ev.engine, o.level); if (tg) p.set('target', tg);
  return `games/${ev.engine}/index.html?` + p;
}
function openGame(e, div, o) {
  const ev = Object.assign({ key: e }, eff(EVENTS[e], div));
  closeGame(true);
  const wrap = document.createElement('div'); wrap.id = 'game';
  wrap.innerHTML = `<iframe allow="gamepad; fullscreen; autoplay" src="${gameUrl(ev, div, o)}"></iframe><div class="loading">경기장을 준비하는 중…</div>`;
  document.body.appendChild(wrap); document.body.classList.add('playing');
  const fr = wrap.querySelector('iframe');
  fr.addEventListener('load', () => { wrap.querySelector('.loading')?.remove(); fr.focus(); });
  GAME = { e, div, o, wrap, fr };
}
function closeGame(silent) {
  if (!GAME) return; GAME.wrap.remove(); GAME = null; document.body.classList.remove('playing');
  $('#result')?.remove();
}
window.addEventListener('message', ev => {
  const d = ev.data; if (!d || d.source !== 'wrlsim' || !GAME) return;
  if (d.type === 'wrlsim:exit') { const g = GAME; closeGame(); if (g.o.mode === 'match') bracket(g.e, g.div.key); }
  if (d.type === 'wrlsim:result') showResult(d);
});

function showResult(d) {
  const g = GAME; if (!g) return;
  const ev = EVENTS[g.e];
  const label = d.result === 'win' ? '승리!' : d.result === 'loss' ? '패배' : '무승부';
  const sc = d.score ? `<div class="score">${d.score[0]} : ${d.score[1]}</div>` : '';
  let body = '', btns = '';
  if (g.o.mode === 'match') {
    const key = tKey(g.e, g.div.key); const t = T.loadT(key);
    if (t && t.state === 'playing') {
      const r0 = t.round;
      T.reportResult(t, d.result, d.score, ev.kind); T.saveT(key, t);
      if (d.result === 'draw') { body = '무승부는 다시 경기합니다.'; btns = '<button class="btn pri" data-a="replay">다시 경기</button>'; }
      else if (t.state === 'champion') { body = `🏆 ${esc(t.teams[0].name)} 우승! 결승까지 모두 이겼습니다.`; btns = '<button class="btn pri" data-a="bracket">대진표 보기</button>'; }
      else if (t.state === 'out') { body = `${ROUND_NAMES[r0]}에서 탈락했습니다.`; btns = '<button class="btn pri" data-a="bracket">대진표 보기</button>'; }
      else { const nx = T.opponentOf(t, T.myMatch(t)); body = `${ROUND_NAMES[t.round]} 진출! 다음 상대: <b>${esc(nx.name)}</b> (${nx.nat}) · 실력 ${stars(T.levelOf(t.round))}`;
        btns = '<button class="btn pri" data-a="bracket">대진표 보기</button><button class="btn" data-a="next">바로 다음 경기 ▶</button>'; }
    }
  } else {
    body = '연습 경기가 끝났습니다.'; btns = '<button class="btn pri" data-a="replay">다시 하기</button><button class="btn" data-a="lobby">종목 화면으로</button>';
  }
  $('#result')?.remove();
  const el = document.createElement('div'); el.id = 'result';
  el.innerHTML = `<div class="rcard ${d.result}"><div class="rl">${label}</div>${sc}<div class="rd">${esc(d.detail || '')}</div><p>${body}</p><div class="btns">${btns}</div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', x => {
    const a = x.target.dataset.a; if (!a) return;
    const gg = GAME; el.remove();
    if (a === 'replay') return openGame(gg.e, gg.div, gg.o);
    closeGame();
    if (a === 'bracket') { const h = `#/event/${gg.e}/${gg.div.key}/bracket`; return location.hash === h ? bracket(gg.e, gg.div.key) : go(h); }
    if (a === 'lobby') return eventPage(gg.e, gg.div.key);
    if (a === 'next') { const t = T.loadT(tKey(gg.e, gg.div.key)); const m = T.myMatch(t); if (m) openGame(gg.e, gg.div, { mode: 'match', level: T.levelOf(t.round), opp: T.opponentOf(t, m), round: t.round }); }
  });
}

route();
