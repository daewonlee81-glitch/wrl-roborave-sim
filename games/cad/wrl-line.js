// wrl-line.js — RoboRAVE 라인 팔로잉 (탁구공 배달) : 로보메이커스 캐드 시뮬레이터 안에 넣는 코드
//  · 경기장: 캐드의 'RoboRAVE 라인 팔로우 ES · MS · HS' 그림을 그대로 쓰고, 타워를 규정대로 속이 빈 상자로 바꿈
//    (20 cm 높이 × 10 cm 폭 × 35 cm 길이, 윗면 앞쪽 10 × 10 cm 구멍, ④ 뒤판 — 물리엔진 충돌체 + 화면 모형)
//  · 공 넣는 부분(호퍼): 로봇 위에 얹는 투명 상자 + 깔때기 + 앞으로 기울어진 배출구 + 끝 막이 · 문을 여는 모터를 돌리면 문이 열리고
//    회전 급공기(스타 휠)처럼 공을 하나씩 배출구로 넘김 (공 지름에 가까운 배출구에서 공끼리 버티는 아치로 막히지 않게)
//  · 탁구공(Ø40 mm · 2.7 g)은 하나하나 물리엔진(Rapier)의 공 → 실은 개수만큼 로봇이 무거워지고, 무게중심이 높아지고,
//    출발·정지·회전할 때 공이 쏠려 로봇 움직임이 달라집니다
//  · 점수: 규정의 첫 번째 왕복 400점(출발 · T 교차로 · 타워 정지 · 공 넣기 · 돌아가기 · 홈 도착) + 보너스 공 배달
// 캐드 본체는 고치지 않고 window.__umc · __sim 훅과 물리 세계(U.phys())만 씁니다.
(() => {
  'use strict';
  if (window.__wrlLine) return;
  const U = window.__umc, S = window.__sim;
  if (!U || !S) return;
  const post = m => { try { window.parent.postMessage(Object.assign({ source: 'wrlcad' }, m), '*'); } catch (e) {} };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const D2R = Math.PI / 180, Ue = 0.001;
  const T3 = () => window.__cad && window.__cad.THREE;
  const RA = () => window.RAPIER;
  const BALL = { r: 20, m: 0.0027 };
  const TIME = 180;
  // 캐드 경기장 그림과 같은 선 좌표 (캔버스 px = mm, 경기장 1800 × 1200)
  const PTS = {
    es: [[185, 960], [185, 700], [300, 470], [520, 420], [680, 560], [760, 760], [980, 840], [1160, 700], [1180, 460], [1300, 260], [1520, 230], [1620, 380], [1620, 560]],
    ms: [[185, 960], [185, 450], [700, 450], [700, 850], [450, 850], [450, 250], [1450, 250], [1450, 560]],
    hs: [[185, 960], [185, 450], [700, 450], [700, 850], [450, 850], [450, 250], [1000, 250], [1000, 700], [1300, 700], [1300, 400], [850, 400], [850, 600]],
  };
  // 첫 번째 왕복 점수표 (worldrobotleague.net/rules/roborave — Line Following)
  const PTSTAB = {
    es: { leave: 50, t: [], stop: 100, deliver: 100, back: 50, home: 100 },
    ms: { leave: 25, t: [25], stop: 100, deliver: 100, back: 25, home: 100 },
    hs: { leave: 25, t: [25, 25], stop: 50, deliver: 100, back: 25, home: 100 },
  };
  const REQ = { es: 75, ms: 125, hs: 200 };      // 보너스 공 개수 (규정 범위의 최솟값 · 대회 때 공지)
  const DIVNAME = { es: 'ES', ms: 'MS', hs: 'HS·UP' };
  const HOME = { x0: -840, x1: -590, z0: 290, z1: 540 }; // 주황 출발 · 홈 구역 (월드 mm)

  const L = window.__wrlLine = {
    div: 'es', key: null, tw: null, inter: [],
    loaded: false, count: 1, req: 75, port: 'C', H: 215, ext: 40, zoff: 0,
    balls: [], ct: null, gate: null, gateOpen: false, ref: 0, hopCols: [], towerCols: [],
    hopMesh: null, hopRoot: null, gateMesh: null, inst: null, towerGroup: null, geoKey: '',
    run: null, delivered: 0,
  };
  const save = () => { try { localStorage.setItem('wrlsim.line', JSON.stringify({ count: L.count, port: L.port, portUser: !!L.portUser, H: L.H, ext: L.ext, zoff: L.zoff })); } catch (e) {} };
  try { Object.assign(L, JSON.parse(localStorage.getItem('wrlsim.line') || '{}')); } catch (e) {}

  /* ───────────── 경기장 ───────────── */
  function makeMat(div) {
    div = PTS[div] ? div : 'es'; L.div = div; L.req = REQ[div];
    const key = 'rr_' + div + '_wrl', base = U.mats['rr_' + div]; if (!base) return null;
    const p = PTS[div], t = p[p.length - 1];
    const tx = t[0] - 900, s = t[1] + 40 + 175 - 600; // 캐드 경기장과 같은 타워 자리
    L.tw = { x: tx, zf: s - 175, zb: s + 175, w: 100, h: 200 };
    // 교차로 (선이 스스로 지나는 자리)
    L.inter = [];
    const X = (a, b, c, d) => { const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]); if (!den) return null; const u = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den, v = -((a[0] - b[0]) * (a[1] - c[1]) - (a[1] - b[1]) * (a[0] - c[0])) / den; return u > 0 && u < 1 && v > 0 && v < 1 ? [a[0] + u * (b[0] - a[0]) - 900, a[1] + u * (b[1] - a[1]) - 600] : null; };
    for (let i = 0; i < p.length - 1; i++) for (let j = i + 2; j < p.length - 1; j++) { const r = X(p[i], p[i + 1], p[j], p[j + 1]); if (r) L.inter.push(r); }
    L.key = key;
    if (!U.mats[key]) {
      const label = `RoboRAVE 라인 팔로잉 ${DIVNAME[div]} (대회 · 탁구공)`;
      U.mats[key] = Object.assign({}, base, {
        key, label, walls: [],
        extras(r) { buildTowerMesh(r); },
        info() { return infoHTML(); },
      });
      if (U.i18n) U.i18n[label] = [`RoboRAVE Line Following ${DIVNAME[div]} (match · balls)`, `RoboRAVE ライントレース ${DIVNAME[div]}`, `RoboRAVE 巡线 ${DIVNAME[div]}`, `RoboRAVE Seguidor de línea ${DIVNAME[div]}`];
      const sel = document.querySelector('#simMat');
      if (sel && !sel.querySelector(`option[value="${key}"]`)) { const o = document.createElement('option'); o.value = key; o.dataset.ko = label; o.textContent = label; const ref = sel.querySelector(`option[value="rr_${div}"]`); if (ref) ref.after(o); else sel.appendChild(o); }
    }
    return key;
  }
  // 타워 판: 옆 2장(350 × 200) · 앞 1장 · 윗판 ⑤(구멍 100 × 100 을 앞쪽에 남김) · 뒤판 ④
  function towerPanels() {
    const w = L.tw, th = 5, h = w.h, cx = w.x;
    return [
      { x: cx - w.w / 2 + th / 2, y: h / 2, z: (w.zf + w.zb) / 2, hx: th / 2, hy: h / 2, hz: (w.zb - w.zf) / 2, side: 1 },
      { x: cx + w.w / 2 - th / 2, y: h / 2, z: (w.zf + w.zb) / 2, hx: th / 2, hy: h / 2, hz: (w.zb - w.zf) / 2, side: 1 },
      { x: cx, y: h / 2, z: w.zf + th / 2, hx: w.w / 2 - th, hy: h / 2, hz: th / 2, front: 1 },
      { x: cx, y: h - 5, z: (w.zf + 100 + w.zb) / 2, hx: w.w / 2 - th, hy: 5, hz: (w.zb - w.zf - 100) / 2, top: 1 },
      { x: cx, y: 95, z: w.zb - 5, hx: w.w / 2 - th, hy: 95, hz: 5, back: 1 }, // ④ 90 × 190 뒤판
    ];
  }
  function buildTowerMesh(r) {
    const TH = T3(); if (!TH || !L.tw) return;
    const g = new TH.Group(); g.name = 'wrlTower';
    for (const p of towerPanels()) {
      const m = new TH.Mesh(new TH.BoxGeometry(p.hx * 2, p.hy * 2, p.hz * 2), new TH.MeshStandardMaterial({ color: p.top ? 0xb8925a : 0xd9b98a, transparent: !!p.side, opacity: p.side ? 0.55 : 1, roughness: 0.8 }));
      m.position.set(p.x, p.y, p.z); g.add(m);
    }
    // 구멍 테두리 (위에서 잘 보이게)
    const ring = new TH.Mesh(new TH.BoxGeometry(L.tw.w - 10, 2, 4), new TH.MeshStandardMaterial({ color: 0x2b2b30 })); ring.position.set(L.tw.x, L.tw.h + 1, L.tw.zf + 100); g.add(ring);
    r.add(g); L.towerGroup = g;
  }

  /* ───────────── 공 넣는 부분 (호퍼 + 배출구) ───────────── */
  // 로봇 좌표(mm): x 옆, y 위, z 앞. 모든 판 = { x, y, z, hx, hy, hz, rx(앞으로 기울기) }
  function robotBox() {
    const Q = U.robot(); if (!Q || !Q.boxes || !Q.boxes.length) return { x0: -60, x1: 60, y0: 0, y1: 90, z0: -80, z1: 80 };
    const b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 };
    for (const q of Q.boxes) { b.x0 = Math.min(b.x0, q.min.x); b.x1 = Math.max(b.x1, q.max.x); b.y0 = Math.min(b.y0, q.min.y); b.y1 = Math.max(b.y1, q.max.y); b.z0 = Math.min(b.z0, q.min.z); b.z1 = Math.max(b.z1, q.max.z); }
    for (const w of Q.wheelGeo || []) { b.z1 = Math.max(b.z1, w.c.z + w.r); b.z0 = Math.min(b.z0, w.c.z - w.r); }
    return b;
  }
  function geo() {
    const bb = robotBox(), A = 10 * D2R, tA = Math.tan(A), cA = Math.cos(A), sA = Math.sin(A);
    const n = clamp(Math.round(L.count) || 1, 1, 300), W = 120, Ld = 160, t = 6, O = 30; // O = 배출구 반폭
    const zc = (bb.z0 + bb.z1) / 2 + L.zoff, zF = zc + Ld / 2;
    const zEnd = Math.max(zF + 40, bb.z1 + L.ext), Lc = zEnd - zF;
    let yF = L.H + Lc * tA; if (yF < bb.y1 + 12) yF = bb.y1 + 12;
    const yEnd = yF - Lc * tA, layers = Math.ceil(n / 10), Hh = clamp(layers * 41 + 50, 90, 900), yTop = yF + Ld * tA + Hh, yBot = yF - 12;
    const nrm = [0, cA, sA]; // 기울어진 판의 위쪽 방향
    const slab = (zMid, yTopMid, hx, len, extra = {}) => ({ x: 0, y: yTopMid - t / 2 * nrm[1], z: zMid - t / 2 * nrm[2], hx, hy: t / 2, hz: len / 2 / cA + 2, rx: A, ...extra });
    const vbox = (x0, x1, y0, y1, z0, z1, extra = {}) => ({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, hx: (x1 - x0) / 2, hy: (y1 - y0) / 2, hz: (z1 - z0) / 2, rx: 0, ...extra });
    const parts = [
      slab(zc, yF + Ld / 2 * tA, W / 2 + t, Ld, { k: 'floor' }),
      vbox(-W / 2 - t, W / 2 + t, yBot, yTop, zc - Ld / 2 - t, zc - Ld / 2, { k: 'wall' }),
      vbox(-W / 2 - t, -W / 2, yBot, yTop, zc - Ld / 2 - t, zF + t, { k: 'wall' }),
      vbox(W / 2, W / 2 + t, yBot, yTop, zc - Ld / 2 - t, zF + t, { k: 'wall' }),
      vbox(-W / 2 - t, -O, yBot, yTop, zF, zF + t, { k: 'wall' }),
      vbox(O, W / 2 + t, yBot, yTop, zF, zF + t, { k: 'wall' }),
      vbox(-O, O, yF + 2 * O, yTop, zF, zF + t, { k: 'wall' }),
      // 배출구: 앞으로 10° 내려가는 홈통 + 양옆 막이
      slab((zF + zEnd) / 2, (yF + yEnd) / 2, O + t, Lc, { k: 'chute' }),
      { ...slab((zF + zEnd) / 2, (yF + yEnd) / 2, t / 2, Lc, { k: 'chute' }), x: -O - t / 2, y: (yF + yEnd) / 2 + 16 * cA, z: (zF + zEnd) / 2 + 16 * sA - 0, hy: 20 },
      { ...slab((zF + zEnd) / 2, (yF + yEnd) / 2, t / 2, Lc, { k: 'chute' }), x: O + t / 2, y: (yF + yEnd) / 2 + 16 * cA, z: (zF + zEnd) / 2 + 16 * sA - 0, hy: 20 },
      // 깔때기: 호퍼 앞쪽 양옆에서 배출구로 모아 줌
      ...[-1, 1].map(sx => { const ph = Math.atan2(W / 2 - O, 40), T = 10; // 두꺼운 판(20 mm)이라 공이 구석으로 빠지지 않음
        return { x: sx * ((W / 2 + O) / 2 + T * Math.cos(ph)), y: (yBot + yTop) / 2, z: zF - 20 + T * Math.sin(ph), hx: T, hy: (yTop - yBot) / 2, hz: Math.hypot(W / 2 - O, 40) / 2 + 4, rx: 0, ry: -sx * ph, k: 'wall' }; }),
      // 끝 막이: 배출구 끝에서 앞으로 굴러가지 않고 바로 아래(타워 구멍)로 떨어지게
      vbox(-O - t, O + t, yEnd - 4, yEnd + 2 * O, zEnd + 2 * BALL.r + 4, zEnd + 2 * BALL.r + 4 + t, { k: 'chute' }),
      vbox(-O - t, -O, yEnd - 4, yEnd + 2 * O, zEnd, zEnd + 2 * BALL.r + 4 + t, { k: 'chute' }),
      vbox(O, O + t, yEnd - 4, yEnd + 2 * O, zEnd, zEnd + 2 * BALL.r + 4 + t, { k: 'chute' }),
    ];
    const gate = vbox(-O, O, yF - 4, yF + 2 * O, zF, zF + t, { k: 'gate' });
    // 공 처음 자리: 한 층에 3 × 4 = 12개
    const spawn = [];
    const cells = []; for (let zi = 0; zi < 4; zi++) for (let xi = 0; xi < 3; xi++) if (!(zi === 3 && xi !== 1)) cells.push([(xi - 1) * 40, zc - 60 + zi * 40]); // 앞줄 양옆은 깔때기 자리
    for (let i = 0; i < n; i++) { const l = Math.floor(i / cells.length), c = cells[i % cells.length]; spawn.push([c[0], yF + Ld * tA + 22 + l * 41, c[1]]); }
    const posts = yBot - bb.y1 > 6 ? [[-W / 2, zc - Ld / 2], [W / 2, zc - Ld / 2], [-W / 2, zF], [W / 2, zF]].map(([x, z]) => ({ x, z, y0: bb.y1, y1: yBot })) : [];
    return { parts, gate, spawn, posts, bb, yF, yEnd, zEnd, Hh, key: [bb.x0, bb.x1, bb.y1, bb.z0, bb.z1, n, L.H, L.ext, L.zoff].map(v => Math.round(v)).join(',') };
  }
  const qx = (a, b = 0) => b ? { x: 0, y: Math.sin(b / 2), z: 0, w: Math.cos(b / 2) } : { x: Math.sin(a / 2), y: 0, z: 0, w: Math.cos(a / 2) };

  // 물리 세계가 새로 만들어질 때(처음 위치로 · 경기장 바꾸기 · 물리엔진 켜기)마다 타워 · 호퍼 · 공을 다시 넣음
  // 문을 여는 모터: 고르지 않았으면 바퀴 · 센서가 없는 첫 포트 (없으면 C)
  function autoPort() {
    const Q = U.robot(); if (!Q || L.portUser) return;
    const used = p => (Q.ports && Q.ports[p]) || p === Q.left || p === Q.right;
    if (!used(L.port) || (Q.ports[L.port] && Q.ports[L.port].type === 'motor' && L.port !== Q.left && L.port !== Q.right)) return;
    L.port = ['C', 'D', 'E', 'F', 'A', 'B'].find(p => Q.ports && Q.ports[p] && Q.ports[p].type === 'motor' && p !== Q.left && p !== Q.right) || ['C', 'D', 'E', 'F'].find(p => !used(p)) || 'C';
    L.syncPanel && L.syncPanel();
  }
  function attach(ct) {
    autoPort();
    L.ct = ct; L.balls = []; L.hopCols = []; L.towerCols = []; L.gate = null; L.gateOpen = false; L.ref = 0;
    const R = RA(); if (!R || !ct || !ct.world || !ct.body || !L.tw) return;
    const w = ct.world;
    const fixed = w.createRigidBody(R.RigidBodyDesc.fixed());
    for (const p of towerPanels()) L.towerCols.push(w.createCollider(R.ColliderDesc.cuboid(p.hx * Ue, p.hy * Ue, p.hz * Ue).setTranslation(p.x * Ue, p.y * Ue, p.z * Ue).setFriction(0.4), fixed));
    const G = buildHopper();
    if (L.loaded) spawnBalls(G);
  }
  // 호퍼 충돌체 (공 개수에 따라 높이가 달라지므로 개수를 바꾸면 다시 만듦)
  function buildHopper() {
    const R = RA(), ct = L.ct, w = ct.world, grp = 131070; // 로봇 충돌 그룹 (로봇 부품끼리는 부딪히지 않음)
    for (const c of L.hopCols.concat(L.gate ? [L.gate] : [])) { try { ct.robotCols.delete(c.handle); w.removeCollider(c, true); } catch (e) {} }
    L.hopCols = []; L.gate = null; L.gateOpen = false;
    const G = geo();
    for (const p of G.parts) {
      const c = w.createCollider(R.ColliderDesc.cuboid(p.hx * Ue, p.hy * Ue, p.hz * Ue).setTranslation(p.x * Ue, p.y * Ue, p.z * Ue).setRotation(qx(p.rx, p.ry)).setMass(p.k === 'floor' ? 0.012 : 0.004).setFriction(0.05).setCollisionGroups(grp), ct.body);
      L.hopCols.push(c); ct.robotCols.add(c.handle);
    }
    const g = G.gate; L.gate = w.createCollider(R.ColliderDesc.cuboid(g.hx * Ue, g.hy * Ue, g.hz * Ue).setTranslation(g.x * Ue, g.y * Ue, g.z * Ue).setMass(0.003).setFriction(0.25).setCollisionGroups(grp), ct.body);
    ct.robotCols.add(L.gate.handle); L.hopKey = G.key;
    return G;
  }
  function spawnBalls(G) {
    const R = RA(), ct = L.ct, TH = T3(); if (!R || !ct || !TH) return 0;
    G = G || geo();
    if (G.key !== L.hopKey) G = buildHopper();
    const tr = ct.body.translation(), ro = ct.body.rotation(), q = new TH.Quaternion(ro.x, ro.y, ro.z, ro.w), o = new TH.Vector3(tr.x, tr.y, tr.z);
    let n = 0;
    for (const s of G.spawn) {
      const v = new TH.Vector3(s[0] * Ue, s[1] * Ue, s[2] * Ue).applyQuaternion(q).add(o);
      const body = ct.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(v.x, v.y, v.z).setLinvel(0, 0, 0).setCcdEnabled(false).setLinearDamping(0.08).setAngularDamping(0.3));
      const col = ct.world.createCollider(R.ColliderDesc.ball(BALL.r * Ue).setMass(BALL.m).setRestitution(0.5).setFriction(0.05), body);
      ct.robotCols.add(col.handle); // 거리센서 · 힘센서가 실은 공을 벽으로 보지 않게
      L.balls.push({ body, col, delivered: false, lost: false, trip: null }); n++;
    }
    return n;
  }
  function removeOnboard() {
    const ct = L.ct; if (!ct) return;
    L.balls = L.balls.filter(b => {
      if (b.delivered) return true;
      try { ct.robotCols.delete(b.col.handle); ct.world.removeRigidBody(b.body); } catch (e) {}
      return false;
    });
  }

  /* ───────────── 화면 (호퍼 모형 · 공) ───────────── */
  function syncMeshes() {
    const TH = T3(), Q = U.robot(); if (!TH || !Q || !Q.root) return;
    const G = geo();
    if (!L.hopMesh || L.hopRoot !== Q.root || L.geoKey !== G.key) {
      if (L.hopMesh && L.hopMesh.parent) L.hopMesh.parent.remove(L.hopMesh);
      const g = new TH.Group(); g.name = 'wrlHopper';
      const acr = new TH.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.32, roughness: 0.2, depthWrite: false });
      const solid = new TH.MeshStandardMaterial({ color: 0x8a96a8, roughness: 0.6 });
      for (const p of G.parts) { const m = new TH.Mesh(new TH.BoxGeometry(p.hx * 2, p.hy * 2, p.hz * 2), p.k === 'wall' ? acr : solid); m.position.set(p.x, p.y, p.z); m.rotation.set(p.rx || 0, p.ry || 0, 0); g.add(m); }
      const gm = new TH.Mesh(new TH.BoxGeometry(G.gate.hx * 2, G.gate.hy * 2, G.gate.hz * 2), new TH.MeshStandardMaterial({ color: 0xff8a2a }));
      const piv = new TH.Group(); piv.position.set(0, G.gate.y + G.gate.hy, G.gate.z); gm.position.set(0, -G.gate.hy, 0); piv.add(gm); g.add(piv); L.gateMesh = piv;
      for (const p of G.posts) { const m = new TH.Mesh(new TH.CylinderGeometry(3, 3, p.y1 - p.y0, 8), solid); m.position.set(p.x, (p.y0 + p.y1) / 2, p.z); g.add(m); }
      Q.root.add(g); L.hopMesh = g; L.hopRoot = Q.root; L.geoKey = G.key;
    }
    if (L.gateMesh) L.gateMesh.rotation.x = L.gateOpen ? -1.3 : 0;
    // 공: 한 번에 그리는 인스턴스 메시 (경기장 장면에)
    const scene = Q.root.parent; if (!scene) return;
    if (!L.inst || L.inst.parent !== scene) {
      if (L.inst && L.inst.parent) L.inst.parent.remove(L.inst);
      L.inst = new TH.InstancedMesh(new TH.SphereGeometry(BALL.r, 18, 12), new TH.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }), 400);
      L.inst.frustumCulled = false; scene.add(L.inst);
    }
    const M = new TH.Matrix4(), V = new TH.Vector3(), Qt = new TH.Quaternion(), one = new TH.Vector3(1, 1, 1); let k = 0;
    if (L.ct === U.phys()) for (const b of L.balls) { if (k >= 400) break; try { const p = b.body.translation(); V.set(p.x / Ue, p.y / Ue, p.z / Ue); M.compose(V, Qt, one); L.inst.setMatrixAt(k++, M); } catch (e) {} }
    L.inst.count = k; L.inst.instanceMatrix.needsUpdate = true;
    L.hopMesh.visible = true;
  }

  /* ───────────── 판정 · 점수 ───────────── */
  const inHome = p => p.x > HOME.x0 && p.x < HOME.x1 && p.z > HOME.z0 && p.z < HOME.z1;
  function newRun() { return { t0: U.time(), pts: {}, phase: 'out', still: 0, stopPos: null, tOut: new Set(), tBack: new Set(), first: 0, bonus: 0, over: false, ballsAtStart: onboard() }; }
  const onboard = () => L.balls.filter(b => !b.delivered && !b.lost && !b.ground).length;
  function firstScore(r) { const T = PTSTAB[L.div]; let s = 0; for (const k of ['leave', 'stop', 'deliver', 'back', 'home']) if (r.pts[k]) s += T[k]; s += (r.pts.tOut || 0) + (r.pts.tBack || 0); return s; }
  function bonusScore(r) { const d = r.bonus, q = L.req; return d <= q ? d : Math.max(0, q - (d - q)); }
  function track(dt) {
    const r = L.run; if (!r || r.over) return;
    const ct = U.phys(); if (!ct || ct !== L.ct) return;
    const T = PTSTAB[L.div], p = U.pose(), lv = ct.body.linvel(), sp = Math.hypot(lv.x, lv.z) / Ue, t = U.time() - r.t0;
    r.still = sp < 15 ? r.still + dt : 0;
    if (!r.pts.leave && !inHome(p)) r.pts.leave = 1;
    for (let i = 0; i < L.inter.length; i++) { const c = L.inter[i]; if (Math.hypot(p.x - c[0], p.z - c[1]) < 45) (r.phase === 'out' ? r.tOut : r.phase === 'back' ? r.tBack : new Set()).add(i); }
    const w = L.tw, nearTower = Math.abs(p.x - w.x) < 130 && p.z > w.zf - 280 && p.z < w.zf + 60;
    if (r.phase === 'out' && r.pts.leave && nearTower && r.still > 0.6) { r.pts.stop = 1; r.phase = 'tower'; r.stopPos = { x: p.x, z: p.z }; r.pts.tOut = Math.min(r.tOut.size, T.t.length) * 25; }
    if (r.phase === 'tower' && Math.hypot(p.x - r.stopPos.x, p.z - r.stopPos.z) > 150) { r.pts.back = 1; r.phase = 'back'; }
    if (r.phase === 'back' && inHome(p) && r.still > 0.6) { r.pts.home = 1; r.phase = 'bonus'; r.pts.tBack = Math.min(r.tBack.size, T.t.length) * 25; post({ type: 'note', msg: '🏠 첫 번째 왕복 완료! 홈에서 공을 더 실으면(🏓 토글) 보너스 공 배달을 할 수 있습니다' }); }
    r.first = firstScore(r);
    if (t >= TIME) finish('3분 종료');
  }
  // 공: 타워 안(윗면 구멍으로 들어가 아래)에 들어온 공 · 경기장 밖으로 떨어진 공
  function checkBalls() {
    const w = L.tw, r = L.run && !L.run.over ? L.run : null;
    for (const b of L.balls) {
      if (b.delivered || b.lost) continue;
      let q; try { q = b.body.translation(); } catch (e) { continue; }
      const x = q.x / Ue, y = q.y / Ue, z = q.z / Ue;
      if (Math.abs(x - w.x) < w.w / 2 - 6 && z > w.zf + 6 && z < w.zb && y > 0 && y < w.h - 12) {
        b.delivered = true; L.delivered++;
        if (r) { if (r.phase === 'bonus') r.bonus++; else { r.pts.deliver = 1; r.firstBalls = (r.firstBalls || 0) + 1; } }
      } else if (y < -50 || Math.abs(x) > 1000 || Math.abs(z) > 700) b.lost = true;
      else if (y < 30 && !b.ground) b.ground = true; // 바닥에 떨어진 공 (로봇에 실린 공에서 빠짐)
    }
  }
  function finish(why) {
    const r = L.run; if (!r || r.over) return; r.over = true;
    const total = r.first + (r.pts.home ? bonusScore(r) : 0);
    setTimeout(() => { try { S.stopProgram(); } catch (e) {} }, 300);
    post({ type: 'line', ev: 'end', why, total, first: r.first, bonus: r.bonus, req: L.req, pts: r.pts, t: +(U.time() - r.t0).toFixed(1), detail: detailText(r) });
  }
  function detailText(r) {
    const T = PTSTAB[L.div], P = r.pts, a = [];
    if (P.leave) a.push('출발 ' + T.leave); if (P.tOut) a.push('T ' + P.tOut); if (P.stop) a.push('타워 정지 ' + T.stop); if (P.deliver) a.push('공 넣기 ' + T.deliver);
    if (P.back) a.push('돌아가기 ' + T.back); if (P.tBack) a.push('T ' + P.tBack); if (P.home) a.push('홈 ' + T.home);
    return a.join(' · ') + (P.home ? ` · 보너스 공 ${r.bonus}/${L.req}개 → ${bonusScore(r)}점` : '');
  }
  function infoHTML() {
    const r = L.run, ob = onboard();
    const gr = L.balls.filter(b => b.ground && !b.delivered && !b.lost).length;
    let h = `🏓 로봇에 실은 공 <b>${ob}</b>개 (${(ob * BALL.m * 1000).toFixed(1)} g) · 타워에 넣은 공 <b>${L.delivered}</b>개${gr ? ` · 바닥에 떨어진 공 ${gr}개` : ''} · 문 ${L.gateOpen ? '<b style="color:#e8590c">열림</b>' : '닫힘'} (${L.port} 모터)`;
    if (r) { const t = Math.max(0, TIME - (U.time() - r.t0)); h += `<br>점수 <b>${r.first}</b> / 400${r.pts.home ? ` + 보너스 ${bonusScore(r)} (공 ${r.bonus}/${L.req})` : ''} · 남은 시간 ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')} · ${({ out: '타워로', tower: '타워 정지', back: '홈으로', bonus: '보너스' })[r.phase] || ''}`; }
    return h;
  }

  /* ───────────── 조작판 (탁구공 토글 · 호퍼 설정) ───────────── */
  function panel() {
    if (document.getElementById('wrlBall')) return;
    const wrap = document.querySelector('#viewportWrap'); if (!wrap) return;
    const st = document.createElement('style'); st.textContent = `
#wrlBall{position:absolute;left:8px;bottom:8px;z-index:6;background:#ffffffee;border:1px solid #c9d1dc;border-radius:10px;padding:8px 10px;font:12px/1.5 system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#1b2230;box-shadow:0 4px 16px #0002;max-width:330px}
#wrlBall .row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#wrlBall input[type=number]{width:58px;padding:2px 4px}
#wrlBall .sw{position:relative;width:46px;height:24px;border-radius:12px;background:#c4cad4;cursor:pointer;flex:none;transition:background .15s;border:0;padding:0}
#wrlBall .sw::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0004;transition:left .15s}
#wrlBall .sw.on{background:#ff8a2a}#wrlBall .sw.on::after{left:25px}
#wrlBall details{margin-top:4px}#wrlBall summary{cursor:pointer;color:#3d5a80}
#wrlBall label{display:flex;justify-content:space-between;gap:8px;margin:3px 0}
#wrlBall .mut{color:#6b7584}`;
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'wrlBall';
    d.innerHTML = `<div class="row"><button class="sw" id="wbSw" title="탁구공 싣기"></button><b>🏓 탁구공 싣기</b> <input type="number" id="wbN" min="1" max="300" step="1"> 개 <span class="mut" id="wbW"></span></div>
      <div class="mut" id="wbInfo"></div>
      <details><summary>공 넣는 부분(호퍼) 설정</summary>
        <label>배출구 끝 높이 <span><input type="number" id="wbH" min="60" max="400" step="5"> mm</span></label>
        <label>배출구가 로봇 앞으로 나온 길이 <span><input type="number" id="wbE" min="0" max="250" step="5"> mm</span></label>
        <label>호퍼 앞뒤 위치 <span><input type="number" id="wbZ" min="-150" max="150" step="5"> mm</span></label>
        <label>문을 여는 모터 <select id="wbP">${['A', 'B', 'C', 'D', 'E', 'F'].map(p => `<option>${p}</option>`).join('')}</select></label>
        <label>보너스 공 개수 (대회 공지) <span><input type="number" id="wbR" min="1" max="350" step="1"> 개</span></label>
        <div class="mut">문을 여는 모터를 30° 넘게 돌리면 문이 열리고 회전 급공기가 공을 하나씩(약 0.3초마다) 배출구로 내보냅니다. 처음 각도로 돌아오면 닫힙니다. 타워는 높이 200 mm · 윗면 앞쪽에 100 × 100 mm 구멍이 있으니 배출구 끝을 그보다 높게, 로봇 앞보다 앞으로 나오게 두세요. 설정을 바꾸면 처음 위치로 돌아갑니다.</div>
      </details>`;
    wrap.appendChild(d);
    const $ = id => d.querySelector('#' + id);
    const sync = () => {
      $('wbSw').classList.toggle('on', L.loaded); $('wbN').value = L.count; $('wbH').value = L.H; $('wbE').value = L.ext; $('wbZ').value = L.zoff; $('wbP').value = L.port; $('wbR').value = L.req;
      $('wbW').textContent = `= ${(L.count * BALL.m * 1000).toFixed(1)} g`;
    };
    sync(); L.syncPanel = sync;
    $('wbSw').addEventListener('click', () => toggleLoad(!L.loaded));
    $('wbN').addEventListener('change', e => { L.count = clamp(Math.round(+e.target.value) || 1, 1, 300); save(); sync(); if (L.loaded && !running()) { removeOnboard(); spawnBalls(); } });
    const geoChange = (k, v, a, b) => { L[k] = clamp(+v || 0, a, b); save(); sync(); if (!running()) resetSim(); else post({ type: 'note', msg: '호퍼 설정은 다음 출발(처음 위치로)부터 적용됩니다' }); };
    $('wbH').addEventListener('change', e => geoChange('H', e.target.value, 60, 400));
    $('wbE').addEventListener('change', e => geoChange('ext', e.target.value, 0, 250));
    $('wbZ').addEventListener('change', e => geoChange('zoff', e.target.value, -150, 150));
    $('wbP').addEventListener('change', e => { L.port = e.target.value; L.portUser = true; save(); });
    $('wbR').addEventListener('change', e => { L.req = clamp(Math.round(+e.target.value) || 1, 1, 350); sync(); });
  }
  const running = () => !!(U.sim() && U.sim().running);
  function resetSim() { const rb = document.querySelector('#simReset'); if (rb) rb.click(); }
  function toggleLoad(on) {
    if (on) {
      if (running()) { // 경기 중에는 로봇이 홈에 멈춰 있을 때만 (선수가 공을 넣어 줌)
        const ct = U.phys(), p = U.pose(), lv = ct && ct.body.linvel(), sp = lv ? Math.hypot(lv.x, lv.z) / Ue : 0;
        if (!inHome(p) || sp > 30) { post({ type: 'note', msg: '⚠ 경기 중에는 로봇이 홈(주황 구역)에 멈춰 있을 때만 공을 실을 수 있습니다' }); return; }
      }
      L.loaded = true; if (U.phys()) { if (L.ct !== U.phys()) attach(U.phys()); else spawnBalls(); }
      if (!U.sim().physics) post({ type: 'note', msg: '⚠ 탁구공은 물리엔진이 켜져 있어야 움직입니다' });
    } else { L.loaded = false; removeOnboard(); }
    L.syncPanel && L.syncPanel();
  }

  // 문이 열려 있는 동안: 회전 급공기(스타 휠)처럼 배출구 목이 비면 호퍼 맨 앞 공을 하나씩 목으로 넘겨 줌
  // (공 지름 40 mm에 배출구 60 mm라 공끼리 버티는 아치로 막히는 것을 막음 · 나머지 공은 그대로 물리엔진으로 움직임)
  function feed(dt) {
    const TH = T3(), ct = L.ct; if (!TH || !ct) return;
    for (const b of L.balls) if (!b.delivered && !b.ground) try { b.body.wakeUp(); } catch (e) {}
    const now = U.time(); if (now - (L.lastFeed || 0) < 0.32) return;
    const G = geo(), tr = ct.body.translation(), ro = ct.body.rotation(), q = new TH.Quaternion(ro.x, ro.y, ro.z, ro.w), qi = q.clone().invert();
    const zF = G.parts[4].z - 3, V = new TH.Vector3(), loc = [];
    for (const b of L.balls) {
      if (b.delivered || b.lost || b.ground) continue;
      const p = b.body.translation(); V.set((p.x - tr.x) / Ue, (p.y - tr.y) / Ue, (p.z - tr.z) / Ue).applyQuaternion(qi);
      loc.push({ b, x: V.x, y: V.y, z: V.z });
    }
    if (loc.some(o => o.z > zF + 2 && o.z < zF + 60 && o.y < G.yF + 60 || o.z > zF - 24 && Math.abs(o.x) < 10 && o.y < G.yF + 45)) return; // 이미 배출구에 있거나 목 가운데에 있음
    L.lastFeed = now;
    const toW = (x, y, z) => new TH.Vector3(x * Ue, y * Ue, z * Ue).applyQuaternion(q).add(new TH.Vector3(tr.x, tr.y, tr.z)), lv = ct.body.linvel();
    const put = (o, w) => { o.b.body.setTranslation({ x: w.x, y: w.y, z: w.z }, true); o.b.body.setLinvel({ x: lv.x, y: lv.y, z: lv.z }, true); o.b.body.setAngvel({ x: 0, y: 0, z: 0 }, true); };
    const throat = loc.filter(o => o.z > zF - 24 && Math.abs(o.x) < 36 && o.y < G.yF + 45).sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
    if (throat.length >= 2) { // 목에 둘이 나란히 끼임 → 바깥쪽 공을 급공기가 호퍼 위로 되돌림
      const o = throat[throat.length - 1], top = Math.max(...loc.map(k => k.y)) + 42;
      put(o, toW(o.x > 0 ? 30 : -30, Math.min(top, G.yF + G.Hh), G.spawn[0] ? G.spawn[0][2] : zF - 120)); return;
    }
    const dest = { x: 0, y: G.yF + 22, z: zF + 10 };
    const cand = throat[0] || loc.filter(o => o.z < zF + 2 && o.y < G.yF + 120).sort((a, b) => (b.z - 0.6 * (b.y - G.yF)) - (a.z - 0.6 * (a.y - G.yF)))[0];
    if (!cand) return;
    if (loc.some(o => o !== cand && Math.hypot(o.x - dest.x, o.y - dest.y, o.z - dest.z) < 41)) return;
    put(cand, toW(dest.x, dest.y, dest.z));
  }

  /* ───────────── 루프 ───────────── */
  let last = 0, was = false, tickT = 0;
  function loop() {
    requestAnimationFrame(loop);
    const mk = U.mat() && U.mat().key; if (!L.key || mk !== L.key) { if (L.hopMesh) L.hopMesh.visible = false; if (L.inst) L.inst.count = 0; return; }
    panel();
    const now = U.time(); let dt = now - last; last = now; if (!(dt > 0 && dt < 0.2)) dt = 0;
    const ct = U.phys(); if (ct && ct !== L.ct) attach(ct);
    if (!ct) L.ct = null;
    // 문: 내보내는 모터가 처음 각도에서 30° 넘게 돌면 열림
    if (L.gate && ct === L.ct) {
      const m = (S.motors() || {})[L.port], pos = m ? m.pos : 0, open = Math.abs(pos - L.ref) >= 30;
      if (open !== L.gateOpen) { L.gateOpen = open; try { L.gate.setSensor(open); } catch (e) {} }
      if (L.gateOpen) feed(dt);
    }
    const run = running();
    if (run && !was) { L.delivered = 0; L.run = newRun(); if (!L.run.ballsAtStart) post({ type: 'note', msg: '⚠ 로봇에 공이 없습니다 — 🏓 탁구공 싣기를 켜고 시작하세요' }); }
    if (!run && was && L.run && !L.run.over) finish('프로그램 종료');
    was = run;
    if (ct && ct === L.ct) checkBalls();
    if (run && dt) track(dt);
    tickT += dt; if (run && tickT > 0.25 && L.run) { tickT = 0; post({ type: 'line', ev: 'tick', first: L.run.first, bonus: L.run.bonus, home: !!L.run.pts.home, req: L.req, onboard: onboard(), delivered: L.delivered, t: +(U.time() - L.run.t0).toFixed(1), phase: L.run.phase }); }
    syncMeshes();
  }
  requestAnimationFrame(loop);

  Object.assign(L, {
    makeMat, toggleLoad, finish, geo, onboard, attach, track, newRun, checkBalls, firstScore, bonusScore,
    setLoad(n) { L.count = clamp(Math.round(n) || 1, 1, 300); save(); L.syncPanel && L.syncPanel(); },
  });
})();
