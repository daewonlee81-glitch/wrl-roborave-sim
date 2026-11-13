/* WRL · RoboRAVE 시뮬레이터 다국어 (ko 원문 → en / ja / zh / es)
   - 화면의 글자(텍스트 노드 · title · placeholder · aria-label)를 사전으로 바꿉니다.
   - 숫자는 {n}으로 바꿔 찾고, 번역문의 {n}에 차례로 다시 넣습니다.
   - 문장 전체가 사전에 있으면 그대로, 없으면 사전의 구절을 긴 것부터 찾아 바꿉니다.
   - 언어는 localStorage 'wrlsim.lang' (같은 사이트의 캐드도 'mscad.lang'으로 맞춤).
   - 캔버스 글자 등 코드에서 쓰는 글자는 window.WRL_I18N.T('나') 처럼 바꿉니다. */
(function () {
  'use strict';
  var LANGS = [['ko', '한국어'], ['en', 'English'], ['ja', '日本語'], ['zh', '中文'], ['es', 'Español']];
  var CODES = LANGS.map(function (l) { return l[0]; });
  var me = document.currentScript;
  var base = me && me.src ? me.src : location.href;

  function pick() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (q && CODES.indexOf(q) >= 0) { try { localStorage.setItem('wrlsim.lang', q); } catch (e) {} return q; }
    var s = null;
    try { s = localStorage.getItem('wrlsim.lang'); } catch (e) {}
    if (s && CODES.indexOf(s) >= 0) return s;
    var nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'ko']);
    for (var i = 0; i < nav.length; i++) {
      var p = String(nav[i] || '').toLowerCase().slice(0, 2);
      if (CODES.indexOf(p) >= 0) return p;
    }
    return 'en';
  }
  var lang = pick();
  try { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang; } catch (e) {}

  var SPACED = lang === 'en' || lang === 'es';
  var HANGUL = /[가-힣]/;
  var NUM = /-?\d+(?:[.,:]\d+)*/g;
  var dict = null, phraseRe = null, cache = Object.create(null);

  function load() {
    if (lang === 'ko') return;
    try {
      var x = new XMLHttpRequest();
      x.open('GET', new URL('../i18n/' + lang + '.json?v=1', base).href, false);
      x.send(null);
      if (x.status === 200 || (x.status === 0 && x.responseText)) dict = JSON.parse(x.responseText);
    } catch (e) { dict = null; }
    if (!dict) return;
    var keys = Object.keys(dict).filter(function (k) { return dict[k] && dict[k] !== k; });
    keys.sort(function (a, b) { return b.length - a.length; });
    var parts = keys.map(function (k) {
      var esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var h = (k.replace(/\{n\}/g, '').match(/[가-힣]/g) || []).length;
      // 한글 두 글자 이하의 짧은 말은 다른 한글 낱말 속에서는 바꾸지 않음 (예: '방' ≠ '방향')
      return h <= 2 ? '(?<![\\uac00-\\ud7a3])' + esc + '(?![\\uac00-\\ud7a3])' : esc;
    });
    parts.push('\\{n\\}'); // 사전에 없는 숫자 자리도 차례를 셈
    try { phraseRe = new RegExp(parts.join('|'), 'g'); } catch (e) { phraseRe = null; }
  }
  load();

  // 숫자를 {n}으로 바꾼 '모양'을 번역. 결과에는 원문 숫자의 차례 번호 표시(\u0001k\u0002)를 넣어
  // 번역문에서 숫자 순서가 바뀌어도({0},{1}…) 제자리에 들어가게 함
  function mk(k) { return '\u0001' + k + '\u0002'; }
  function norm(t, base) { var i = 0; return t.replace(/\{(n|\d+)\}/g, function (_, g) { return mk(base + (g === 'n' ? i++ : +g)); }); }
  function shapeT(shape) {
    var c = cache[shape];
    if (c !== undefined) return c;
    var r = dict[shape];
    if (r !== undefined) r = norm(r, 0);
    else if (phraseRe) {
      var seen = 0, last = 0;
      r = shape.replace(phraseRe, function (m, off) {
        seen += (shape.slice(last, off).match(/\{n\}/g) || []).length; last = off + m.length;
        var base = seen; seen += (m.match(/\{n\}/g) || []).length;
        if (m === '{n}' && dict[m] === undefined) return mk(base);
        var t = dict[m];
        if (t === undefined) return norm(m, base);
        if (SPACED) { // 영어·스페인어: 숫자와 낱말 사이 띄어 쓰기
          if (/^[A-Za-z\u00c0-\u024f]/.test(t) && shape.slice(Math.max(0, off - 3), off) === '{n}') t = ' ' + t;
          if (/[A-Za-z\u00c0-\u024f]$/.test(t) && shape.substr(off + m.length, 3) === '{n}') t = t + ' ';
        }
        return norm(t, base);
      });
      var rest = shape.slice(last).match(/\{n\}/g);
      if (rest) { var k = seen; r = r.replace(/\{n\}/g, function () { return mk(k++); }); }
    } else r = norm(shape, 0);
    cache[shape] = r;
    return r;
  }
  function T(s) {
    if (!dict || s == null) return s;
    s = String(s);
    if (!HANGUL.test(s)) return s;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    var core = m[2];
    var nums = core.match(NUM) || [];
    var out = shapeT(core.replace(NUM, '{n}')).replace(/\u0001(\d+)\u0002/g, function (_, k) { return nums[+k] !== undefined ? nums[+k] : ''; });
    return m[1] + out + m[3];
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  var ATTRS = ['title', 'placeholder', 'aria-label'];
  var done = new WeakMap();

  function skipEl(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.nodeName] || e.isContentEditable || (e.hasAttribute && e.hasAttribute('data-noi18n'))) return true;
    }
    return false;
  }
  function doText(n) {
    var v = n.data;
    if (!v || done.get(n) === v || !HANGUL.test(v)) return;
    if (skipEl(n.parentNode)) return;
    var t = T(v);
    if (SPACED && t !== v) { // 한국어 조사처럼 앞뒤 글자에 붙어 있던 조각은 띄어 씀
      if (/^[\uac00-\ud7a3]/.test(v) && n.previousSibling && /^[A-Za-z\u00c0-\u024f0-9(]/.test(t)) t = ' ' + t;
      if (/[\uac00-\ud7a3]$/.test(v) && n.nextSibling && /[A-Za-z\u00c0-\u024f0-9.)]$/.test(t)) t = t + ' ';
    }
    done.set(n, t);
    if (t !== v) n.data = t;
  }
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a && HANGUL.test(a)) { var t = T(a); if (t !== a) el.setAttribute(ATTRS[i], t); }
    }
    if (el.nodeName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && HANGUL.test(el.value)) el.value = T(el.value);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP[root.nodeName]) return; doAttrs(root); }
    var doc = root.ownerDocument || root;
    var w = doc.createTreeWalker(root, 5 /* ELEMENT | TEXT */, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else doAttrs(n);
    }
  }
  function patchDialogs(win) {
    try {
      ['alert', 'confirm', 'prompt'].forEach(function (k) {
        var f = win[k];
        if (!f || f.__i18n) return;
        var g = function (msg) { var a = Array.prototype.slice.call(arguments); a[0] = T(msg); return f.apply(win, a); };
        g.__i18n = true;
        win[k] = g;
      });
    } catch (e) {}
  }
  function attach(doc) {
    if (!dict || !doc || doc.__wrlI18n) return;
    doc.__wrlI18n = true;
    var go = function () { walk(doc.documentElement); };
    go();
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', go);
    var mo = new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === 'characterData') doText(r.target);
        else if (r.type === 'attributes') { if (r.target.nodeType === 1) doAttrs(r.target); }
        else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
      }
    });
    mo.observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (doc.defaultView) patchDialogs(doc.defaultView);
  }

  function setLang(l) {
    if (CODES.indexOf(l) < 0) return;
    try { localStorage.setItem('wrlsim.lang', l); localStorage.setItem('mscad.lang', l); } catch (e) {}
    var u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); location.replace(u.href); } else location.reload();
  }

  // 언어 고르기 (data-langsel 이 있는 페이지, 맨 위 창에서만)
  function selector() {
    var s = document.createElement('select');
    s.id = 'wrlLangSel';
    s.setAttribute('data-noi18n', '');
    s.setAttribute('aria-label', 'Language');
    s.title = 'Language / 언어';
    LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = '🌐 ' + l[1]; if (l[0] === lang) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', function () { setLang(s.value); });
    s.style.cssText = 'position:fixed;top:10px;right:12px;z-index:9999;font:600 13px system-ui,sans-serif;padding:5px 8px;border-radius:10px;border:1px solid #ffffff33;background:#1b1f33cc;color:#fff;backdrop-filter:blur(6px);cursor:pointer';
    return s;
  }
  if (me && me.hasAttribute('data-langsel') && window.top === window) {
    var put = function () {
      if (document.getElementById('wrlLangSel')) return;
      var css = document.createElement('style'); css.textContent = 'body.playing #wrlLangSel{display:none}'; // 경기 화면 위에서는 숨김
      document.head.appendChild(css); document.body.appendChild(selector());
    };
    if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
  }

  window.WRL_I18N = { lang: lang, LANGS: LANGS, T: T, setLang: setLang, attach: attach, selector: selector };
  attach(document);
})();
