// 종목 아이콘 (64 × 64, 선은 currentColor)
const S = (body) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  humanoid_battle: S(`
    <rect x="9" y="10" width="11" height="9" rx="2"/><path d="M14.5 19v4"/><rect x="8" y="23" width="13" height="15" rx="3"/>
    <path d="M21 26l9 3"/><path d="M8 27l-3 9"/><path d="M11 38l-2 14M18 38l2 14"/><path d="M6 52h6M17 52h6"/>
    <rect x="44" y="10" width="11" height="9" rx="2"/><path d="M49.5 19v4"/><rect x="43" y="23" width="13" height="15" rx="3"/>
    <path d="M43 27l-9-3"/><path d="M56 27l3 9"/><path d="M46 38l-2 14M53 38l2 14"/><path d="M41 52h6M52 52h6"/>
    <path d="M32 22l-2-6M32 22l3-5M32 22l-5-1" stroke="#ffcc33"/>`),
  humanoid_relay: S(`
    <rect x="12" y="8" width="11" height="9" rx="2"/><path d="M17.5 17v4"/><rect x="11" y="21" width="13" height="15" rx="3"/>
    <path d="M14 36l-3 16M21 36l5 15"/><path d="M8 52h6M23 51h6"/><path d="M24 25l10 4"/>
    <path d="M34 26l10 6" stroke="#ffcc33" stroke-width="4"/>
    <path d="M44 33l8-5"/><rect x="47" y="10" width="10" height="8" rx="2"/><path d="M52 18v3"/><path d="M52 21v10M52 31l-3 21M52 31l4 21"/>
    <path d="M30 58h26" stroke-dasharray="3 4"/>`),
  curling: S(`
    <ellipse cx="32" cy="42" rx="26" ry="11"/><ellipse cx="32" cy="42" rx="16" ry="6.8" stroke="#ff9a3c"/><ellipse cx="32" cy="42" rx="7" ry="3" stroke="#3fb950"/>
    <circle cx="32" cy="42" r="1.2" fill="currentColor"/>
    <path d="M17 17l8-4 8 4-8 4z" fill="#2f6bff33"/><path d="M17 17v8l8 4 8-4v-8M25 21v8"/>
    <path d="M36 27q4 6 0 10" stroke-dasharray="2 4"/>`),
  othello: S(`
    <path d="M22 6h20l16 16v20L42 58H22L6 42V22z"/>
    <circle cx="22" cy="24" r="6" fill="#ff3b30" stroke="none"/><circle cx="22" cy="40" r="6" fill="#ff3b30" stroke="none"/>
    <circle cx="42" cy="24" r="6" fill="#2f6bff" stroke="none"/><circle cx="42" cy="40" r="6" fill="#2f6bff" stroke="none"/>
    <rect x="29" y="27" width="6" height="10" rx="1" fill="#ff3b30" stroke="none"/><rect x="32" y="27" width="3" height="10" fill="#2f6bff" stroke="none"/>`),
  mrc: S(`
    <rect x="5" y="12" width="54" height="40" rx="3"/><path d="M32 12v40"/><circle cx="32" cy="32" r="8"/>
    <path d="M5 24h6v16H5M59 24h-6v16h6"/>
    <circle cx="44" cy="30" r="5" fill="#ffffff" stroke="#111"/><path d="M42 28l2 1 2-1M44 29v3" stroke="#111" stroke-width="1.6"/>
    <rect x="15" y="25" width="10" height="10" rx="2" fill="#2f6bff55"/>`),
  sumo: S(`
    <circle cx="32" cy="34" r="25"/><circle cx="32" cy="34" r="21" fill="#00000055"/>
    <rect x="15" y="27" width="14" height="12" rx="2" fill="#2f6bff66"/><path d="M29 28l4 5-4 5"/>
    <rect x="37" y="28" width="13" height="11" rx="2" fill="#ff3b3066"/>
    <path d="M10 10l5 4M54 10l-5 4" stroke="#ffcc33"/>`),
  line: S(`
    <rect x="5" y="8" width="54" height="48" rx="3"/>
    <path d="M14 48c0-12 10-10 12-20s14-12 22-6 4 18-6 20" stroke-width="4.5"/>
    <rect x="44" y="12" width="10" height="10" rx="1" fill="#ff9a3c55"/>
    <rect x="9" y="44" width="10" height="8" rx="1.5" fill="#3fb95066"/>`),
  middlebot: S(`
    <rect x="5" y="10" width="54" height="44" rx="3"/>
    <rect x="10" y="40" width="12" height="10" fill="#9aa4b244"/>
    <rect x="40" y="14" width="14" height="10" fill="#ffcc3355"/><rect x="40" y="38" width="14" height="10" fill="#ffcc3355"/>
    <rect x="25" y="25" width="6" height="6" fill="#ff3b30" stroke="none"/><rect x="33" y="25" width="6" height="6" fill="#3fb950" stroke="none"/><rect x="29" y="31" width="6" height="6" fill="#2f6bff" stroke="none"/>
    <path d="M14 18v14" /><circle cx="14" cy="16" r="3" fill="#3fb950"/>`),
  soccer_rc: S(`
    <rect x="5" y="14" width="54" height="36" rx="3"/><path d="M32 14v36"/><path d="M5 25h4v14H5M59 25h-4v14h4"/>
    <circle cx="38" cy="34" r="3.2" fill="#ffffff" stroke="#111" stroke-width="1.4"/>
    <rect x="17" y="27" width="11" height="9" rx="2" fill="#ff7a1a55"/><circle cx="19" cy="38" r="2"/><circle cx="26" cy="38" r="2"/>
    <path d="M22 27v-7M22 20l-3-3M22 20l3-3" stroke="#ffcc33"/>`),
};

export const LEAGUE_ICONS = {
  wrl: S(`<circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 8c-9 8-9 40 0 48M32 8c9 8 9 40 0 48"/><path d="M14 18c10 4 26 4 36 0M14 46c10-4 26-4 36 0"/>`),
  roborave: S(`<rect x="14" y="18" width="36" height="26" rx="6"/><circle cx="25" cy="31" r="4" fill="currentColor"/><circle cx="39" cy="31" r="4" fill="currentColor"/><path d="M32 18V9M28 9h8M14 31H8M56 31h-6M20 44l-4 10M44 44l4 10"/>`),
};
