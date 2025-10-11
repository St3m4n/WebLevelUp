// /js/admin/audit.js
// Utilidad de auditoría unificada para panel admin
// Guarda entradas en localStorage bajo la llave AUDIT_LOG.
// Estructura de entrada:
// { at, actorRun?, actorEmail?, actorPerfil?, entity, action, target, meta? }

(function(){
  const LS_KEY = 'auditLog';
  const LIMIT = 200; // mantener últimas N entradas
  const DEFAULT_MODE = 'local'; // 'local' | 'remote'

  const cfg = {
    mode: DEFAULT_MODE,
    endpoint: '',           // ej: '/api/audit'
    headers: {},            // ej: { Authorization: 'Bearer ...' }
    writeThroughLocal: true // aunque sea remoto, también guardar local para UI inmediata
  };

  function readJSON(key, fallback){
    try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch {}
    return fallback;
  }
  function writeJSON(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function readSesion(){
    // Sesión unificada de admin
    try { const s = sessionStorage.getItem('sesionActual'); if (s) return JSON.parse(s); } catch {}
    try { const l = localStorage.getItem('sesionActual'); if (l) return JSON.parse(l); } catch {}
    return null;
  }

  function load(){
    const arr = readJSON(LS_KEY, []);
    return Array.isArray(arr) ? arr : [];
  }

  function save(list){ writeJSON(LS_KEY, list); }

  function makeId(){ return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }

  function log(entry){
    const ses = readSesion();
    const actorEmail = ses?.correo ? String(ses.correo).toLowerCase() : undefined;
    const actorPerfil = ses?.perfil;
    const actorRun = (()=>{
      // Algunas vistas sólo tienen RUN del usuario en LS legado
      try { const run = localStorage.getItem('currentUserRun'); return run || undefined; } catch { return undefined; }
    })();

    const safe = {
      id: makeId(),
      at: new Date().toISOString(),
      actorRun,
      actorEmail,
      actorPerfil,
      entity: String(entry?.entity || ''),
      action: String(entry?.action || ''),
      target: entry?.target == null ? '' : String(entry.target),
      meta: entry?.meta || undefined
    };
    // Local write-through for immediate UI
    try {
      const list = load();
      list.unshift(safe);
      save(list.slice(0, LIMIT));
    } catch {}

    // Remote (optional)
    if (cfg.mode === 'remote' && cfg.endpoint){
      try {
        fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...cfg.headers },
          body: JSON.stringify(safe)
        }).catch(()=>{});
      } catch {}
    }
    return safe;
  }

  function clearAll(){ save([]); }

  function clearForActor(opts){
    const sel = opts || {};
    const run = sel.run ? String(sel.run).toUpperCase() : undefined;
    const email = sel.email ? String(sel.email).toLowerCase() : undefined;
    const list = load();
    const filtered = list.filter(x => {
      const xr = x.actorRun ? String(x.actorRun).toUpperCase() : undefined;
      const xe = x.actorEmail ? String(x.actorEmail).toLowerCase() : undefined;
      const match = (run && xr === run) || (email && xe === email);
      return !match;
    });
    save(filtered);
    return filtered.length;
  }

  // Async loader with optional filters; if remote configured, fetch from API
  // filters: { actorRun?, actorEmail?, entity?, action?, limit? }
  async function loadAsync(filters){
    const f = filters || {};
    if (cfg.mode === 'remote' && cfg.endpoint){
      try {
        const params = new URLSearchParams();
        if (f.actorRun) params.set('actorRun', String(f.actorRun));
        if (f.actorEmail) params.set('actorEmail', String(f.actorEmail));
        if (f.entity) params.set('entity', String(f.entity));
        if (f.action) params.set('action', String(f.action));
        if (f.limit) params.set('limit', String(f.limit));
        const url = cfg.endpoint + (cfg.endpoint.includes('?') ? '&' : '?') + params.toString();
        const res = await fetch(url, { headers: { 'Accept': 'application/json', ...cfg.headers } });
        if (res.ok){
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch {}
    }
    // Fallback local
    const local = load();
    let items = local;
    if (f.actorRun){ const runUp = String(f.actorRun).toUpperCase(); items = items.filter(x=> (x.actorRun && String(x.actorRun).toUpperCase()===runUp)); }
    if (f.actorEmail){ const em = String(f.actorEmail).toLowerCase(); items = items.filter(x=> (x.actorEmail && String(x.actorEmail).toLowerCase()===em)); }
    if (f.entity){ items = items.filter(x=> x.entity === f.entity); }
    if (f.action){ items = items.filter(x=> x.action === f.action); }
    if (f.limit){ items = items.slice(0, Number(f.limit)||LIMIT); }
    return items;
  }

  function configure(opts){
    const o = opts || {};
    if (o.mode) cfg.mode = (o.mode === 'remote') ? 'remote' : 'local';
    if (o.endpoint != null) cfg.endpoint = String(o.endpoint || '');
    if (o.headers && typeof o.headers === 'object') cfg.headers = { ...o.headers };
    if (o.writeThroughLocal != null) cfg.writeThroughLocal = !!o.writeThroughLocal;
  }

  window.audit = Object.freeze({ load, log, clearAll, clearForActor, loadAsync, configure });
})();
