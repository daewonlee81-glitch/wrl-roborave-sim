// wrl-addon.js — 로보메이커스 캐드(mindstorms-cad) 시뮬레이터 안에 넣는 대회 시뮬레이터 연결 코드.
// games/cad/index.html(감싸는 화면)이 캐드 문서에 이 스크립트를 넣습니다. 캐드 본체는 고치지 않고 window.__umc · __sim 훅만 씁니다.
//   · 스모: 'RoboRAVE 스모 (대회)' 경기장 — 등을 맞대고 출발, 물리엔진 위의 가상 상대 로봇(난이도별 속도·무게·반응)
//   · AI 오셀로: 'WRL 로봇 배틀 오셀로 AI' 경기장 — 상대 로봇(같은 코드)의 속도를 난이도에 맞춰 조절, 판 수로 승부
(() => {
  'use strict';
  if (window.__wrl) return;
  const U = window.__umc, S = window.__sim;
  if (!U || !S) return;
  const post = m => { try { window.parent.postMessage(Object.assign({ source: 'wrlcad' }, m), '*'); } catch (e) {} };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const W = { task: null, level: 0.3, bout: null, run: null, wasRun: false };

  /* ───────────── 스모 ───────────── */
  const SUMO_KEY = 'sumo_wrl', SUMO_LABEL = 'RoboRAVE 스모 (대회 · 가상 상대)';
  const R_RING = 400; // 경기장 반지름 (mm)
  const oppParams = lv => ({
    vmax: 0.22 + 0.36 * lv,          // m/s
    mu: 0.55 + 0.6 * lv,             // 바퀴 견인 (마찰계수)
    mass: 0.6 + 0.4 * lv,            // kg (1 kg 클래스)
    turn: (100 + 170 * lv) * Math.PI / 180, // rad/s
    react: 0.55 - 0.45 * lv,         // 상대를 다시 찾는 반응 시간 (s)
    aimErr: (24 - 21 * lv) * Math.PI / 180,
    sense: 320 + 380 * lv,           // 상대를 알아보는 거리 (mm)
    edge: 300 + 40 * lv,             // 이 반지름을 넘으면 테두리 조심
  });
  function makeSumoMat() {
    const base = U.mats.sumo; if (!base || U.mats[SUMO_KEY]) return;
    const P = () => oppParams(W.level);
    U.mats[SUMO_KEY] = Object.assign({}, base, {
      key: SUMO_KEY, label: SUMO_LABEL,
      start: { x: -95, z: 0, th: -Math.PI / 2 },           // 가운데에서 등을 맞대고 바깥을 봄
      draw(n) { base.draw(n); n.strokeStyle = '#8a5a00'; n.lineWidth = 6; n.beginPath(); n.moveTo(390, 360); n.lineTo(390, 440); n.moveTo(410, 360); n.lineTo(410, 440); n.stroke(); },
      props: () => [{ kind: 'dummy', shape: 'box', w: 150, d: 150, hgt: 90, mass: P().mass, fr: 0.05, x: 95, z: 0, color: 0xd23a2a, wrlOpp: true }],
      info() {
        const b = W.bout; if (!b) return '';
        return `🤖 가상 상대 · 단계 ${1 + Math.round(W.level * 4)} / 5 · ${b.phase === 'wait' ? '3초 대기' : b.phase === 'edge' ? '테두리로' : b.phase === 'seek' ? '찾는 중' : b.phase === 'charge' ? '돌진' : b.phase}`;
      },
    });
    if (U.i18n) U.i18n[SUMO_LABEL] = ['RoboRAVE Sumo (match · virtual opponent)', 'RoboRAVE 相撲 (大会)', 'RoboRAVE 相扑 (比赛)', 'RoboRAVE Sumo (torneo)'];
    addOpt(SUMO_KEY, SUMO_LABEL, 'sumo');
  }
  function addOpt(key, label, after) {
    const sel = document.querySelector('#simMat'); if (!sel || sel.querySelector(`option[value="${key}"]`)) return;
    const o = document.createElement('option'); o.value = key; o.dataset.ko = label; o.textContent = U.T ? U.T(label) : label;
    const ref = sel.querySelector(`option[value="${after}"]`); if (ref) ref.after(o); else sel.appendChild(o);
  }
  const oppProp = () => (U.props() || []).find(p => p.wrlOpp);
  function sumoStart() {
    const o = oppProp();
    W.bout = { t0: U.time(), phase: 'wait', h: Math.PI / 2, aim: 0, aimT: -1, over: false, sawRun: true };
    if (o && o.body) { try { o.body.setLinvel({ x: 0, y: 0, z: 0 }, true); o.body.setAngvel({ x: 0, y: 0, z: 0 }, true); } catch (e) {} }
  }
  function sumoStep(dt) {
    const b = W.bout, o = oppProp(); if (!b || b.over || !o) return;
    const t = U.time() - b.t0, me = U.pose(), P = oppParams(W.level);
    // 판정: 먼저 경기장 밖으로 나간(떨어진) 로봇이 패배
    let ox = o.x, oz = o.z, oy = 0;
    if (o.body) { try { const tr = o.body.translation(); ox = tr.x * 1000; oz = tr.z * 1000; oy = tr.y * 1000; } catch (e) {} }
    if (t < 3 && !b.early && b.p0 && Math.hypot(me.x - b.p0.x, me.z - b.p0.z) > 30) { b.early = true; post({ type: 'note', msg: '⚠ 3초가 지나기 전에 움직였습니다 (규정: 3초 대기 후 출발)' }); }
    if (!b.p0) b.p0 = { x: me.x, z: me.z };
    const meOut = (U.sim().fell) || Math.hypot(me.x, me.z) > R_RING + 10;
    const opOut = o.fallen || Math.hypot(ox, oz) > R_RING + 10 || oy < -20;
    if (meOut || opOut || t > 60) {
      b.over = true;
      const out = meOut && opOut ? 'draw' : meOut ? 'loss' : opOut ? 'win' : 'draw';
      setTimeout(() => { try { S.stopProgram(); } catch (e) {} }, 400);
      post({ type: 'bout', out, t: +t.toFixed(1), why: meOut && opOut ? '둘 다 떨어짐' : meOut ? '내 로봇이 경기장 밖으로' : opOut ? '상대 로봇이 경기장 밖으로' : '60초 — 무승부' });
      return;
    }
    if (!o.body) return; // 물리엔진이 꺼져 있으면 상대가 움직이지 않습니다
    // 상대 AI
    const r = Math.hypot(ox, oz), fwd = [Math.sin(b.h), Math.cos(b.h)];
    let v = 0, turnTo = null;
    if (t < 3) b.phase = 'wait';
    else if (b.phase === 'wait') b.phase = 'edge';
    if (b.phase === 'edge') { v = P.vmax * 0.6; if (r > P.edge - 30) b.phase = 'seek'; }
    if (b.phase === 'seek' || b.phase === 'charge') {
      const dx = me.x - ox, dz = me.z - oz, d = Math.hypot(dx, dz);
      if (t - b.aimT > P.react) { b.aimT = t; b.aim = Math.atan2(dx, dz) + (Math.random() * 2 - 1) * P.aimErr * (d > 250 ? 1 : 0.3); }
      const err = wrap(b.aim - b.h);
      turnTo = b.aim;
      if (d < P.sense && Math.abs(err) < 0.45) { b.phase = 'charge'; v = P.vmax; }
      else { b.phase = 'seek'; v = Math.abs(err) < 0.6 ? P.vmax * 0.35 : P.vmax * 0.1; }
      // 테두리 조심: 상대와 붙어 있지 않을 때 바깥을 보고 테두리 가까이면 물러남
      const outward = (fwd[0] * ox + fwd[1] * oz) / (r || 1);
      if (r > P.edge + 20 && outward > 0.2 && d > 230) { v = -P.vmax * 0.5; turnTo = Math.atan2(-ox, -oz); }
    }
    if (turnTo !== null) { const e = wrap(turnTo - b.h); b.h += clamp(e, -P.turn * dt, P.turn * dt); }
    try {
      b.h = wrap(b.h);
      o.body.setRotation({ x: 0, y: Math.sin(b.h / 2), z: 0, w: Math.cos(b.h / 2) }, true); o.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      const lv = o.body.linvel(), m = o.body.mass() || P.mass;
      const want = [Math.sin(b.h) * v, Math.cos(b.h) * v];
      let ix = m * (want[0] - lv.x), iz = m * (want[1] - lv.z);
      const lim = P.mu * m * 9.81 * dt, mag = Math.hypot(ix, iz); if (mag > lim) { ix *= lim / mag; iz *= lim / mag; }
      o.body.applyImpulse({ x: ix, y: 0, z: iz }, true);
    } catch (e) {}
  }
  // 상대 로봇 앞 표시 (빨간 상자 앞쪽 흰 띠)
  function decorateOpp() {
    const o = oppProp(), T3 = window.__cad && window.__cad.THREE; if (!o || !o.mesh || !T3 || o.mesh.userData.wrl) return;
    const m = new T3.Mesh(new T3.BoxGeometry(120, 20, 8), new T3.MeshStandardMaterial({ color: 0xffffff })); m.position.set(0, 30, 76); o.mesh.add(m);
    o.mesh.userData.wrl = 1;
  }

  /* ───────────── AI 오셀로 ───────────── */
  const RED = 0xd22323;
  function othelloCount() {
    let me = 0, op = 0;
    for (const o of U.props() || []) {
      if (o.fallen) continue;
      if (o.kind === 'disc') ((o.up === false ? o.bottom : o.top) === RED ? me++ : op++);
      else if (o.kind === 'oblock' && o.body) {
        const q = o.body.rotation(); const ux = 2 * (q.x * q.y + q.w * q.z);
        if (ux < -0.7) me++; else if (ux > 0.7) op++;
      }
    }
    return [me, op];
  }
  function othStart() { W.run = { t0: U.time(), over: false }; }
  function othStep() {
    const rn = W.run; if (!rn || rn.over) return;
    // 상대 로봇(같은 코드) 속도를 난이도에 맞춰 조절
    const O = window.__othelloAI && window.__othelloAI.opp, f = 0.75 + 0.45 * W.level;
    if (O && O.cmd && !O.cmd._wrl) { const c = O.cmd; if ('v' in c) c.v *= f; if ('w' in c) c.w *= f; c._wrl = 1; }
    const t = U.time() - rn.t0, [me, op] = othelloCount();
    let end = null;
    if (me >= 11) end = ['win', '11개 모두 내 색 — 콜드게임'];
    else if (op >= 11) end = ['loss', '상대가 11개 모두 뒤집음 — 콜드게임'];
    else if (U.sim().fell) end = ['loss', '내 로봇이 경기장 밖으로'];
    else if (O && O.fell) end = ['win', '상대 로봇이 경기장 밖으로'];
    else if (t >= 120) end = [me > op ? 'win' : me < op ? 'loss' : 'draw', '2분 종료'];
    if (end) finishOth(end, me, op, t);
    else post({ type: 'othello', ev: 'tick', score: [me, op], t: +t.toFixed(1) });
  }
  function othEnd(why) { const rn = W.run, [me, op] = othelloCount(), t = U.time() - rn.t0; finishOth([me > op ? 'win' : me < op ? 'loss' : 'draw', why], me, op, t); }
  function finishOth(end, me, op, t) {
    const rn = W.run; if (rn.over) return; rn.over = true; setTimeout(() => { try { S.stopProgram(); } catch (e) {} }, 300); post({ type: 'othello', ev: 'end', out: end[0], why: end[1], score: [me, op], t: +t.toFixed(1) });
  }

  /* ───────────── 공통 루프 ───────────── */
  let lastT = 0, tickT = 0;
  function loop() {
    requestAnimationFrame(loop);
    const running = !!(U.sim() && U.sim().running), now = U.time(); let dt = now - lastT; lastT = now; if (!(dt > 0 && dt < 0.2)) dt = 0;
    const mk = U.mat() && U.mat().key;
    if (running && !W.wasRun) {
      if (W.task === 'sumo') sumoStart(); else if (W.task === 'othello_ai') othStart();
      post({ type: 'run', on: true });
    }
    if (!running && W.wasRun) {
      // AI 오셀로: 상대도 같은 프로그램이라 내 프로그램이 끝나면 경기장이 멈춥니다 → 지금 판 수로 판정
      if (W.task === 'othello_ai' && W.run && !W.run.over) othEnd('프로그램 종료');
      post({ type: 'run', on: false });
    }
    W.wasRun = running;
    // 스모 한 판은 내 프로그램이 끝나도(로봇이 멈춰 있어도) 판정이 날 때까지 계속됩니다
    if (W.task === 'sumo') { decorateOpp(); if (W.bout && !W.bout.over && dt) sumoStep(dt); }
    tickT += dt;
    if (running && tickT > 0.1) { tickT = 0; if (W.task === 'othello_ai') othStep(); }
  }
  requestAnimationFrame(loop);

  window.__wrl = {
    W,
    async setup(task, opts = {}) {
      W.task = task; W.level = clamp(+opts.level || 0, 0, 1);
      // 대회 시뮬레이터에서는 시뮬레이션 안에서만 진행: 실제 허브 연결 · 다운로드 · 허브에서 실행, 바깥 편집기 링크는 숨김
      if (!document.getElementById('wrlHideHub')) {
        const st = document.createElement('style'); st.id = 'wrlHideHub';
        st.textContent = '#pbBox,#wbToEditor,#simExtLink{display:none!important}';
        document.head.appendChild(st);
      }
      for (const id of ['pbConn', 'pbRun', 'pbUp']) { const b = document.getElementById(id); if (b) b.disabled = true; }
      // 시뮬레이터 로봇을 지금 CAD 모델로 다시 만듦 (도면을 연 뒤 바퀴·센서·포트를 다시 찾게)
      try { if (U.sim().on && S.exitSim) S.exitSim(); } catch (e) {}
      const mb = document.querySelector('#modeSim'); if (mb) mb.click();
      try { if (!U.sim().on && S.enterSim) S.enterSim(); } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
      let key = opts.mat;
      if (task === 'sumo') { makeSumoMat(); key = SUMO_KEY; }
      S.setMat(key);
      const sel = document.querySelector('#simMat'); if (sel && sel.value !== key) { sel.value = key; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      if (task === 'sumo') { await S.setPhysics(true); }
      if (opts.lock) { if (sel) sel.disabled = true; }
      return { mat: U.mat() && U.mat().key, physics: !!U.sim().physics };
    },
    // 캐드 '열기'와 같은 방식으로 .ldr 도면을 엽니다 (로봇 모형 · 시뮬레이터 설정 · 블록 프로그램)
    // 캐드의 부품 라이브러리 로딩이 끝날 때까지 기다림 (그 전에 도면을 열면 바퀴를 못 찾아 기본 로봇이 됨)
    async ready() {
      for (let i = 0; i < 300; i++) { const l = document.querySelector('#loading'); if (l && l.hidden) break; await new Promise(r => setTimeout(r, 200)); }
      await new Promise(r => setTimeout(r, 300));
      for (const b of document.querySelectorAll('button')) { const box = b.closest('div'); if (box && /로딩이 끝났습니다|Loading (is )?(done|finished)/i.test(box.textContent) && /확인|OK/.test(b.textContent)) b.click(); }
    },
    async loadModel(url, name) {
      const cad = window.__cad, inp = document.querySelector('#fileIn'); if (!cad || !inp) return false;
      const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) return false;
      const f = new File([await r.blob()], name), before = cad.model;
      const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
      for (let i = 0; i < 150 && cad.model === before; i++) await new Promise(res => setTimeout(res, 200));
      // 부품 형상을 다 불러올 때까지 (상태 줄이 '불러오는 중…'에서 'N개 부품 불러옴'으로 바뀜)
      const st = () => (document.querySelector('#status') || {}).textContent || '';
      for (let i = 0; i < 400 && /불러오는 중|Loading/i.test(st()); i++) { post({ type: 'loading', msg: st() }); await new Promise(res => setTimeout(res, 250)); }
      await new Promise(res => setTimeout(res, 400));
      return cad.model !== before;
    },
    modelParts() { try { return (window.__cad.model.parts || []).length; } catch (e) { return 0; } },
    async ensurePhysics() { if (!U.sim().physics) await S.setPhysics(true); },
    async startRun() { const rb = document.querySelector('#simReset'); if (rb) rb.click(); await new Promise(r => setTimeout(r, 250)); try { await S.runProgram(); } catch (e) { post({ type: 'error', msg: String(e && e.message || e) }); } },
    stop() { try { S.stopProgram(); } catch (e) {} },
    blocks() { try { return window.__wb.ws().getAllBlocks(false).length; } catch (e) { return 0; } },
  };
  post({ type: 'addon-ready' });
})();
