/* Zonga Updates — popup de "Nueva actualización" para anunciar cambios.
   Cómo añadir una nueva: pon un nuevo objeto AL PRINCIPIO del array UPDATES.
   El campo `id` debe ser único (p. ej. fecha + slug). Quien aún no lo haya visto
   verá el popup en su próxima visita; quien ya lo haya cerrado no lo verá más.
*/
const UPDATES = [
  {
    id: '2026-05-25-generador-paleta-colores',
    title: 'Nueva actualización',
    items: [
      'Nueva herramienta: Generador de paleta de colores. Crea paletas armónicas para tu marca a partir de un estilo o color base.',
    ],
  },
  {
    id: '2026-05-24-generador-nombres-marca',
    title: 'Nueva actualización',
    items: [
      'Nueva herramienta: Generador de nombres de marca. Genera ideas de nombres originales para tu marca a partir de sector, estilo y palabras clave.',
    ],
  },
  {
    id: '2026-05-24-reviews-ig',
    title: 'Nueva actualización',
    items: [
      'Nueva herramienta: Generador de reviews Instagram. Crea capturas de conversaciones de clientes elogiando tu producto (ES/EN), con fotos de perfil y fotos de reseña personalizadas, y descarga todo en ZIP.',
    ],
  },
  {
    id: '2026-05-24-analisis-realismo-ia',
    title: 'Nueva actualización',
    items: [
      'Nueva herramienta: Análisis de realismo IA. Sube una foto generada con IA y obtén un veredicto sobre qué tan realista parece.',
    ],
  },
  {
    id: '2026-05-24-navegacion-backup',
    title: 'Nueva actualización',
    items: [
      'Cada herramienta tiene ahora un botón "Volver al menú" arriba a la izquierda.',
      'Nuevo bloque "Guarda tu información" en la home con el botón de descargar copia de seguridad.',
      'El botón flotante de guardado ya no aparece encima del contenido en las herramientas.',
    ],
  },
  {
    id: '2026-05-24-descargador-online',
    title: 'Nueva actualización',
    items: [
      'Descargador de vídeos sin marca de agua: ya funciona online, sin necesidad de tener el servidor local abierto.',
      'Soporta HD, SD y extracción de audio MP3.',
    ],
  },
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
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); z-index: 100000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: zuFade .25s ease;
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        #__zonga_update_overlay__ .zu-card {
          background: #FFFFFF; border-radius: 24px; max-width: 440px; width: 100%;
          padding: 30px 28px 26px;
          box-shadow: 0 25px 60px -15px rgba(37, 99, 235, 0.35), 0 10px 25px -10px rgba(15, 23, 42, 0.15);
          font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0F172A;
          animation: zuSlide .4s cubic-bezier(.2,.8,.3,1);
          border: 1px solid #E2E8F0;
        }
        #__zonga_update_overlay__ .zu-head {
          display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
        }
        #__zonga_update_overlay__ .zu-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #2563EB; box-shadow: 0 0 0 4px #DBEAFE;
          flex-shrink: 0;
        }
        #__zonga_update_overlay__ .zu-badge {
          font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
          text-transform: uppercase; color: #2563EB;
        }
        #__zonga_update_overlay__ h2 {
          font-size: 22px; font-weight: 700; margin: 0 0 20px;
          font-family: 'Inter', system-ui, sans-serif; letter-spacing: -0.5px;
          color: #0F172A;
        }
        #__zonga_update_overlay__ ul { list-style: none; padding: 0; margin: 0 0 24px; }
        #__zonga_update_overlay__ li {
          font-size: 14px; line-height: 1.6; color: #64748B;
          padding: 12px 0 12px 26px; border-bottom: 1px solid #F1F5F9;
          position: relative;
        }
        #__zonga_update_overlay__ li:last-child { border-bottom: none; }
        #__zonga_update_overlay__ li::before {
          content: ''; position: absolute; left: 6px; top: 19px;
          width: 6px; height: 6px; border-radius: 50%; background: #2563EB;
        }
        #__zonga_update_overlay__ button {
          width: 100%; padding: 14px; border: none; border-radius: 12px;
          background: #2563EB; color: #fff; font-size: 14px; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: background 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 100ms, box-shadow 200ms;
          box-shadow: 0 10px 25px -10px rgba(37, 99, 235, 0.5);
          letter-spacing: 0.2px;
        }
        #__zonga_update_overlay__ button:hover { background: #1E40AF; box-shadow: 0 14px 30px -10px rgba(37, 99, 235, 0.6); }
        #__zonga_update_overlay__ button:active { transform: scale(0.98); }
        @keyframes zuFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zuSlide { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      </style>
      <div class="zu-card" id="__zonga_update_card__">
        <div class="zu-head">
          <div class="zu-dot"></div>
          <div class="zu-badge">Novedad</div>
        </div>
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
