/* =====================================================================
   Ranking online (v5): "Jornada %" (quanto do jogo cada um já zerou) e
   "Infinito" (melhor pontuação). Backend: Supabase (REST + login anônimo),
   configurado em HR.CONFIG.BACKEND. Sem backend: ranking de demonstração.
   SQL e passo a passo: docs/BACKEND_RANKING.md
   ===================================================================== */
window.HR = window.HR || {};

HR.CONFIG.BACKEND = HR.CONFIG.BACKEND || { url: '', anonKey: '', table: 'orbo_players' };

HR.Online = {
  cache: {}, lastSubmit: 0, pending: null,
  enabled() { const B = HR.CONFIG.BACKEND; return !!(B && B.url && B.anonKey); },
  me() {
    const d = HR.Store.data; d.online = d.online || {};
    if (!d.online.local) { d.online.local = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); HR.Store.save(); }
    return d.online;
  },
  name() { const o = this.me(); return o.name || HR.Store.data.name || (HR.t('pilot') + '-' + o.local.slice(0, 4).toUpperCase()); },
  setName(n) {
    n = String(n || '').replace(/[<>"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
    if (n.length < 2) return false;
    const o = this.me(); o.name = n; HR.Store.data.name = n; HR.Store.save();
    this.submit(true); return true;
  },
  flag() { const loc = (navigator.language || '').split('-')[1]; return loc ? loc.toUpperCase().slice(0, 2) : (HR.lang === 'pt' ? 'BR' : ''); },
  pct() { return HR.Campaign && HR.Campaign.progressPct ? HR.Campaign.progressPct() : 0; },
  paths() { let s = ''; if (!HR.Singularity) return s; for (let i = 0; i < HR.ARCHONS.length; i++) { const l = HR.Singularity.layer(i); s += l.passed ? l.path : '-'; } return s; },
  row(uid) {
    const d = HR.Store.data, sg = d.singularity || {};
    return { id: uid, name: this.name(), flag: this.flag(), best: d.best || 0, pct: Math.round(this.pct() * 1000) / 1000, layers: HR.Singularity ? HR.Singularity.passedCount() : 0, paths: this.paths(), level: d.level, cleared_at: sg.firstClear ? new Date(sg.firstClear.at).toISOString() : null, updated_at: new Date().toISOString() };
  },
  headers(token) { const B = HR.CONFIG.BACKEND; return { apikey: B.anonKey, Authorization: 'Bearer ' + (token || B.anonKey), 'Content-Type': 'application/json' }; },
  // login anônimo do Supabase: cada aparelho vira um usuário; a linha do ranking tem o id desse usuário (RLS)
  async session() {
    const B = HR.CONFIG.BACKEND, o = this.me(), now = Date.now();
    if (o.auth && o.auth.at && o.auth.exp > now + 60000) return o.auth;
    try {
      let res;
      if (o.auth && o.auth.rt) {
        res = await fetch(B.url + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: this.headers(), body: JSON.stringify({ refresh_token: o.auth.rt }) });
        // outra aba pode ter girado o token: tenta de novo depois; só vira jogador novo após várias falhas seguidas
        if (!res.ok) { o.auth.fails = (o.auth.fails || 0) + 1; o.auth.exp = 0; HR.Store.save(); if (o.auth.fails < 5) return null; res = null; }
      }
      if (!res) res = await fetch(B.url + '/auth/v1/signup', { method: 'POST', headers: this.headers(), body: JSON.stringify({ data: { game: 'orbo' } }) });
      if (!res.ok) return null;
      const j = await res.json();
      o.auth = { at: j.access_token, rt: j.refresh_token, exp: now + (j.expires_in || 3600) * 1000, uid: j.user && j.user.id };
      HR.Store.save();
      return o.auth;
    } catch (_) { return null; }
  },
  async submit(force) {
    if (!this.enabled()) return false;
    const now = Date.now(); if (!force && now - this.lastSubmit < 15000) { clearTimeout(this.pending); this.pending = setTimeout(() => this.submit(true), 15000); return false; }
    this.lastSubmit = now;
    try {
      const s = await this.session(); if (!s || !s.uid) return false;
      const B = HR.CONFIG.BACKEND;
      const res = await fetch(B.url + '/rest/v1/' + B.table + '?on_conflict=id', { method: 'POST', headers: Object.assign(this.headers(s.at), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify([this.row(s.uid)]) });
      this.cache = {};
      return res.ok;
    } catch (_) { return false; }
  },
  // kind: 'journey' | 'endless' → { rows, me, online, first }
  async top(kind) {
    const key = kind, c = this.cache[key];
    if (c && Date.now() - c.t < 60000) return c.v;
    let v;
    if (this.enabled()) {
      try {
        const B = HR.CONFIG.BACKEND, order = kind === 'endless' ? 'best.desc' : 'pct.desc,cleared_at.asc.nullslast';
        const res = await fetch(B.url + '/rest/v1/' + B.table + '?select=id,name,flag,best,pct,layers,cleared_at&order=' + order + '&limit=50', { headers: this.headers() });
        if (!res.ok) throw new Error('http ' + res.status);
        const rows = await res.json(), uid = this.me().auth && this.me().auth.uid;
        rows.forEach(r => { r.me = r.id === uid; });
        let first = null;
        try { const f = await fetch(B.url + '/rest/v1/' + B.table + '?select=name,flag,cleared_at&layers=eq.11&order=cleared_at.asc&limit=1', { headers: this.headers() }); if (f.ok) first = (await f.json())[0] || null; } catch (_) { /* sem primeiro */ }
        v = { rows, online: true, first };
      } catch (_) { v = this.demo(kind); }
    } else v = this.demo(kind);
    const mine = { name: this.name(), flag: this.flag(), best: HR.Store.data.best || 0, pct: this.pct(), layers: HR.Singularity ? HR.Singularity.passedCount() : 0, me: true };
    if (!v.rows.some(r => r.me)) { v.rows = v.rows.concat([mine]); v.rows.sort((a, b) => kind === 'endless' ? b.best - a.best : b.pct - a.pct); }
    v.myRank = v.rows.findIndex(r => r.me) + 1;
    this.cache[key] = { t: Date.now(), v };
    return v;
  },
  demo(kind) {
    const week = Math.floor(Date.now() / (7 * 86400000));
    let seed = week * 7919 + (kind === 'endless' ? 13 : 71);
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const rows = [];
    for (let i = 0; i < 40; i++) {
      const name = HR.CONFIG.BOT_NAMES[Math.floor(rnd() * HR.CONFIG.BOT_NAMES.length)] + (rnd() < 0.5 ? String(Math.floor(rnd() * 99)) : '');
      const flag = HR.CONFIG.BOT_FLAGS[Math.floor(rnd() * HR.CONFIG.BOT_FLAGS.length)];
      rows.push({ name, flag, best: Math.floor(6 + Math.pow(rnd(), 2.2) * 190), pct: Math.round(Math.pow(rnd(), 2.6) * 18 * 1000) / 1000, layers: 0, bot: true });
    }
    rows.sort((a, b) => kind === 'endless' ? b.best - a.best : b.pct - a.pct);
    return { rows, online: false, first: null };
  }
};

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  pilot: 'Piloto', tab_journey: 'Jornada %', tab_endless_rank: 'Infinito', lb_name: 'Seu nome no ranking', lb_save: 'Salvar', lb_saved: 'Nome salvo', lb_name_bad: 'Use de 2 a 18 caracteres.',
  lb_offline: 'Ranking online ainda não conectado: mostrando uma demonstração.', lb_online: 'Ranking online, aberto para todos. Atualiza ao fim de cada partida.', lb_loading: 'Carregando…',
  lb_first: 'Primeiro a atravessar as 11 camadas: {name}', lb_first_none: 'Ninguém atravessou as 11 camadas ainda. O prêmio misterioso espera.', lb_you_pct: 'Sua jornada', lb_you_best: 'Seu recorde', lb_layers: '{n}/11 camadas', lb_journey_d: 'Porcentagem do jogo zerada: fases, estrelas e Arcontes.'
});
Object.assign(HR.I18N.en, {
  pilot: 'Pilot', tab_journey: 'Journey %', tab_endless_rank: 'Endless', lb_name: 'Your leaderboard name', lb_save: 'Save', lb_saved: 'Name saved', lb_name_bad: 'Use 2 to 18 characters.',
  lb_offline: 'Online leaderboard not connected yet: showing a demo.', lb_online: 'Online leaderboard, open to everyone. Updates after every run.', lb_loading: 'Loading…',
  lb_first: 'First to cross the 11 layers: {name}', lb_first_none: 'No one has crossed the 11 layers yet. The mystery prize awaits.', lb_you_pct: 'Your journey', lb_you_best: 'Your record', lb_layers: '{n}/11 layers', lb_journey_d: 'Share of the game completed: levels, stars and Archons.'
});
Object.assign(HR.I18N.es, {
  pilot: 'Piloto', tab_journey: 'Jornada %', tab_endless_rank: 'Infinito', lb_name: 'Tu nombre en el ranking', lb_save: 'Guardar', lb_saved: 'Nombre guardado', lb_name_bad: 'Usa de 2 a 18 caracteres.',
  lb_offline: 'Ranking online aún no conectado: mostrando una demostración.', lb_online: 'Ranking online, abierto a todos. Se actualiza al final de cada partida.', lb_loading: 'Cargando…',
  lb_first: 'Primero en cruzar las 11 capas: {name}', lb_first_none: 'Nadie ha cruzado las 11 capas todavía. El premio misterioso espera.', lb_you_pct: 'Tu jornada', lb_you_best: 'Tu récord', lb_layers: '{n}/11 capas', lb_journey_d: 'Porcentaje del juego completado: niveles, estrellas y Arcontes.'
});
