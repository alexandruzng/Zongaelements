/* Zonga Memory — backup/restore unificado para todas las herramientas
   Carga este script en cualquier herramienta y aparecerá un botón flotante
   "Mis datos" que permite al cliente exportar/importar todos sus datos. */
(function () {
  if (window.__zongaMemoryLoaded) return;
  window.__zongaMemoryLoaded = true;

  const APP = 'Zonga Elements';
  const META_KEY = '__zonga_memory_meta__';
  const REMINDER_DAYS = 14;

  // ── Estilos inyectados ──
  const style = document.createElement('style');
  style.textContent = `
    .zm-fab {
      position: fixed; right: 18px; bottom: 18px; z-index: 99999;
      background: #1a1a1a; color: #fff; border: none;
      border-radius: 999px; padding: 12px 18px;
      font: 600 13px/1 'DM Sans', system-ui, -apple-system, 'Inter', sans-serif;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.05);
      transition: transform .15s ease, box-shadow .2s ease;
    }
    .zm-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.24); }
    .zm-fab .zm-dot { width:8px; height:8px; border-radius:50%; background:#fbbf24; display:none; }
    .zm-fab.zm-stale .zm-dot { display: inline-block; }
    @media (max-width: 540px) { .zm-fab { right: 12px; bottom: 12px; padding: 10px 14px; font-size: 12px; } }

    .zm-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      z-index: 100000; display: flex; align-items: center; justify-content: center;
      padding: 20px; animation: zmFade .2s ease;
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    }
    @keyframes zmFade { from { opacity: 0 } to { opacity: 1 } }
    .zm-modal {
      background: #fff; border-radius: 20px; max-width: 480px; width: 100%;
      max-height: 88vh; overflow-y: auto;
      font-family: 'DM Sans', system-ui, -apple-system, 'Inter', sans-serif;
      color: #1a1a1a; box-shadow: 0 25px 80px rgba(0,0,0,0.25);
      animation: zmSlide .25s cubic-bezier(.2,.8,.3,1);
    }
    @keyframes zmSlide { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
    .zm-modal-head {
      padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: flex-start;
    }
    .zm-modal h2 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
    .zm-modal .zm-sub { margin: 4px 0 0; font-size: 13px; color: #888; }
    .zm-close {
      background: #f5f5f5; border: none; border-radius: 10px;
      width: 32px; height: 32px; cursor: pointer; font-size: 16px; color: #666;
      display: flex; align-items: center; justify-content: center;
    }
    .zm-close:hover { background: #eee; }
    .zm-body { padding: 20px 24px 24px; }
    .zm-card {
      background: #fafafa; border: 1px solid #f0f0f0; border-radius: 14px;
      padding: 16px; margin-bottom: 12px;
    }
    .zm-card .zm-card-title {
      font-size: 13px; font-weight: 700; margin-bottom: 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .zm-card .zm-card-desc { font-size: 12px; color: #888; line-height: 1.5; margin-bottom: 12px; }
    .zm-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 16px; border-radius: 10px;
      font: 600 13px 'DM Sans', system-ui, sans-serif;
      cursor: pointer; border: 1px solid transparent; transition: all .15s ease;
      width: 100%;
    }
    .zm-btn-primary { background: #1a1a1a; color: #fff; }
    .zm-btn-primary:hover { background: #333; }
    .zm-btn-ghost { background: #fff; color: #1a1a1a; border-color: #e5e5e5; }
    .zm-btn-ghost:hover { border-color: #1a1a1a; }
    .zm-stat { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
    .zm-stat .k { color: #888; }
    .zm-stat .v { font-weight: 700; color: #1a1a1a; }
    .zm-warn {
      background: #fef3c7; border: 1px solid #fde68a; color: #92400e;
      padding: 10px 12px; border-radius: 10px; font-size: 12px; line-height: 1.5;
      margin-top: 12px;
    }
    .zm-toast {
      position: fixed; left: 50%; bottom: 80px; transform: translateX(-50%);
      background: #1a1a1a; color: #fff; padding: 10px 18px; border-radius: 999px;
      font: 600 13px 'DM Sans', system-ui, sans-serif; z-index: 100001;
      animation: zmToast 2.4s ease forwards; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    }
    @keyframes zmToast {
      0% { opacity: 0; transform: translate(-50%, 20px) }
      10%, 80% { opacity: 1; transform: translate(-50%, 0) }
      100% { opacity: 0; transform: translate(-50%, -10px) }
    }
  `;
  document.head.appendChild(style);

  // ── Helpers ──
  const meta = () => {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch { return {}; }
  };
  const setMeta = (m) => { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {} };

  function snapshot() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === META_KEY) continue;
      data[k] = localStorage.getItem(k);
    }
    return data;
  }

  function bytesUsed() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      total += k.length + (localStorage.getItem(k) || '').length;
    }
    return total * 2; // UTF-16
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function fmtDate(iso) {
    if (!iso) return 'nunca';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function daysSince(iso) {
    if (!iso) return Infinity;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'zm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // ── Export ──
  function exportData() {
    const payload = {
      app: APP,
      version: 1,
      exportedAt: new Date().toISOString(),
      origin: location.origin,
      data: snapshot(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `zonga-elements-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const m = meta();
    m.lastExportAt = payload.exportedAt;
    setMeta(m);
    refreshFab();
    toast('Backup descargado ✨');
  }

  // ── Import ──
  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const data = parsed.data || parsed;
          if (typeof data !== 'object' || !data) throw new Error('Formato inválido');
          const keys = Object.keys(data);
          if (keys.length === 0) throw new Error('Backup vacío');
          const ok = confirm(
            `Vas a restaurar ${keys.length} entradas desde el backup.\n\n` +
            `Esto SOBREESCRIBIRÁ los datos actuales que tengan el mismo nombre.\n\n` +
            `¿Continuar?`
          );
          if (!ok) return;
          keys.forEach(k => {
            if (k === META_KEY) return;
            try { localStorage.setItem(k, data[k]); } catch (e) { console.warn('No se pudo restaurar', k, e); }
          });
          const m = meta();
          m.lastImportAt = new Date().toISOString();
          setMeta(m);
          toast('Datos restaurados — recargando...');
          setTimeout(() => location.reload(), 1200);
        } catch (e) {
          alert('No se pudo leer el archivo: ' + e.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ── UI ──
  function openModal() {
    const snap = snapshot();
    const keyCount = Object.keys(snap).length;
    const used = bytesUsed();
    const m = meta();
    const lastExp = m.lastExportAt;
    const stale = daysSince(lastExp) > REMINDER_DAYS;

    const backdrop = document.createElement('div');
    backdrop.className = 'zm-backdrop';
    backdrop.innerHTML = `
      <div class="zm-modal" role="dialog" aria-modal="true">
        <div class="zm-modal-head">
          <div>
            <h2>💾 Mis datos</h2>
            <p class="zm-sub">Backup de tus datos guardados en este navegador</p>
          </div>
          <button class="zm-close" aria-label="Cerrar">×</button>
        </div>
        <div class="zm-body">
          <div class="zm-card">
            <div class="zm-stat"><span class="k">Entradas guardadas</span><span class="v">${keyCount}</span></div>
            <div class="zm-stat"><span class="k">Espacio ocupado</span><span class="v">${fmtBytes(used)}</span></div>
            <div class="zm-stat"><span class="k">Último backup</span><span class="v">${fmtDate(lastExp)}</span></div>
          </div>

          <div class="zm-card">
            <div class="zm-card-title">⬇️ Descargar backup</div>
            <div class="zm-card-desc">Guarda un archivo <code>.json</code> con todos tus datos. Recomendado al menos cada 2 semanas para no perder nada si limpias caché o cambias de dispositivo.</div>
            <button class="zm-btn zm-btn-primary" id="zmExport">Descargar backup ahora</button>
          </div>

          <div class="zm-card">
            <div class="zm-card-title">⬆️ Restaurar desde backup</div>
            <div class="zm-card-desc">Sube un archivo <code>.json</code> previamente descargado para recuperar tus datos.</div>
            <button class="zm-btn zm-btn-ghost" id="zmImport">Elegir archivo de backup</button>
          </div>

          ${stale ? `<div class="zm-warn">⚠️ Hace más de ${REMINDER_DAYS} días que no descargas un backup. Si limpias el caché del navegador, perderás tus datos.</div>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    backdrop.querySelector('.zm-close').addEventListener('click', close);
    backdrop.querySelector('#zmExport').addEventListener('click', () => { exportData(); close(); });
    backdrop.querySelector('#zmImport').addEventListener('click', importData);

    const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  }

  // ── FAB ──
  let fab;
  function refreshFab() {
    if (!fab) return;
    const stale = daysSince(meta().lastExportAt) > REMINDER_DAYS;
    fab.classList.toggle('zm-stale', stale);
    fab.title = stale
      ? 'Hace más de 2 semanas que no haces backup — clic para descargarlo'
      : 'Backup y restauración de tus datos';
  }

  function mountFab() {
    if (document.querySelector('.zm-fab')) return;
    fab = document.createElement('button');
    fab.className = 'zm-fab';
    fab.innerHTML = '<span class="zm-dot"></span>💾 Mis datos';
    fab.addEventListener('click', openModal);
    document.body.appendChild(fab);
    refreshFab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFab);
  } else {
    mountFab();
  }

  // API pública mínima
  window.ZongaMemory = { open: openModal, export: exportData, import: importData };
})();
