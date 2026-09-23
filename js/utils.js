/* ===== Utilitários ===== */
window.HR = window.HR || {};

HR.U = {
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  // interpolação independente de framerate
  damp(a, b, lambda, dt) { return HR.U.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
  rand(a, b) { return a + Math.random() * (b - a); },
  chance(p) { return Math.random() < p; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },

  fmt(n) {
    n = Math.round(n || 0);
    const s = String(Math.abs(n));
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const j = s.length - i;
      out += s[i];
      if (j > 1 && (j - 1) % 3 === 0) out += '.';
    }
    return (n < 0 ? '-' : '') + out;
  },
  compact(n) { return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '').replace('.', ',') + 'M' : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '').replace('.', ',') + 'k' : String(n); },

  dateKey(d) {
    d = d || new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  },
  daysBetween(k1, k2) {
    if (!k1 || !k2) return 999;
    const a = new Date(k1 + 'T00:00:00'), b = new Date(k2 + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  },
  msToMidnight() {
    const n = new Date(); const m = new Date(n); m.setHours(24, 0, 0, 0); return m - n;
  },
  fmtCountdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h + 'h ' + String(m).padStart(2, '0') + 'm';
  },
  now() { return Date.now(); },
  uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); },

  // Cores: o jogo pede ~200 strings de cor por quadro, quase sempre as mesmas.
  // Guardamos o resultado. O alfa entra na chave com 2 casas (o olho nao ve
  // a diferenca e o cache fica pequeno); o t do mix com 3 casas.
  // O objeto do hexToRgb e compartilhado: quem chamar nao pode alterar.
  _rgb: {}, _rgba: {}, _mix: {}, _nCache: 0,
  hexToRgb(hex) {
    const M = HR.U._rgb; let c = M[hex]; if (c) return c;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const n = parseInt(h, 16);
    c = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    M[hex] = c; return c;
  },
  rgba(hex, a) {
    a = Math.round(a * 100) / 100;
    const U = HR.U; let m = U._rgba[hex]; if (!m) m = U._rgba[hex] = {};
    let s = m[a];
    if (s === undefined) {
      if (++U._nCache > 6000) { U._rgba = {}; U._mix = {}; U._nCache = 0; m = U._rgba[hex] = {}; }
      const c = U.hexToRgb(hex); s = m[a] = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
    }
    return s;
  },
  mix(h1, h2, t) {
    t = Math.round(t * 1000) / 1000;
    const U = HR.U, k = h1 + h2 + t; let s = U._mix[k]; if (s !== undefined) return s;
    if (++U._nCache > 6000) { U._rgba = {}; U._mix = {}; U._nCache = 0; }
    const a = U.hexToRgb(h1), b = U.hexToRgb(h2);
    const r = Math.round(a.r + (b.r - a.r) * t), g = Math.round(a.g + (b.g - a.g) * t), bl = Math.round(a.b + (b.b - a.b) * t);
    s = '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
    U._mix[k] = s; return s;
  },
  hsl(h, s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')'; },

  $(sel, root) { return (root || document).querySelector(sel); },
  $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },
  el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; },

  vibrate(pattern) {
    try {
      if (!HR.Store || !HR.Store.data.settings.vibration || !navigator.vibrate) return;
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // evita aviso do Chrome antes do 1º toque
      navigator.vibrate(pattern);
    } catch (e) { /* ignore */ }
  },
  isTouch() { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; },
  isCapacitor() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
};
