// embed.js — 대회 시뮬레이터 서비스에 스모 워드블럭 시뮬레이터(roborave-sumo-simulator)를 연결합니다.
// 본체(index.html)는 고치지 않고, 본체의 전역 이름(FIGHT·LVL·OPP_SEL·finish·reset…)을 그대로 씁니다.
//   ?embed=1&mode=match|practice&level=0~1&title=..&opp=..
// 경기 방식: 한 판 60초(무승부 선언) · 먼저 2판을 이긴 쪽 승리, 최대 3판 (로보레이브 코리아 오픈 스모 규정).
(function () {
  const P = new URLSearchParams(location.search);
  if (P.get('embed') !== '1') return;
  const post = msg => { try { parent.postMessage(Object.assign({ source: 'wrlsim' }, msg), '*'); } catch (e) {} };
  const mode = P.get('mode') || 'practice';
  const level = Math.max(0, Math.min(1, +(P.get('level') || 0.3)));
  const lvl = Math.max(1, Math.min(5, 1 + Math.round(level * 4)));   // 16강 2단계 · 8강 3 · 4강 4 · 결승 5
  const escH = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // 내 프로그램 저장·복원 (대진표를 이어서 할 때 다시 만들지 않도록)
  const KEY = 'wrlsim.sumo.script';
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j && Array.isArray(j.prog) && j.prog.length && validProg(j.prog)) {
      (j.vars || []).forEach(v => { if (!VARS.includes(v)) VARS.push(v); });
      SCRIPT = reassignIds(snapshot(j.prog)); renderScript();
    }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ prog: snapshot(SCRIPT), vars: VARS })); } catch (e) {} };
  const _md = markDirty; markDirty = function () { _md(); save(); };
  document.addEventListener('pointerup', () => setTimeout(save, 50), true);

  // 상대: 단계(lvl)의 두 로봇 중 하나
  FIGHT.mode = 'vs';
  document.querySelectorAll('#fightSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fm === 'vs')));
  LVL = lvl; $('lvlSel').value = String(lvl); initOppSel();
  const pool = OPPONENTS.filter(o => o.lvl === lvl);
  OPP_SEL = pool[Math.floor(Math.random() * pool.length)].id; $('oppSel').value = OPP_SEL;
  MATCH = 60; const pm = $('p_match'); if (pm) pm.value = 60;
  RUNSRC = null; reset();
  if (mode === 'match') {
    for (const id of ['lvlSel', 'oppSel']) $(id).disabled = true;
    document.querySelectorAll('#fightSeg button').forEach(b => { b.disabled = true; });
  }

  // 위쪽 안내 막대
  const bar = document.createElement('div');
  bar.id = 'wrlbar';
  bar.innerHTML = `<style>
    #wrlbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 14px;background:#2b3150;color:#eef0f8;font:600 14px system-ui,"Malgun Gothic",sans-serif;box-shadow:0 2px 10px #0004}
    #wrlbar button{font:inherit;border:1px solid #545c86;background:#3a4166;color:#fff;border-radius:8px;padding:5px 12px;cursor:pointer}
    #wrlbar .t{font-size:15px}
    #wrlbar .op{color:#ffd25a}
    #wrlbar .sc{margin-left:auto;display:flex;gap:6px;align-items:center}
    #wrlbar .sc i{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid #8a90b8}
    #wrlbar .sc i.w{background:#2C7BF2;border-color:#2C7BF2}#wrlbar .sc i.l{background:#E8402E;border-color:#E8402E}#wrlbar .sc i.d{background:#c9a227;border-color:#c9a227}
    #wrlbar .help{font-weight:400;color:#c4c8e0;font-size:12px;width:100%}
  </style>
  <button id="wrlExit">← 나가기</button>
  <span class="t">${escH(P.get('title') || '스모봇')}</span>
  ${P.get('opp') ? `<span>상대 팀 <b class="op">${escH(P.get('opp'))}</b></span>` : ''}
  <span>상대 로봇 <b class="op" id="wrlOpp"></b> · ${lvl}단계</span>
  <span class="sc" id="wrlSc"></span>
  <span class="help">워드블럭으로 내 로봇 프로그램을 만든 뒤 <b>연결 → 스트리밍 → ▶ 실행</b>(또는 다운로드 후 허브 가운데 버튼)으로 한 판씩 겨룹니다. 먼저 <b>2판</b>을 이기면 승리 · 한 판 60초가 지나면 무승부 · 만든 프로그램은 자동 저장됩니다.</span>`;
  document.body.prepend(bar);
  $('wrlExit').addEventListener('click', () => post({ type: 'wrlsim:exit' }));
  const om = oppMeta(); $('wrlOpp').textContent = `${om.flag} ${oname(om)}`;

  // 3판 2선승
  const bouts = [];
  const paint = () => {
    const w = bouts.filter(b => b === 'w').length, l = bouts.filter(b => b === 'l').length;
    $('wrlSc').innerHTML = `판 ${bouts.length}/3 &nbsp;` + [0, 1, 2].map(i => `<i class="${bouts[i] || ''}" title="${i + 1}판"></i>`).join('') + ` &nbsp;<span>${w} : ${l}</span>`;
    return { w, l };
  };
  paint();
  let done = false;
  const _finish = finish;
  finish = function (kind) {
    const wasOver = M && M.over;
    _finish(kind);
    if (wasOver || !M || M.headless || M.mode !== 'vs' || done) return;
    const r = kind === '승리' ? 'w' : kind === '패배' ? 'l' : (kind === '무승부' || kind === '시간 종료') ? 'd' : (kind === '이탈' ? 'l' : null);
    if (!r) return; // 사용자 정지·프로그램 종료는 판으로 치지 않음
    bouts.push(r);
    const { w, l } = paint();
    if (w >= 2 || l >= 2 || bouts.length >= 3) {
      done = true;
      const result = w > l ? 'win' : w < l ? 'loss' : 'draw';
      const detail = `스모 ${bouts.length}판 · 상대 로봇 ${oname(om)}`;
      setTimeout(() => post({ type: 'wrlsim:result', result, score: [w, l], detail }), 1800);
    }
  };
  post({ type: 'wrlsim:ready' });
})();
