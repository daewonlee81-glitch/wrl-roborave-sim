// 대진표 — 16팀 싱글 엘리미네이션 (16강 → 8강 → 4강 → 결승).
// 내 팀이 이길 때마다 다음 라운드 상대의 난이도(ROUND_LEVEL)가 올라갑니다.
// 가상 팀끼리의 경기는 숨은 실력(rating)으로 확률을 매겨 결과를 정합니다.
import { ROUND_LEVEL, ROUND_NAMES } from './events.js';

export const TEAM_POOL = [
  ['KOR', '서울 스파크'], ['KOR', '부산 파도'], ['KOR', '대전 이노봇'], ['KOR', '광주 빛고을'], ['KOR', '제주 바람돌이'],
  ['THA', 'Bangkok Mechanix'], ['THA', 'Chiang Mai Rangers'], ['TWN', 'Taipei Dragons'], ['TWN', 'Kaohsiung Bolt'],
  ['CHN', 'Beijing Pioneer'], ['CHN', 'Shenzhen Makers'], ['JPN', 'Osaka Gears'], ['USA', 'Albuquerque RAVE'],
  ['MEX', 'Monterrey Titanes'], ['VNM', 'Hanoi Lotus'], ['MYS', 'KL Circuit'], ['IDN', 'Jakarta Garuda'],
  ['IND', 'Pune Innov8'], ['PHL', 'Manila Volts'], ['MNG', 'Ulaanbaatar Eagles'],
];

const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function newTournament(myName) {
  const pool = shuffle(TEAM_POOL.slice()).slice(0, 15);
  const teams = [{ id: 0, nat: 'KOR', name: myName || '우리 팀', me: true, rating: 0 }];
  pool.forEach(([nat, name], i) => teams.push({ id: i + 1, nat, name, rating: +rnd(0.25, 1).toFixed(2) }));
  const order = shuffle(teams.map(t => t.id));
  // rounds[r] = [{a, b, winner, score}] (a, b = team id)
  const rounds = [[]];
  for (let i = 0; i < 16; i += 2) rounds[0].push({ a: order[i], b: order[i + 1], winner: null, score: null });
  for (let r = 1; r < 4; r++) rounds.push(Array.from({ length: 16 >> (r + 1) }, () => ({ a: null, b: null, winner: null, score: null })));
  return { teams, rounds, round: 0, state: 'playing', created: Date.now() }; // state: playing | out | champion
}

export function myMatch(t) {
  if (t.state !== 'playing') return null;
  const m = t.rounds[t.round].find(m => m.a === 0 || m.b === 0);
  return m || null;
}
export function opponentOf(t, m) { return t.teams[m.a === 0 ? m.b : m.a]; }
export const levelOf = r => ROUND_LEVEL[r];
export const roundName = r => ROUND_NAMES[r];

function simScore(kind, winner, loser) {
  if (kind === 'record') return null;
  const w = 1 + Math.floor(Math.random() * 3); return [w, Math.floor(Math.random() * w)];
}
function simMatch(t, m, r, kind) {
  const A = t.teams[m.a], B = t.teams[m.b];
  // 라운드가 올라갈수록 실력 차이가 결과에 더 크게 반영
  const pa = 1 / (1 + Math.exp(-(A.rating - B.rating) * (4 + r * 2)));
  m.winner = Math.random() < pa ? m.a : m.b;
  m.score = simScore(kind, m.winner);
}
function advance(t, r) {
  if (r >= 3) return;
  t.rounds[r].forEach((m, i) => { const n = t.rounds[r + 1][i >> 1]; if (i % 2 === 0) n.a = m.winner; else n.b = m.winner; });
}

/** 내 경기 결과 반영. result: 'win' | 'loss' | 'draw'. score: [나, 상대] (있으면). */
export function reportResult(t, result, score, kind) {
  const m = myMatch(t); if (!m) return t;
  if (result === 'draw') return t; // 다시 경기
  const meFirst = m.a === 0;
  m.winner = result === 'win' ? 0 : (meFirst ? m.b : m.a);
  m.score = score ? (meFirst ? score.slice() : [score[1], score[0]]) : null;
  m.mine = true;
  // 이 라운드의 다른 경기
  for (const o of t.rounds[t.round]) if (o.winner === null) simMatch(t, o, t.round, kind);
  advance(t, t.round);
  if (result === 'win') {
    if (t.round === 3) t.state = 'champion'; else t.round++;
  } else {
    t.state = 'out';
    // 남은 라운드도 끝까지 진행해 우승팀을 정함
    for (let r = t.round + 1; r < 4; r++) { for (const o of t.rounds[r]) simMatch(t, o, r, kind); advance(t, r); }
  }
  return t;
}

export function champion(t) { const f = t.rounds[3][0]; return f.winner === null ? null : t.teams[f.winner]; }

// 저장
const KEY = k => 'wrlsim.t.' + k;
export function loadT(k) { try { const s = localStorage.getItem(KEY(k)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
export function saveT(k, t) { try { localStorage.setItem(KEY(k), JSON.stringify(t)); } catch (e) {} }
export function clearT(k) { try { localStorage.removeItem(KEY(k)); } catch (e) {} }

/* ---------------- 기록 경기 (대진표 없이 점수 순위) ----------------
   정해진 횟수(tries)를 시도해 가장 좋은 점수로 16팀 순위를 매깁니다.
   가상 팀의 점수는 숨은 실력으로 만들되 실제 대회처럼 왕복을 못 마친 팀 · 왕복만 마친 팀 · 보너스까지 한 팀이 섞이게 합니다. */
export function newRecord(myName, opt) {
  const { tries = 3, first = 400, bonus = 0, step = 5 } = opt || {};
  const pool = shuffle(TEAM_POOL.slice()).slice(0, 15);
  const teams = [{ id: 0, nat: 'KOR', name: myName || '우리 팀', me: true, best: null }];
  const q = v => Math.round(v / step) * step;
  pool.forEach(([nat, name], i) => {
    const r = rnd(0.15, 1); let best = 0;
    for (let k = 0; k < tries; k++) {
      const luck = rnd(0.55, 1.05) * r;
      const s = luck < 0.5 ? q(first * Math.max(0, luck / 0.5) * rnd(0.35, 0.95)) : q(first + bonus * Math.min(1, (luck - 0.5) / 0.5) * rnd(0.5, 1));
      best = Math.max(best, s);
    }
    teams.push({ id: i + 1, nat, name, best });
  });
  return { type: 'record', teams, tries: [], max: tries, created: Date.now() };
}
export function addTry(rec, score) {
  if (rec.tries.length >= rec.max) return rec;
  rec.tries.push(score);
  rec.teams[0].best = Math.max(rec.teams[0].best ?? 0, score);
  return rec;
}
export function ranking(rec) {
  return rec.teams.slice().sort((a, b) => (b.best ?? -1) - (a.best ?? -1) || (a.me ? -1 : b.me ? 1 : 0));
}
export function myRank(rec) { return rec.teams[0].best == null ? null : ranking(rec).findIndex(t => t.me) + 1; }
