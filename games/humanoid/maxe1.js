// maxe1.js — ROBOTIS MAX-E1 휴머노이드 (휴머노이드 배틀 · 로봇 컬링 공용)
//   · 3D: Dynamic-Makers와 같은 렌더링 (ROBOTIS STEP 부품 메시 + 부품 조립 행렬 · 평행 링크 · 색)
//   · 모션: ROBOTIS ENGINEER Kit 1 MAX-E1 예제 모션 (03_ENG1_MAX_E1.mtn3) © ROBOTIS
//   · Bot: 모션 재생 · 걷기(시작→반복→끝) · 옆걸음/돌기 · 공격/막기 · 넘어짐(무게중심·받침점) · 105/106 일어서기
import * as THREE from 'three';
import { PARTS_META, PARTS_GZ } from './parts-data.js';
export const D2R = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

/* ---------------- 모션 ---------------- */
export const MOT = await fetch(new URL('maxe1-motions.json', import.meta.url)).then(r => r.json());
const FRAME = MOT.frameSeconds;
const CALL = Object.fromEntries(MOT.calls);
export function timeline(idx, start, speed = 1) {
  const flow = MOT.flows[CALL[idx]]; if (!flow) return null;
  const frames = [{ t: 0, pose: start.slice() }]; let t0 = 0;
  for (const [page, loop, sp0] of flow) {
    const rows = MOT.pages[page]; if (!rows) continue; const sp = Math.max(0.05, sp0 * speed), secs = rows[rows.length - 1][0] * FRAME;
    for (let k = 0; k < loop; k++) { for (const r of rows) frames.push({ t: t0 + r[0] * FRAME / sp, pose: r.slice(1) }); t0 += secs / sp; }
  }
  return { frames, dur: t0 };
}
export function poseAt(tl, t) {
  const f = tl.frames; if (t <= 0) return f[0].pose;
  for (let i = 1; i < f.length; i++) if (f[i].t >= t) { const a = f[i - 1], b = f[i], k = (t - a.t) / Math.max(1e-6, b.t - a.t); return b.pose.map((v, n) => a.pose[n] + (v - a.pose[n]) * k); }
  return f[f.length - 1].pose;
}
// 모션별 이동(이 시뮬레이터의 가정): 앞 m/s · 왼쪽 m/s · 회전 rad/s
export const MOVE = {
  150: [0.05, 0, 0], 152: [0.11, 0, 0], 154: [0.04, 0, 0], 151: [0.1, 0, 0.25], 153: [0.1, 0, -0.25],
  155: [-0.04, 0, 0], 157: [-0.09, 0, 0], 159: [-0.03, 0, 0],
  160: [0.08, 0, 0], 162: [0.19, 0, 0], 164: [0.07, 0, 0], 165: [-0.07, 0, 0], 167: [-0.15, 0, 0], 169: [-0.05, 0, 0],
  132: [0, 0.055, 0], 133: [0, -0.055, 0], 134: [0, -0.07, 0], 135: [0, 0.07, 0],
  136: [0.045, -0.045, 0], 137: [0.045, 0.045, 0], 138: [-0.04, -0.04, 0], 139: [-0.04, 0.04, 0],
  140: [0, 0, -0.75], 141: [0, 0, 0.75],
};
// 공격: 쓰는 손발, 타격 구간(모션 진행 비율), 힘
export const ATK = {
  181: { name: '펀치', limb: 'Lh', win: [0.2, 0.62], pow: 1.0 },
  130: { name: '오른팔 옆 공격', limb: 'Rh', win: [0.32, 0.72], pow: 1.35 },
  131: { name: '왼팔 옆 공격', limb: 'Lh', win: [0.32, 0.72], pow: 1.35 },
  182: { name: '오른팔 훅', limb: 'Rh', win: [0.3, 0.68], pow: 1.55 },
  183: { name: '왼팔 훅', limb: 'Lh', win: [0.3, 0.68], pow: 1.55 },
  121: { name: '오른발 킥', limb: 'Rf', win: [0.35, 0.72], pow: 2.1, kick: true },
  120: { name: '왼발 킥', limb: 'Lf', win: [0.35, 0.72], pow: 2.1, kick: true },
};
export const BLOCK = { 122: [0.15, 0.85], 123: [0.15, 0.85] };

