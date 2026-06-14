/* Zonga Updates — popup de "Nueva actualización" para anunciar cambios.
   Cómo añadir una nueva: pon un nuevo objeto AL PRINCIPIO del array UPDATES.
   El campo `id` debe ser único (p. ej. fecha + slug). Quien aún no lo haya visto
   verá el popup en su próxima visita; quien ya lo haya cerrado no lo verá más.
*/
const UPDATES = [
  {
    id: '2026-06-14-notas-libros-guardado',
    title: 'Notas de Libros: se acabó el límite al guardar',
    items: [
      'Arreglado el problema por el que, a partir de cierto punto, tus notas dejaban de guardarse: escribías mucho, pulsabas «Guardar», parecía que se guardaba… pero al refrescar volvía a aparecer lo de antes. Pasaba porque el almacenamiento del navegador se llenaba (lo ocupaban sobre todo las portadas) y el guardado fallaba en silencio. Ahora, si el espacio se agota, la herramienta da prioridad absoluta a tus notas y libera sitio automáticamente, así que ya puedes escribir todo lo que quieras. Y si por lo que sea no pudiera guardar, te lo dice claramente con un aviso en rojo y un botón para reintentar, en vez de fingir que se guardó.',
    ],
  },
  {
    id: '2026-06-05-diario-recuperar-fotos',
    title: 'Diario: recuperación de fotos perdidas',
    items: [
      'Si tus fotos del diario desaparecieron (cuadros en blanco o entradas sin imágenes), ya vuelven. Las fotos y vídeos siempre estuvieron a salvo en la nube, pero el enlace local que apuntaba a ellas se perdía cuando el navegador limpiaba sus datos. Ahora la pestaña Multimedia lista directamente tu carpeta de la nube y muestra TODAS tus fotos, aunque su entrada hubiera perdido la referencia: las que ya no están enlazadas a un día aparecen marcadas como «recuperada». Abre el diario → Multimedia y, tras unos segundos, verás tus fotos otra vez. Solo se recuperan las que llegaron a subirse a la nube en su momento.',
      'Además, si hay fotos «recuperadas» sin día, en Multimedia tienes el botón «🛠 Asignar fotos a su día»: abre una lista con cada foto y un selector de fecha para que la coloques en su día correcto (la fecha original no se puede recuperar de la nube, solo se sabe cuándo se subió). Desde ahí también puedes mover una foto de un día a otro o quitarla de un día.',
    ],
  },
  {
    id: '2026-06-02-notas-libros-borrar',
    title: 'Notas de Libros: eliminar libros',
    items: [
      'Ya puedes borrar un libro de tu estantería. Abre el libro y pulsa el botón de la papelera (arriba a la derecha): te pedirá confirmación y, al aceptar, se elimina el libro, sus notas y su portada (también de la nube). La acción no se puede deshacer.',
    ],
  },
  {
    id: '2026-06-02-notas-libros',
    title: 'Nueva herramienta: Notas de Libros',
    items: [
      'Ya puedes llevar tu biblioteca de lectura dentro de Zonga. Pulsa "Añadir libro", pon el título, el autor, las páginas totales y una portada (sube una imagen o se genera una automática), y empieza a registrar lo que lees. Cada libro tiene su estado (📕 por leer, 📖 leyendo, ✅ leído), una barra de progreso por páginas, valoración con estrellas y un espacio amplio para tus notas y citas. La biblioteca tiene buscador y modo oscuro. Lo importante: tus libros y notas ahora se guardan en la nube y se sincronizan entre todos tus dispositivos, así que no se borran nunca. Ábrela desde el grid, en la categoría Productividad Personal.',
    ],
  },
  {
    id: '2026-06-02-banco-productos-detalle',
    title: 'Banco de productos: vista de detalle',
    items: [
      'Ahora puedes pulsar sobre cualquier tarjeta de producto para abrir su ficha completa: foto grande, estado, fuente, coste, venta, beneficio y margen en bloques, el enlace a la tienda, tus notas y la fecha en que lo añadiste. Desde esa misma ficha puedes editarlo o eliminarlo.',
    ],
  },
  {
    id: '2026-06-02-banco-productos',
    title: 'Nueva herramienta: Banco de productos',
    items: [
      'Ya puedes guardar todos tus productos en un solo sitio. Pulsa "Añadir producto", sube una foto (o pega la URL de la imagen del propio AliExpress), pon el nombre, el link de la tienda, el coste y el precio de venta — la herramienta te calcula el beneficio y el margen automáticamente. Elige el estado (🔍 por evaluar, 🧪 testeando, 🏆 ganador, 🗑️ descartado) y la fuente (➖ sin especificar, 🔥 burner, 🔬 research), añade notas y guarda. Cada producto aparece como una tarjeta visual con buscador y filtros por estado y fuente, un panel arriba con tus totales (productos, ganadores, descartados y beneficio potencial) y modo oscuro. Las fotos se guardan en la nube y los datos se sincronizan entre tus dispositivos, así que no se pierden nunca. Ábrela desde el grid, en la categoría Productividad Personal.',
    ],
  },
  {
    id: '2026-06-02-tracker-orden-anillos',
    title: 'Tracker de hábitos: orden de anillos corregido',
    items: [
      'Se ha invertido el orden de los anillos de la rueda para que coincida con la leyenda: el hábito 1 ahora ocupa el anillo exterior y el hábito 9 el interior. Antes estaba al revés y al pulsar el anillo interior aparecía el hábito 1 en vez del 9. Tus marcas y datos guardados no se ven afectados.',
    ],
  },
  {
    id: '2026-06-01-politicas-nuevo-artifact',
    title: 'Generador de políticas: nueva versión',
    items: [
      'El Generador de políticas ahora apunta a una versión actualizada de la herramienta. Ábrelo desde el grid y genera tus políticas legales (privacidad, devoluciones, envíos, términos) con el nuevo diseño.',
    ],
  },
  {
    id: '2026-05-31-click-here',
    title: 'Nueva herramienta: Generador de enlaces Click-Here',
    items: [
      'Añadida a la suite la herramienta Click-Here para crear enlaces que redirigen desde tu bio de TikTok directamente a tu tienda. Abre la herramienta desde el grid y vas directo al panel de administración para generar el enlace en segundos.',
    ],
  },
  {
    id: '2026-05-31-product-hub-conversor-usd',
    title: 'Product Hub: conversor USD → EUR al registrar día',
    items: [
      'En la card "Registrar día de hoy" del Product Hub ya puedes elegir si introduces los ingresos en € o en $ con un pequeño toggle al lado del label. Si pones la cantidad en dólares, debajo del input aparece en tiempo real el equivalente en euros usando la tasa de cambio del día (fuente: api.frankfurter.app, datos del BCE). Al guardar, el día se guarda siempre convertido a € para que el revenue total, el ticket medio, el break-even y la gráfica sigan siendo coherentes. La tasa se cachea 12 horas para no llamar a la red en cada tecla; si no hay conexión se usa la última tasa disponible o una de referencia (~0,92) como respaldo.',
    ],
  },
  {
    id: '2026-05-30-cockpit-conexiones',
    title: 'Cockpit: 4 stats y objetivo conectados a tus datos',
    items: [
      'Las 4 stats de arriba del cockpit ahora muestran los datos reales del producto activo en testeo que ves debajo (revenue del test, pedidos del test y vistas acumuladas). Al alternar productos con las flechas, las stats se recalculan en directo. La cuarta stat ahora es "Racha [nombre]" — coge tu mejor racha del Diario Electrónico (la que más días lleva) y muestra los días reales; si la has marcado hoy, la llama 🔥 pulsa, si no, queda apagada. El anillo de "Próximo objetivo" se conecta al Gestor de ingresos y gastos: muestra tu primera meta activa (ej. "Comprar nuevo móvil") con el % completado y lo que falta. Si todavía no tienes producto, racha o meta, cada card muestra un atajo para crearla.',
    ],
  },
  {
    id: '2026-05-30-cockpit-switcher',
    title: 'Cockpit: producto activo conectado a Product Hub',
    items: [
      'La card de "Producto activo en testeo" del cockpit ya lee tus productos reales de Product Hub (los que tienen estado "Testeando"). Si tienes varios en marcha aparece un switcher con flechas ‹ › para alternarlos (también funcionan las teclas izquierda/derecha) y la elección se recuerda entre visitas. El anillo de "Próximo objetivo" también se calcula con el revenue real del producto y su break-even. El link "Abrir Product Hub" te lleva directo al producto que estés viendo. Las 4 stats de arriba siguen siendo de ejemplo por ahora — se conectarán en una siguiente tanda.',
    ],
  },
  {
    id: '2026-05-30-cockpit-home',
    title: 'Nueva home: tu cockpit personal',
    items: [
      'La página de inicio se ha rediseñado como un panel de control: saludo según la hora del día con tu nombre real (el que tengas en tu perfil), fecha, stats vivas del mes (revenue, pedidos, vídeos, racha) con mini-gráficas, el producto activo en testeo con su barra de 14 días y un anillo con el próximo objetivo. Las herramientas siguen abajo, ahora con un indicador de cuándo fue la última vez que las abriste. Los datos del cockpit son de ejemplo por ahora — en próximas versiones se conectarán al Product Hub, Pedidos diarios y Finanzas.',
    ],
  },
  {
    id: '2026-05-30-product-hub-persistencia',
    title: 'Product Hub: tus datos se guardan',
    items: [
      'Product Hub ya guarda tus productos, ventas diarias, cuentas y vídeos en este dispositivo y los sincroniza con la nube como el resto de herramientas. Lo que añadas o edites deja de perderse al recargar la página.',
    ],
  },
  {
    id: '2026-05-30-product-hub',
    title: 'Nueva herramienta: Product Hub',
    items: [
      'Centro de control para dropshipping orgánico. Cada producto es un proyecto independiente con sus ventas día a día, sus cuentas de TikTok / Instagram / YouTube y un diagnóstico por fases y pilares para entender por qué un vídeo no despega.',
    ],
  },
  {
    id: '2026-05-28-tracker-habitos',
    title: 'Nueva herramienta: Tracker de hábitos',
    items: [
      'Sigue hasta 9 hábitos cada mes en una rueda visual: cada anillo es un hábito y cada cuña un día. Marca los días como cumplido o no hecho, mira tu porcentaje y tu racha en el centro, y deja notas del mes. Los hábitos son independientes por mes (un mes nuevo hereda los del anterior como punto de partida) y puedes imprimir la rueda en blanco y negro.',
    ],
  },
  {
    id: '2026-05-28-fix-sincronizacion-nube',
    title: 'Sincronización arreglada',
    items: [
      'Corregido el problema por el que los datos de los últimos días no se guardaban en el diario, pedidos diarios y finanzas. La sincronización con la nube ahora se reparte en varios bloques para no toparse con el límite de tamaño de Firestore, avisa en pantalla si algún guardado falla y nunca borra cambios locales que aún no han llegado a la nube.',
    ],
  },
  {
    id: '2026-05-26-categorias-herramientas',
    title: 'Nueva actualización',
    items: [
      'Ahora puedes filtrar las herramientas por categorías (Contenido & Redes, IA & Creación Visual, Tienda & Producto, Finanzas & Operaciones, Productividad Personal) y buscarlas por nombre desde el grid.',
    ],
  },
  {
    id: '2026-05-25-analisis-cliente',
    title: 'Nueva actualización',
    items: [
      'Nueva herramienta: Generador de análisis de cliente. Crea un perfil detallado de tu cliente ideal con demografía, motivaciones, objeciones y canales.',
    ],
  },
  {
    id: '2026-05-25-generador-copy-tienda',
    title: 'Nueva actualización',
    items: [
      'Nueva herramienta: Generador de copy para tienda. Crea reseñas, beneficios con emojis, palabras clave y textos persuasivos listos para tu ecommerce.',
    ],
  },
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
