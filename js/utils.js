/* ===== Utilitários ===== */
window.HR = window.HR || {};

HR.U = {
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  // interpolação independente de framerate
  damp(a, b, lambda, dt) { return HR.U.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
  rand(a, b) { return a + Math.random() * (b - a); },
  randInt(a, b) { return Math.floor(HR.U.rand(a, b + 1)); },
  chance(p) { return Math.random() < p; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  easeInQuad(t) { return t * t; },

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

  hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },
  rgba(hex, a) { const c = HR.U.hexToRgb(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; },
  mix(h1, h2, t) {
    const a = HR.U.hexToRgb(h1), b = HR.U.hexToRgb(h2);
    const r = Math.round(a.r + (b.r - a.r) * t), g = Math.round(a.g + (b.g - a.g) * t), bl = Math.round(a.b + (b.b - a.b) * t);
    return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
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