/* ---------------- MAX-E1 3D 모델 (Dynamic-Makers와 같은 렌더링) ---------------- */
// 부품: ROBOTIS STEP 도면에서 만든 저폴리 메시(parts-data.js) · 배치: 부품 조립(maxe1-cad.json) — Dynamic-Makers view.js와 같은 방식
// 몸체 계층은 MuJoCo 좌표(x 앞, y 왼쪽, z 위)로 만들고, 바깥 그룹을 −90° 돌려 three(y 위)에 놓습니다.
export const CAD = await fetch(new URL('maxe1-cad.json', import.meta.url)).then(r => r.json());
const PARTS = await (async () => {
  const bin = Uint8Array.from(atob(PARTS_GZ), c => c.charCodeAt(0));
  const buf = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const out = {};
  for (const [name, info] of Object.entries(PARTS_META)) {
    const q = new Int16Array(buf, info.off, info.nv * 3), idx = new Uint16Array(buf, info.off + info.nv * 6, info.nt * 3);
    const pos = new Float32Array(q.length); for (let i = 0; i < q.length; i++) pos[i] = q[i] / 100000;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    out[name] = g;
  }
  return out;
})();
const PART_COLORS = { frame: '#646b78', servo: '#2d3036', cover: '#8a92a0', sole: '#525a68' }; // Dynamic-Makers view.js
const PART_MATS = Object.fromEntries(Object.entries(PART_COLORS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide, flatShading: true })]));
const JOINTS = [ // ID 1~12 (Dynamic-Makers MAXE1_JOINT_MAP과 같은 방향)
  ['R_shoulder_pitch', -1], ['R_shoulder_roll', -1], ['L_shoulder_pitch', 1], ['L_shoulder_roll', 1],
  ['R_hip_roll', -1], ['R_hip_pitch', 1], ['L_hip_roll', -1], ['L_hip_pitch', 1],
  ['R_knee', -1], ['R_ankle_roll', 1], ['L_knee', -1], ['L_ankle_roll', 1]];
