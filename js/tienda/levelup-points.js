// js/tienda/levelup-points.js
// Sistema central de Puntos/EXP y Referidos para Level-Up Gamer (LocalStorage only)
// NOTE: Mantiene compatibilidad con el modelo actual (semilla en window.usuarios + overrides en 'usuariosExtra').
// TODO: Si en el futuro existe backend, encapsular storage en adaptadores.
(function(){
  'use strict';

  // ==============================
  // CONFIG: reglas de negocio
  // ==============================
  const CONFIG = {
    REFERIDO_USA_CODIGO: 100,
    REFERENTE_GANA: 100,
    COMPRA_POR_1000: 1, // +1 punto por cada $1.000 CLP
    TORNEO_PARTICIPACION: 50,
    TORNEO_PODIO: 200,
    REF_PREFIX: 'LUG-' // Formato: LUG- + 6 alfanum
  };

  // ==============================
  // Helpers de almacenamiento
  // ==============================
  const safeJSON = { parse: (t, fb)=>{ try { return JSON.parse(t); } catch { return fb; } } };
  function lsGet(key, fb){ try { const r = localStorage.getItem(key); return r==null? fb : r; } catch { return fb; } }
  function lsSet(key, val){ try { localStorage.setItem(key, val); } catch {} }

  function getUsuariosExtra(){
    const raw = lsGet('usuariosExtra', '[]');
    const arr = safeJSON.parse(raw, []);
    return Array.isArray(arr) ? arr : [];
  }
  function setUsuariosExtra(list){ lsSet('usuariosExtra', JSON.stringify(Array.isArray(list)?list:[])); }

  function normalizeRun(run){ return String(run||'').replace(/[^0-9kK]/g,'').toUpperCase(); }

  function mergeUsuarios(seed, extras){
    // Igual a enfoque de js/script.js: extras sobrescriben/preceden
    const byCorreo = new Map();
    const byRun = new Map();
    const out = [];
    const pushUser = (u) => {
      const correo = String(u.correo || '').toLowerCase();
      const runNorm = normalizeRun(u.run);
      if (correo && !byCorreo.has(correo) && runNorm && !byRun.has(runNorm)) {
        byCorreo.set(correo, true);
        byRun.set(runNorm, true);
        out.push(u);
      }
    };
    (Array.isArray(extras)?extras:[]).forEach(e => { const { passwordHash, passwordSalt, ...safe } = e || {}; pushUser(safe); });
    (Array.isArray(seed)?seed:[]).forEach(pushUser);
    return out;
  }

  function getMergedUsuarios(){
    const seed = Array.isArray(window.usuarios) ? window.usuarios : (window.usuarios||[]);
    const extras = getUsuariosExtra();
    return mergeUsuarios(seed, extras);
  }

  function findUserByRun(run){
    const rn = normalizeRun(run);
    return getMergedUsuarios().find(u => normalizeRun(u.run) === rn) || null;
  }
  function findUserByCorreo(correo){
    const c = String(correo||'').toLowerCase();
    return getMergedUsuarios().find(u => String(u.correo||'').toLowerCase()===c) || null;
  }

  function upsertExtraPatchByRun(run, patch){
    const rn = normalizeRun(run);
    const list = getUsuariosExtra();
    let idx = list.findIndex(u => normalizeRun(u.run) === rn);
    if (idx === -1) {
      // Si no existe, crear override mínimo con el RUN
      list.push({ run: rn, ...(patch||{}) });
      setUsuariosExtra(list);
      return list[list.length-1];
    }
    const prev = list[idx] || {};
    const merged = deepMerge(prev, patch||{});
    list[idx] = merged;
    setUsuariosExtra(list);
    return merged;
  }

  function deepMerge(target, src){
    const out = Array.isArray(target) ? target.slice() : { ...target };
    Object.keys(src||{}).forEach(k => {
      const v = src[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = deepMerge(out[k] || {}, v);
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  // ==============================
  // Inicialización / Migración
  // ==============================
  function ensureReferralCode(run){
    const rn = normalizeRun(run);
    if (!rn) return '';
    const list = getUsuariosExtra();
    let idx = list.findIndex(u => normalizeRun(u.run) === rn);
    const make = () => {
      const az = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let s = '';
      for (let i=0;i<6;i++) s += az[Math.floor(Math.random()*az.length)];
      return CONFIG.REF_PREFIX + s;
    };
    if (idx === -1) {
      const code = make();
      list.push({ run: rn, referralCode: code, points: 0, exp: { torneos: 0, compras: 0, referidos: 0 } });
      setUsuariosExtra(list);
      return code;
    }
    if (!list[idx].referralCode) {
      list[idx].referralCode = make();
      // Inicializar campos si faltan
      if (!Number.isFinite(list[idx].points)) list[idx].points = 0;
      if (!list[idx].exp) list[idx].exp = { torneos: 0, compras: 0, referidos: 0 };
      setUsuariosExtra(list);
    }
    return list[idx].referralCode;
  }

  function initUserEnhancements(){
    // Migrar/asegurar estructura en overrides existentes (no tocamos semilla directamente)
    const list = getUsuariosExtra();
    let changed = false;
    for (let i=0;i<list.length;i++){
      const u = list[i] || {};
      if (!Number.isFinite(u.points)) { u.points = 0; changed = true; }
      if (!u.exp || typeof u.exp !== 'object') { u.exp = { torneos: 0, compras: 0, referidos: 0 }; changed = true; }
      if (!u.referralCode) { u.referralCode = ensureReferralCode(u.run || ''); changed = true; }
      list[i] = u;
    }
    if (changed) setUsuariosExtra(list);
    // Asegurar override mínimo para cada usuario fusionado (semilla y extras)
    const merged = getMergedUsuarios();
    merged.forEach(u => {
      const rn = normalizeRun(u.run);
      if (!rn) return;
      const extras = getUsuariosExtra();
      const idx = extras.findIndex(e => normalizeRun(e.run)===rn);
      if (idx === -1) {
        upsertExtraPatchByRun(rn, { points: 0, exp: { torneos: 0, compras: 0, referidos: 0 }, referralCode: ensureReferralCode(rn) });
      } else {
        ensureReferralCode(rn);
      }
    });
  }

  // ==============================
  // API pública solicitada
  // ==============================
  function getCurrentUser(){
    // Preferir Session.get() por correo y mapear a usuario/extra completo
    try {
      if (window.Session && typeof window.Session.get === 'function'){
        const ses = window.Session.get();
        if (ses && ses.correo){
          const u = findUserByCorreo(ses.correo);
          if (u) return u;
        }
      }
    } catch {}
    // Fallback por run guardado (si existiera)
    try {
      const r = localStorage.getItem('currentUserRun');
      if (r) { const u = findUserByRun(r); if (u) return u; }
    } catch {}
    return null;
  }

  function saveUsers(arr){
    // NOTE: La app no usa un key LS 'usuarios' actualmente. Persistimos por compatibilidad si alguien lo necesita.
    // Mantener también window.usuarios en memoria.
    try { localStorage.setItem('usuarios', JSON.stringify(Array.isArray(arr)?arr:[])); } catch {}
    try { window.usuarios = Array.isArray(arr) ? arr : (window.usuarios||[]); } catch {}
  }

  function recordLog(key, entry){
    const raw = lsGet(key, '[]');
    const list = safeJSON.parse(raw, []);
    if (Array.isArray(list)) list.push(entry);
    lsSet(key, JSON.stringify(list));
  }

  function applyReferralOnRegistration({ newUserRun, referralCodeUsado }){
    const rn = normalizeRun(newUserRun);
    if (!rn) return { ok:false, reason:'run-missing' };
    const code = String(referralCodeUsado||'').trim();
    if (!code) return { ok:false, reason:'no-code' };

    const merged = getMergedUsuarios();
    const newUser = merged.find(u => normalizeRun(u.run)===rn);
    if (!newUser) return { ok:false, reason:'new-user-not-found' };

    // Evitar re-aplicar si ya tiene referredBy
    const extras = getUsuariosExtra();
    const idxNewExtra = extras.findIndex(e => normalizeRun(e.run)===rn);
    const alreadyReferred = idxNewExtra !== -1 && !!extras[idxNewExtra].referredBy;
    if (alreadyReferred) return { ok:false, reason:'already-referred' };

    // Buscar dueño del código
    // Primero en overrides (porque allí guardamos referralCode), luego en merged si no
    const ownerExtra = extras.find(e => String(e.referralCode||'')===code) || null;
    let refRun = ownerExtra ? normalizeRun(ownerExtra.run) : '';
    if (!refRun){
      const ownerMerged = merged.find(u => String(u.referralCode||'')===code);
      if (ownerMerged) refRun = normalizeRun(ownerMerged.run);
    }
    if (!refRun) return { ok:false, reason:'code-not-found' };
    if (refRun === rn) return { ok:false, reason:'self-ref' };

    // Aplicar beneficios
    const now = new Date().toISOString();
    // Nuevo usuario
    const newAfter = upsertExtraPatchByRun(rn, {
      referredBy: refRun,
      points: (idxNewExtra!==-1 && Number.isFinite(extras[idxNewExtra].points)) ? (extras[idxNewExtra].points + CONFIG.REFERIDO_USA_CODIGO) : CONFIG.REFERIDO_USA_CODIGO,
      exp: { referidos: 0, torneos: 0, compras: 0 } // se mergea manteniendo otros campos con deepMerge
    });
    // Asegurar exp existe y sumar nada a referidos del nuevo
    if (newAfter && newAfter.exp){ /* noop */ }

    // Referente
    const refAfter = upsertExtraPatchByRun(refRun, {
      points: (ownerExtra && Number.isFinite(ownerExtra.points)) ? (ownerExtra.points + CONFIG.REFERENTE_GANA) : CONFIG.REFERENTE_GANA,
      exp: { referidos: ((ownerExtra && ownerExtra.exp && Number.isFinite(ownerExtra.exp.referidos)) ? (ownerExtra.exp.referidos + 1) : 1) }
    });

    // Mantener compat con UI de perfil: agregar al listado visual de referidos del referente (por correo)
    try {
      const mergedNow = getMergedUsuarios();
      const newUserFull = mergedNow.find(u => normalizeRun(u.run)===rn) || {};
      const newEmail = String(newUserFull.correo||'');
      const list = getUsuariosExtra();
      const idxRef = list.findIndex(e => normalizeRun(e.run)===refRun);
      if (idxRef !== -1){
        const users = (list[idxRef].referidos && Array.isArray(list[idxRef].referidos.users)) ? list[idxRef].referidos.users.slice() : [];
        const normalized = users.map(x => (typeof x==='string') ? { email: x, date: '' } : { email: String(x?.email||''), date: String(x?.date||'') });
        if (!normalized.some(x => String(x.email||'').toLowerCase() === newEmail.toLowerCase())){
          normalized.push({ email: newEmail, date: now });
        }
        const cnt = (list[idxRef].referidos && Number.isFinite(list[idxRef].referidos.count)) ? (list[idxRef].referidos.count + 1) : normalized.length;
        list[idxRef].referidos = { count: cnt, users: normalized };
        setUsuariosExtra(list);
      }
    } catch {}

    // Log de referrals
    recordLog('referrals', { when: now, newRun: rn, refRun, code, pointsNew: CONFIG.REFERIDO_USA_CODIGO, pointsRef: CONFIG.REFERENTE_GANA });

    return { ok:true, newUserPoints: CONFIG.REFERIDO_USA_CODIGO, referrerPoints: CONFIG.REFERENTE_GANA, refRun };
  }

  function addPurchasePoints({ run, totalCLP }){
    const rn = normalizeRun(run);
    const total = Math.max(0, Number(totalCLP)||0);
    const pts = Math.floor(total / 1000) * CONFIG.COMPRA_POR_1000;
    const now = new Date().toISOString();
    const extras = getUsuariosExtra();
    const idx = extras.findIndex(e => normalizeRun(e.run)===rn);
    const currentPts = (idx!==-1 && Number.isFinite(extras[idx].points)) ? extras[idx].points : 0;
    const currentCompras = (idx!==-1 && extras[idx].exp && Number.isFinite(extras[idx].exp.compras)) ? extras[idx].exp.compras : 0;
    upsertExtraPatchByRun(rn, {
      points: currentPts + pts,
      // EXP por compras se acumula en la misma escala de puntos (no CLP bruto)
      exp: { compras: currentCompras + pts }
    });
    recordLog('compras', { when: now, run: rn, totalCLP: total, points: pts });
    try { updateNavPointsBadge(); } catch {}
    return { ok:true, pointsAdded: pts };
  }

  function addTournamentExp({ run, podium = false }){
    const rn = normalizeRun(run);
    const now = new Date().toISOString();
    let add = CONFIG.TORNEO_PARTICIPACION;
    let addExp = CONFIG.TORNEO_PARTICIPACION;
    if (podium) { add += CONFIG.TORNEO_PODIO; addExp += CONFIG.TORNEO_PODIO; }
    const extras = getUsuariosExtra();
    const idx = extras.findIndex(e => normalizeRun(e.run)===rn);
    const currentPts = (idx!==-1 && Number.isFinite(extras[idx].points)) ? extras[idx].points : 0;
    const currentT = (idx!==-1 && extras[idx].exp && Number.isFinite(extras[idx].exp.torneos)) ? extras[idx].exp.torneos : 0;
    upsertExtraPatchByRun(rn, { points: currentPts + add, exp: { torneos: currentT + addExp } });
    recordLog('torneos', { when: now, run: rn, podium: !!podium, points: add });
    try { updateNavPointsBadge(); } catch {}
    return { ok:true, pointsAdded: add };
  }

  function getUserStats(run){
    const rn = normalizeRun(run);
    const extras = getUsuariosExtra();
    const ex = extras.find(e => normalizeRun(e.run)===rn) || {};
    const points = Number.isFinite(ex.points) ? ex.points : 0;
    const exp = ex.exp && typeof ex.exp==='object' ? ex.exp : { torneos: 0, compras: 0, referidos: 0 };
    return { points, exp: { torneos: exp.torneos||0, compras: exp.compras||0, referidos: exp.referidos||0 }, referralCode: ex.referralCode || '', referredBy: ex.referredBy || '' };
  }

  // ==============================
  // UI Helpers: Navbar points
  // ==============================
  function expRequiredForLevel(n){
    // EXP necesaria para pasar de nivel n a n+1
    const levelNum = Math.max(1, Math.floor(n||1));
    return Math.max(1, Math.floor(50 * Math.pow(levelNum, 1.5)));
  }

  function computeLevelProgressFromExp(totalExp){
    // Itera restando el costo por nivel actual: req(n) = 50 * n^1.5
    let level = 1;
    let expLeft = Math.max(0, Math.floor(Number(totalExp)||0));
    let nextReq = expRequiredForLevel(level);
    let safety = 0;
    while (expLeft >= nextReq && safety < 100000){
      expLeft -= nextReq;
      level += 1;
      nextReq = expRequiredForLevel(level);
      safety++;
    }
    const pct = Math.max(0, Math.min(100, Math.floor((expLeft / nextReq) * 100)));
    return { level, into: expLeft, nextReq, pct };
  }

  function updateNavPointsBadge(){
    const cur = getCurrentUser();
    if (!cur) return;
    const stats = getUserStats(cur.run);
    const totalExp = Number(stats.exp?.torneos||0) + Number(stats.exp?.compras||0) + Number(stats.exp?.referidos||0);
    const { level } = computeLevelProgressFromExp(totalExp);
    // 1) Badge dentro del dropdown header
    try {
      const dropdown = document.querySelector('.nav-item.dropdown');
      if (dropdown){
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu){
          let header = menu.querySelector('h6.dropdown-header');
          if (header){
            let badge = header.parentElement.querySelector('.lug-points-badge');
            if (!badge){
              badge = document.createElement('li');
              badge.className = 'lug-points-badge px-3 pb-2';
              header.parentElement.insertBefore(badge, header.nextSibling);
            }
            badge.innerHTML = `<span class="badge bg-info text-dark" title="${totalExp} EXP">Lv. ${level}</span>`;
          }
        }
      }
    } catch {}
    // 2) Badge junto al icono de usuario (opcional, si el DOM lo permite)
    try {
      const link = document.querySelector('.nav-item.dropdown > a.nav-link, .nav-item.dropdown .nav-link');
      if (link){
        let badge = link.querySelector('.nav-points-inline');
        if (!badge){
          badge = document.createElement('span');
          badge.className = 'nav-points-inline badge rounded-pill bg-info text-dark ms-1 align-text-top';
          link.appendChild(badge);
        }
        badge.textContent = `Lv. ${level}`;
        badge.title = `${totalExp} EXP`;
      }
    } catch {}
  }

  // Exponer API global
  window.LevelUpPoints = {
    CONFIG,
    initUserEnhancements,
    getCurrentUser,
    saveUsers,
    ensureReferralCode,
    applyReferralOnRegistration,
    addPurchasePoints,
    addTournamentExp,
    getUserStats,
    updateNavPointsBadge,
    computeLevelProgressFromExp,
    expRequiredForLevel
  };

  // Auto-init al cargar en páginas tienda
  document.addEventListener('DOMContentLoaded', () => {
    try { initUserEnhancements(); } catch {}
    try { updateNavPointsBadge(); } catch {}
  });
})();
