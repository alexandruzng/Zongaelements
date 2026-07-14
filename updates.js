/* Zonga Updates — popup de "Nueva actualización" para anunciar cambios.
   Cómo añadir una nueva: pon un nuevo objeto AL PRINCIPIO del array UPDATES.
   El campo `id` debe ser único (p. ej. fecha + slug). Quien aún no lo haya visto
   verá el popup en su próxima visita; quien ya lo haya cerrado no lo verá más.
*/
const UPDATES = [
  {
    id: '2026-07-13-tracker-ver-editar-dia',
    title: 'Calendario de beneficio: ver y editar un día al instante',
    items: [
      'En el Calendario de beneficio, si tienes un producto seleccionado en el desplegable, al hacer clic en un día ya registrado se abre directamente el panel con lo que rellenaste (Coste del Producto, Coste de Anuncios, Comisiones y Ganancias) para verlo y editarlo, sin pedirte antes elegir el producto. Y en la vista «Todos los productos», al pulsar un día cada producto muestra su beneficio de ese día para que veas de un vistazo lo que habías apuntado. Tus datos registrados no se han tocado.',
    ],
  },
  {
    id: '2026-07-12-analizador-metricas-ads',
    title: 'Nueva herramienta en Ads: Analizador de métricas',
    items: [
      'La sección Ads suma un analizador de métricas basado en el módulo de iniciación a Meta Ads. Metes tus datos del producto (ROAS y coste por compra de equilibrio) y, por cada anuncio, sus métricas (CTR, CPC, CPM, ROAS, Hook Rate, Hold Rate, añadidos al carrito, checkouts, compras y conversión). La herramienta analiza cada métrica y te dice si está bien o mal y por qué, aplicando los umbrales del módulo (CTR ≥2%, CPC <1, CPM <15, Hook >50%, Hold >25%, etc.) y las reglas de media buying para decidir. Puedes añadir tantos anuncios como quieras, ponerle un título a cada uno, y al final te da un veredicto claro: «Apaga «Métrica 1» porque…», «Escala…», «Mantén…». Toda la lógica sale del PDF del módulo.',
    ],
  },
  {
    id: '2026-07-12-tracker-productos',
    title: 'Calendario de beneficio: ahora por productos',
    items: [
      'El Calendario de beneficio de la sección Ads pasa a organizarse por productos. Al abrir un día, lo primero que eliges es el producto (o creas uno nuevo con su nombre y foto, que se guarda para no tener que crearlo cada día); después rellenas gastos y ganancias como hasta ahora. Arriba del calendario tienes un desplegable para filtrar por producto: eliges «Producto 1» y ves su calendario, eliges «Producto 2» y ves el suyo, o «Todos los productos» para el total. Y hay una nueva pestaña «Productos» donde ves todos los productos testeados con sus estadísticas resumidas (ingresos, gastos, beneficio y margen). Tus días anteriores se conservan dentro de un producto llamado «Producto 1».',
    ],
  },
  {
    id: '2026-07-12-tracker-comisiones-editable',
    title: 'Calendario de beneficio: comisiones editables',
    items: [
      'En el panel de cada día del Calendario de beneficio, las Comisiones ya no se calculan solas: ahora son un tercer campo de gasto que rellenas a mano, igual que el Coste del Producto y el Coste de Anuncios. Así controlas tú el importe exacto. El beneficio del día se calcula restando a tus ganancias esos tres gastos (producto + anuncios + comisiones).',
    ],
  },
  {
    id: '2026-07-12-tracker-beneficio-calendario',
    title: 'Beneficio diario, ahora en formato calendario',
    items: [
      'La herramienta de seguimiento de beneficio de la sección Ads pasa a ser un calendario mensual, mucho más limpio y pensado para rellenar día a día. Cada casilla del calendario muestra el beneficio de ese día en verde (si ganas) o rojo (si pierdes). Al hacer clic en un día se abre un panel partido en dos: a la izquierda los gastos (Coste del Producto, Coste de Anuncios y las Comisiones, que se calculan solas) y a la derecha las Ganancias. Puedes moverte entre meses con las flechas y arriba del calendario ves las estadísticas del mes (ganancias, costes, beneficio, margen y días con datos). Sigue teniendo la comisión editable (7% por defecto) y el selector de moneda (EUR). Todo se guarda en tu navegador.',
    ],
  },
  {
    id: '2026-07-12-calc-kpi-editable-moneda',
    title: 'Calculadora de KPIs: KPIs editables y selector de moneda',
    items: [
      'La Calculadora de KPIs de la sección Ads ahora deja editar a mano cada KPI: los de Breakeven y los de Objetivo (CPP, CPIC, CPATC, CPVC y ROAS) se siguen calculando solos a partir de tus datos, pero puedes escribir el valor que quieras encima si prefieres fijar tus propios objetivos. Si cambias un dato de la izquierda, se vuelven a calcular.',
      'Además hay un selector de moneda con botón (EUR, USD, GBP y RON), configurado por defecto en EUR, que cambia el símbolo en toda la herramienta.',
    ],
  },
  {
    id: '2026-07-12-calculadora-kpi-ads',
    title: 'Nueva herramienta en Ads: Calculadora de KPIs',
    items: [
      'La sección «Ads» estrena su primera herramienta: una Calculadora de KPIs que reproduce exactamente tu hoja de cálculo. Rellenas AOV, comisiones de pasarela, COGS, objetivo de beneficio y las tasas del embudo (view content, carrito, checkout, conversión) y te calcula al instante, en dos escenarios (Breakeven y Objetivo), tus costes máximos por compra (CPP), por inicio de checkout (CPIC), por añadido al carrito (CPATC) y por view content (CPVC), además del ROAS. Incluye una vista visual del embudo y el resumen de gastos del negocio. Las fórmulas son idénticas a las de tu Excel (no se ha cambiado ningún cálculo) y todo ocurre en tu navegador; tus últimos números se recuerdan para la próxima vez. Ábrela desde la pestaña «Ads».',
    ],
  },
  {
    id: '2026-07-12-ads-tema-rojo',
    title: 'Sección Ads con identidad propia (en rojo)',
    items: [
      'Al entrar en la pestaña «Ads», toda la portada cambia a una paleta roja en vez de azul, manteniendo el mismo estilo: el título «Zonga Elements» y el logo se ponen en rojo, el subrayado de la pestaña y los botones también, y la descripción de arriba pasa a hablar de tus herramientas de publicidad de pago. Al volver a «Orgánico» todo regresa al azul de siempre.',
    ],
  },
  {
    id: '2026-07-12-secciones-organico-ads',
    title: 'Nuevas secciones: Orgánico y Ads',
    items: [
      'La portada estrena cabecera: arriba del todo se ve en grande «Zonga Elements» con una breve descripción, y justo debajo tus herramientas. En el menú de arriba ahora hay dos pestañas: «Orgánico» (donde está TODO lo que ya tenías: todas las herramientas actuales, sin cambios) y «Ads», una sección nueva para tus futuras herramientas de publicidad de pago, que de momento está vacía. La opción de Backup sigue disponible, ahora en el botón azul de la esquina del menú.',
    ],
  },
  {
    id: '2026-07-12-inicio-limpio',
    title: 'Inicio más limpio: directo a las herramientas',
    items: [
      'La página de inicio ya no muestra el panel de bienvenida con el saludo, las métricas del test (revenue, pedidos, vistas, racha), el producto activo en testeo ni el próximo objetivo. Al entrar vas directamente a tus herramientas, sin ruido de por medio. No se ha borrado nada de tus herramientas: el Product Hub y el resto siguen igual, con sus datos intactos; solo se ha quitado ese panel visual de la portada.',
    ],
  },
  {
    id: '2026-07-05-guardado-movil',
    title: 'Diario, Tracker y Finanzas: se acabó que no se guardara en el móvil',
    items: [
      'Si escribías en el Diario, marcabas casillas del Tracker de hábitos o metías movimientos en el Gestor de finanzas y al refrescar no quedaba nada (sobre todo en el móvil), ya está arreglado de raíz. Todas las herramientas comparten un mismo espacio de almacenamiento del navegador y en el móvil ese espacio es más pequeño; cuando se llenaba, el guardado fallaba en silencio y perdías lo que acababas de hacer. Ahora estas tres herramientas comprimen tus datos antes de guardarlos (ocupan varias veces menos, sin que notes nada) y, además, al abrir cualquier herramienta se libera espacio comprimiendo lo que ya tenías guardado. Tus datos actuales se conservan tal cual y no tienes que hacer nada.',
      'Y si aun así el almacenamiento se llenara del todo, ahora te avisa con una banda roja arriba en vez de fingir que se guardó, para que sepas que debes liberar espacio (por ejemplo borrando fotos o entradas antiguas del Diario).',
    ],
  },
  {
    id: '2026-06-16-tracker-checklists',
    title: 'Tracker de hábitos: nueva pestaña de Checklists',
    items: [
      'El tracker ahora tiene dos pestañas arriba: «Rueda de hábitos» (la de siempre, intacta) y una nueva «Checklists». En Checklists puedes crear todos los apartados que quieras (por ejemplo «Rutina de amanecer») y, dentro de cada uno, añadir tantos checklists como necesites, sin límite. Marca cada uno al completarlo. Abajo del todo tienes un botón «Resetear checklists» que desmarca solo lo que tengas hecho y vuelve a dejarlos activos, sin borrar tus apartados ni tus listas. Tus hábitos, marcas y observaciones de la rueda no se tocan: todo lo que ya tenías sigue exactamente igual.',
    ],
  },
  {
    id: '2026-06-16-notas-libros-sin-limite',
    title: 'Notas de Libros: adiós al límite de texto',
    items: [
      'Si notabas que a partir de cierto punto el texto dejaba de guardarse (guardabas, refrescabas y faltaba un trozo), ya está resuelto de raíz. El navegador reserva un espacio compartido entre todas las herramientas de Zonga y tus notas, en texto plano, lo llenaban. Ahora tus notas se comprimen automáticamente antes de guardarse (ocupan 7-10 veces menos sin que tú notes nada), así que en el mismo espacio cabe muchísimo más: en la práctica puedes escribir todo lo que quieras. No tienes que hacer nada y tus notas actuales se conservan tal cual.',
    ],
  },
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