const TILT = CAD.dims.shoulderTilt * D2R, ARM_L = CAD.dims.armLength, ZC = CAD.bodies.torso.pos[2];
// 몸체 → (부모, 관절, 관절 축) — maxe1-model.js의 MJCF와 같은 축 (팔 앞뒤 축은 F2 끝면 15° 기울기)
const BODY_TREE = side => {
  const out = side === 'R' ? -1 : 1;
  return [
    [side + '_shoulder', 'torso', side + '_shoulder_pitch', [0, Math.cos(TILT), out * Math.sin(TILT)]],
    [side + '_arm', side + '_shoulder', side + '_shoulder_roll', [1, 0, 0]],
    [side + '_hip', 'torso', side + '_hip_roll', [1, 0, 0]],
    [side + '_thigh', side + '_hip', side + '_hip_pitch', [0, 1, 0]],
    [side + '_knee_frame', side + '_thigh', side + '_knee_comp', [0, 1, 0]],
    [side + '_shin', side + '_knee_frame', side + '_knee', [0, 1, 0]],
    [side + '_ankle_frame', side + '_shin', side + '_ankle_comp', [0, 1, 0]],
    [side + '_foot', side + '_ankle_frame', side + '_ankle_roll', [1, 0, 0]],
  ];
};
export function buildRobot(teamColor, label) {
  const root = new THREE.Group();                 // 경기장 위치 · 방향 (three)
  const tilt = new THREE.Group(); root.add(tilt);  // 넘어짐 (발 쪽을 축으로)
  const body = new THREE.Group(); tilt.add(body);   // 바닥까지 높이 보정
  const mj = new THREE.Group(); mj.rotation.x = -Math.PI / 2; body.add(mj); // MuJoCo → three
  const BP = n => CAD.bodies[n].pos;
  const B = { torso: new THREE.Group() }; B.torso.position.set(...BP('torso')); mj.add(B.torso);
  const J = {};
  for (const side of ['R', 'L']) for (const [name, parent, joint, axis] of BODY_TREE(side)) {
    const g = new THREE.Group(); const p = BP(name), q = BP(parent); g.position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    B[parent].add(g); B[name] = g; J[joint] = { o: g, axis: new THREE.Vector3(...axis).normalize() };
  }
  // 부품 메시
  const pivots = [];
  for (const e of CAD.visual) {
    const geo = PARTS[e.part]; if (!geo || !B[e.body]) continue;
    const mesh = new THREE.Mesh(geo, PART_MATS[e.color] || PART_MATS.frame); mesh.castShadow = true; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
    const local = new THREE.Matrix4().fromArray(e.m).transpose();
    if (e.pivotBody) { mj.add(mesh); pivots.push({ mesh, local, body: B[e.body], pivotBody: B[e.pivotBody], pivot: new THREE.Vector3(...e.pivot) }); } // 평행 링크: 몸체와 같이 돌되 핀은 pivotBody에 고정
    else { mesh.matrix.copy(local); B[e.body].add(mesh); }
  }
  // 타격 판정용 표식: 손끝 · 발끝 · 발바닥
  const M = {};
  for (const side of ['R', 'L']) {
    const out = side === 'R' ? -1 : 1, dir = new THREE.Vector3(0, out * Math.sin(TILT), -Math.cos(TILT));
    const h = new THREE.Object3D(); h.position.copy(dir.multiplyScalar(ARM_L)); B[side + '_arm'].add(h); M[side + 'h'] = h;
    const toe = new THREE.Object3D(); toe.position.set(0.05, 0, -0.028); B[side + '_foot'].add(toe); M[side + 'f'] = toe;
    const so = new THREE.Object3D(); so.position.set(0, 0, -CAD.dims.ankleRoll); B[side + '_foot'].add(so); M[side + 's'] = so;
    const L = CAD.dims.sole[0] / 2;
    for (const [k, x] of [['t', L], ['e', -L]]) { const o = new THREE.Object3D(); o.position.set(x, 0, -CAD.dims.ankleRoll); B[side + '_foot'].add(o); M[side + k] = o; } // 발끝 · 뒤꿈치
  }
  // 넘어지고 일어설 때 바닥에 닿을 수 있는 곳: 손 · 무릎 · 어깨 · 머리 · 몸통 모서리 · 배터리
  const C = [M.Rh, M.Lh];
  const add = (body, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); B[body].add(o); C.push(o); };
  for (const sd of ['R', 'L']) { add(sd + '_knee_frame', 0.03, 0, -0.008); add(sd + '_knee_frame', -0.012, 0, -0.008); add(sd + '_shoulder', 0, 0, 0.02); add(sd + '_hip', 0.022, 0, 0); add(sd + '_hip', -0.022, 0, 0); }
  const bx = CAD.dims.box; for (const x of [bx[0] / 2 + 0.006, -bx[0] / 2 - 0.006]) for (const z of [bx[2] / 2 + 0.05, -bx[2] / 2]) add('torso', x, 0, z);
  add('torso', -0.06, 0, -0.082); add('torso', 0.03, 0, bx[2] / 2 + 0.046); add('torso', -0.03, 0, bx[2] / 2 + 0.046);
  M.contacts = C;
  const MASS = Object.entries(CAD.bodies).map(([n, b]) => [B[n], b.mass]).filter(x => x[0]); M.mass = MASS;
  // 팀 표시 (로봇 모습은 그대로 두고 발밑 고리 · 머리 위 표식만)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.09, 40), new THREE.MeshBasicMaterial({ color: teamColor, transparent: true, opacity: 0.85 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; root.add(ring);
  const tag = (() => { const c = document.createElement('canvas'); c.width = 96; c.height = 48; const g = c.getContext('2d'); g.fillStyle = '#' + teamColor.toString(16).padStart(6, '0'); g.beginPath(); g.roundRect(2, 2, 92, 44, 10); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 28px system-ui'; g.textAlign = 'center'; g.fillText(label || (teamColor === 0x2f6bff ? '나' : '상대'), 48, 34); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.scale.set(0.07, 0.035, 1); sp.position.y = 0.43; sp.renderOrder = 5; root.add(sp); return sp; })();
  return { root, tilt, body, mj, B, J, M, pivots, ring, tag };
}
const _inv = new THREE.Matrix4(), _mb = new THREE.Matrix4(), _mp = new THREE.Matrix4(), _pin = new THREE.Vector3();
function updatePivots(r) {
  _inv.copy(r.mj.matrixWorld).invert();
  for (const it of r.pivots) {
    _mb.multiplyMatrices(_inv, it.body.matrixWorld); _mp.multiplyMatrices(_inv, it.pivotBody.matrixWorld);
    _pin.copy(it.pivot).applyMatrix4(_mp); _mb.setPosition(_pin);
    it.mesh.matrix.multiplyMatrices(_mb, it.local);
  }
}

/* ---------------- 로봇 ---------------- */
export class Bot {
  // opts: scene, groundY(바닥 높이 m), x, z, th, name
  constructor(team, opts = {}) {
    this.team = team; this.name = opts.name || (team ? '상대' : '나'); this.groundY = opts.groundY || 0;
    this.m = buildRobot(team ? 0xd23a2a : 0x2f6bff, opts.name); opts.scene.add(this.m.root);
    this.reset(opts.x || 0, opts.z || 0, opts.th || 0);
  }
  reset(x, z, th) {
    Object.assign(this, { x, z, th, pose: Array(12).fill(0), mot: null, queue: [], walk: null, fallen: null, fallT: 0, tiltA: 0, dt: 1 / 60, out: false, kb: [0, 0, 0], hitDone: false, idleT: 0, critUsed: this.critUsed || false, getup: false });
    this.play(101);
  }
  play(idx, opts = {}) {
    const tl = timeline(idx, this.pose, opts.speed || 1); if (!tl) return false;
    this.mot = { idx, tl, t: 0, kind: opts.kind || (ATK[idx] ? 'atk' : BLOCK[idx] ? 'block' : MOVE[idx] ? 'move' : 'pose'), then: opts.then || null };
    this.hitDone = false; if (idx !== 101) this.idleT = 0; return true;
  }
  get busy() { return this.mot && (this.mot.kind === 'atk' || this.mot.kind === 'block' || this.mot.kind === 'getup'); }
  get progress() { return this.mot ? this.mot.t / Math.max(1e-6, this.mot.tl.dur) : 1; }
  fwd() { return [Math.cos(this.th), -Math.sin(this.th)]; }
  left() { return [-Math.sin(this.th), -Math.cos(this.th)]; }
  step(dt) {
    // 넉백
    if (this.kb[2] > 0) { const k = Math.min(dt, this.kb[2]); this.x += this.kb[0] * k; this.z += this.kb[1] * k; this.kb[2] -= dt; }
    this.dt = dt;
    if (this.fallen && !this.getup) { this.fallT += dt; this.pose = this.pose.map(v => v * (1 - Math.min(1, dt * 1.5))); return; } // 넘어진 뒤 힘이 빠짐
    const m = this.mot; if (!m) return;
    m.t += dt;
    this.pose = poseAt(m.tl, m.t);
    const mv = MOVE[m.idx]; if (mv && !this.fallen) {
      const f = this.fwd(), l = this.left();
      this.x += (f[0] * mv[0] + l[0] * mv[1]) * dt; this.z += (f[1] * mv[0] + l[1] * mv[1]) * dt; this.th = wrapA(this.th + mv[2] * dt);
    }
    if (m.t >= m.tl.dur) {
      const was = m; this.mot = null;
      if (this.getup) { this.getup = false; this.fallen = null; }
      if (was.then) was.then();
      else if (!this.mot && was.idx !== 101 && !MOVE[was.idx]) this.play(101);
    }
  }
  // 걷기: 시작 → 반복(누르는 동안) → 끝
  walkCtl(dir, fast) {
    if (this.busy || this.fallen) return;
    const S = dir > 0 ? (fast ? [160, 162, 164] : [150, 152, 154]) : (fast ? [165, 167, 169] : [155, 157, 159]);
    if (this.walk && this.walk.dir === dir) { this.walk.hold = true; return; }
    this.walk = { dir, hold: true, S };
    const loop = () => { if (!this.walk) return; if (this.walk.hold) { this.walk.hold = false; this.play(S[1], { then: loop }); } else { const w = this.walk; this.walk = null; this.play(w.S[2], { then: () => { if (!this.mot) this.play(101); } }); } };
    this.play(S[0], { then: loop });
  }
  stopWalk() { if (this.walk) this.walk.hold = false; }
  repeatMove(idx) { if (this.busy || this.fallen || this.walk) return; if (this.mot && this.mot.idx === idx && this.mot.t < this.mot.tl.dur * 0.85) return; if (this.mot && this.mot.kind === 'move' && this.mot.idx !== idx && this.mot.t < this.mot.tl.dur * 0.6) return; this.play(idx); }
  attack(idx) { if (this.fallen || (this.busy && this.mot.kind !== 'block')) return false; this.walk = null; return this.play(idx, { kind: 'atk' }); }
  block(idx) { if (this.fallen || this.busy) return; this.walk = null; this.play(idx, { kind: 'block' }); }
  standUp() { if (!this.fallen || this.getup) return; this.getup = true; this.play(this.fallen.dir > 0 ? 105 : 106, { kind: 'getup' }); } // 앞으로 넘어지면 105, 뒤로 넘어지면 106
  knockDown(dir, slip = false) { if (this.fallen) return; this.walk = null; this.mot = null; this.fallen = { dir, slip }; this.fallT = 0; this.getup = false; }
  blocking() { const m = this.mot; if (!m || m.kind !== 'block') return false; const p = this.progress, w = BLOCK[m.idx]; return p > w[0] && p < w[1]; }
  stability() {
    if (this.fallen) return 0;
    const m = this.mot; if (!m) return 1.0;
    if (m.kind === 'atk') return ATK[m.idx].kick ? 0.35 : 0.7;
    if (m.kind === 'getup') return 0.4;
    if (m.kind === 'block') return 1.25;
    if (MOVE[m.idx]) return 0.8;
    return 1.0;
  }
  sync() {
    const r = this.m; r.root.position.set(this.x, this.out ? this.groundY - 0.5 * Math.min(1, this.outT || 0) : this.groundY, this.z); r.root.rotation.y = this.th;
    for (let i = 0; i < 12; i++) { const [name, sg] = JOINTS[i]; const j = r.J[name]; j.o.quaternion.setFromAxisAngle(j.axis, sg * this.pose[i] * D2R); }
    for (const s of ['R', 'L']) { // 이중 평행 링크: knee_comp = −hip_pitch, ankle_comp = −knee
      r.J[s + '_knee_comp'].o.quaternion.copy(r.J[s + '_hip_pitch'].o.quaternion).invert();
      r.J[s + '_ankle_comp'].o.quaternion.copy(r.J[s + '_knee'].o.quaternion).invert();
    }
    // 바닥 높이: 두 발바닥 중 낮은 쪽이 바닥에 닿게
    r.body.position.y = 0; r.tilt.rotation.set(0, 0, 0); r.root.updateMatrixWorld(true);
    const v = new THREE.Vector3(); let minY = 1e9; for (const s of ['R', 'L']) { r.M[s + 's'].getWorldPosition(v); minY = Math.min(minY, v.y - r.root.position.y); }
    r.body.position.y = -minY;
    // 기울기: 서 있는 자세(기울기 0)에서 무게중심 · 발끝/뒤꿈치 · 바닥에 닿을 곳을 계산
    //   넘어져 있으면 몸은 가장 먼저 바닥에 닿는 곳(손 · 무릎 · 머리 · 몸통)에 기대어 눕고,
    //   일어서기 모션(105 · 106)이 팔로 짚고 다리를 모으면 그만큼 몸이 세워집니다. 거의 섰을 때 무게중심이 발 위에 오면 똑바로 섭니다.
    r.root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(r.root.matrixWorld).invert(), loc = o => o.getWorldPosition(v).applyMatrix4(inv).clone();
    let toe = -1, heel = 1; for (const sd of ['R', 'L']) { toe = Math.max(toe, loc(r.M[sd + 't']).x); heel = Math.min(heel, loc(r.M[sd + 'e']).x); }
    let mx = 0, mw = 0; for (const [o, w] of r.M.mass) { mx += loc(o).x * w; mw += w; } mx /= mw;
    let tf = Math.PI / 2 - 0.04, tb = Math.PI / 2 - 0.04;
    for (const o of r.M.contacts) { const p = loc(o), y = Math.max(0.004, p.y); if (p.x - toe > 0.004) tf = Math.min(tf, Math.atan2(y, p.x - toe)); if (heel - p.x > 0.004) tb = Math.min(tb, Math.atan2(y, heel - p.x)); }
    let target;
    if (this.fallen && !this.getup) target = this.fallen.dir > 0 ? tf : -tb;
    else if (this.getup) {                             // 일어서는 중: 앞부분은 손·무릎 받침에 기대고, 다리를 모으는 뒷부분은 모션 진행만큼 세워짐
      const p = this.progress, sm = (a, b, t) => { const k = clamp((t - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
      const env = (Math.PI / 2 - 0.04) * (1 - sm(0.12, 0.78, p));
      target = this.fallen.dir > 0 ? Math.min(tf, env) : -Math.min(tb, env);
    }
    else if (this.tiltA > 0.3) target = tf;            // 앞으로 누워 있음: 받침(손·무릎)에 기댐
    else if (this.tiltA < -0.3) target = -tb;          // 뒤로 누워 있음
    else target = mx > toe ? tf : mx < heel ? -tb : 0;   // 거의 섬: 무게중심이 발 밖이면 그쪽으로 기움
    const rate = Math.abs(target) > Math.abs(this.tiltA) ? 5 : 3.2; // 넘어질 때는 빠르게, 일어설 때는 천천히
    const dA = clamp(target - this.tiltA, -rate * this.dt, rate * this.dt); this.tiltA += dA;
    if (!this.fallen && Math.abs(this.tiltA) > 0.75) this.knockDown(Math.sign(this.tiltA), true); // 스스로 균형을 잃음 (슬립 다운)
    const piv = this.tiltA >= 0 ? toe : heel;
    r.tilt.position.set(piv, 0, 0); r.body.position.x = -piv; r.tilt.rotation.z = -this.tiltA;
    r.root.updateMatrixWorld(true);
    updatePivots(r);
    r.tag.visible = !this.fallen && !this.out; r.ring.visible = !this.out;
  }
  limb(name) { const v = new THREE.Vector3(); this.m.M[name].getWorldPosition(v); return v; }
}
