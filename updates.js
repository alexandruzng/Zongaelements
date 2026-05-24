/* Zonga Updates — popup de "Nueva actualización" para anunciar cambios.
   Cómo añadir una nueva: pon un nuevo objeto AL PRINCIPIO del array UPDATES.
   El campo `id` debe ser único (p. ej. fecha + slug). Quien aún no lo haya visto
   verá el popup en su próxima visita; quien ya lo haya cerrado no lo verá más.
*/
const UPDATES = [
  {
    id: '2026-05-24-fotos-cloud',
    title: 'Nueva actualización',
    items: [
      'Diario: las fotos ahora se sincronizan en la nube y se ven desde cualquier dispositivo.',
      'Arreglado el problema por el que algunos días desaparecían al refrescar.',
      'Vídeos retirados temporalmente del diario.',
    ],
  },
];

(function () {
  const SEEN_KEY = '__zonga_updates_seen__';
  const loadSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch { return []; } };
  const saveSeen = (arr) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(arr)); } catch {} };

  const seen = new Set(loadSeen());
  const unseen = UPDATES.filter(u => !seen.has(u.id));
  if (unseen.length === 0) return;

  const latest = unseen[0]; // el más reciente (primero del array)

  function show() {
    if (document.getElementById('__zonga_update_overlay__')) return;
    const overlay = document.createElement('div');
    overlay.id = '__zonga_update_overlay__';
    overlay.innerHTML = `
      <style>
        #__zonga_update_overlay__ {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 100000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: zuFade .25s ease;
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        }
        #__zonga_update_overlay__ .zu-card {
          background: #fff; border-radius: 22px; max-width: 420px; width: 100%;
          padding: 28px 26px 24px; box-shadow: 0 24px 70px rgba(0,0,0,0.28);
          font-family: 'DM Sans', system-ui, sans-serif; color: #1a1a1a;
          animation: zuSlide .35s cubic-bezier(.2,.8,.3,1);
        }
        #__zonga_update_overlay__ .zu-badge {
          display: inline-block; padding: 5px 11px; border-radius: 999px;
          background: linear-gradient(135deg, #1a1a1a, #444); color: #fff;
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; margin-bottom: 14px;
        }
        #__zonga_update_overlay__ h2 {
          font-size: 24px; font-weight: 700; margin: 0 0 18px;
          font-family: 'DM Serif Display', 'DM Sans', serif; letter-spacing: -0.4px;
        }
        #__zonga_update_overlay__ ul { list-style: none; padding: 0; margin: 0 0 22px; }
        #__zonga_update_overlay__ li {
          font-size: 14px; line-height: 1.55; color: #444;
          padding: 11px 0 11px 22px; border-bottom: 1px solid #f3f3f3;
          position: relative;
        }
        #__zonga_update_overlay__ li:last-child { border-bottom: none; }
        #__zonga_update_overlay__ li::before {
          content: ''; position: absolute; left: 4px; top: 18px;
          width: 6px; height: 6px; border-radius: 50%; background: #1a1a1a;
        }
        #__zonga_update_overlay__ button {
          width: 100%; padding: 13px; border: none; border-radius: 12px;
          background: #1a1a1a; color: #fff; font-size: 14px; font-weight: 600;
          font-family: inherit; cursor: pointer; transition: background .2s, transform .1s;
        }
        #__zonga_update_overlay__ button:hover { background: #333; }
        #__zonga_update_overlay__ button:active { transform: scale(0.98); }
        @keyframes zuFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zuSlide { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      </style>
      <div class="zu-card" id="__zonga_update_card__">
        <div class="zu-badge">Novedad</div>
        <h2>${latest.title || 'Nueva actualización'}</h2>
        <ul>${latest.items.map(i => `<li>${i.replace(/</g, '&lt;')}</li>`).join('')}</ul>
        <button id="__zonga_update_close__">Entendido</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const dismiss = () => {
      const el = document.getElementById('__zonga_update_overlay__');
      if (el) el.remove();
      const all = new Set(loadSeen());
      UPDATES.forEach(u => all.add(u.id)); // marcar todas como vistas para no acumular
      saveSeen([...all]);
    };

    document.getElementById('__zonga_update_close__').addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', onEsc); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
