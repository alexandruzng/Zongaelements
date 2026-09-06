/* ============================================================
   BANCO DE PRODUCTOS — Zonga Elements
   Lógica de la herramienta (vanilla JS).
   - Datos en localStorage 'bp_products_v1' → sync.js los sube a la nube.
   - Fotos en Firebase Storage vía window.__zongaStorage (devuelve URL).
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Constantes ---------- */
  const STORE_KEY = 'bp_products_v1';
  const THEME_KEY = '__zonga_bp_theme';   // device-local (no sincroniza)
  const FX_KEY    = '__zonga_bp_fx';       // caché tasa USD→EUR (no sincroniza)
  const FX_TTL    = 12 * 60 * 60 * 1000;   // 12h
  const FX_FALLBACK = 0.92;                // respaldo si no hay red

  const STATUSES = [
    { val: 'evaluar',    emoji: '🔍', label: 'Por evaluar' },
    { val: 'testeando',  emoji: '🧪', label: 'Testeando' },
    { val: 'ganador',    emoji: '🏆', label: 'Ganador' },
    { val: 'descartado', emoji: '🗑️', label: 'Descartado' },
  ];
  const SOURCES = [
    { val: 'sin-especificar', emoji: '➖', label: 'Sin especificar' },
    { val: 'burner',          emoji: '🔥', label: 'Burner' },
    { val: 'research',        emoji: '🔬', label: 'Research' },
  ];
  const stById = (v) => STATUSES.find(s => s.val === v) || STATUSES[0];
  const srcById = (v) => SOURCES.find(s => s.val === v) || SOURCES[0];

  /* ---------- Estado ---------- */
  let products = [];
  let filterStatus = 'all';
  let filterSource = 'all';
  let query = '';
  let editingId = null;
  let pendingPhoto = null; // { kind:'file'|'url'|'existing', blob?, dataURL?, url?, path? }
  let formCurrency = 'EUR';
  let confirmCb = null;

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const nf = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function fmtMoney(n, cur) {
    const num = nf.format(Math.abs(Number(n) || 0));
    const sign = (Number(n) || 0) < 0 ? '-' : '';
    return cur === 'USD' ? `${sign}$${num}` : `${sign}${num} €`;
  }

  // Guardado a traves de ZongaLS: comprime (~7-10x) y AVISA si no cabe, en vez
  // de fallar en silencio. Antes un setItem crudo podia reventar por cuota y el
  // producto no llegaba a guardarse sin que se notara.
  const loadProducts = () => {
    try {
      const raw = window.ZongaLS ? ZongaLS.load(STORE_KEY) : localStorage.getItem(STORE_KEY);
      products = JSON.parse(raw) || [];
    } catch { products = []; }
  };
  const saveProducts = () => {
    const json = JSON.stringify(products);
    const ok = window.ZongaLS
      ? ZongaLS.save(STORE_KEY, json)
      : (() => { try { localStorage.setItem(STORE_KEY, json); return true; } catch { return false; } })();
    if (!ok) alert('No se ha podido guardar: el almacenamiento de este dispositivo esta lleno. Libera espacio (fotos del diario, entradas antiguas) e intentalo otra vez.');
    return ok;
  };

  /* ---------- Tasa de cambio USD→EUR (para el total en €) ---------- */
  let usdToEur = FX_FALLBACK;
  async function loadFx() {
    try {
      const cached = JSON.parse(localStorage.getItem(FX_KEY) || 'null');
      if (cached && Date.now() - cached.ts < FX_TTL) { usdToEur = cached.rate; renderStats(); return; }
    } catch {}
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
      const data = await res.json();
      if (data?.rates?.EUR) {
        usdToEur = data.rates.EUR;
        localStorage.setItem(FX_KEY, JSON.stringify({ rate: usdToEur, ts: Date.now() }));
      }
    } catch {
      try { const c = JSON.parse(localStorage.getItem(FX_KEY) || 'null'); if (c) usdToEur = c.rate; } catch {}
    }
    renderStats();
  }
  const toEur = (n, cur) => cur === 'USD' ? n * usdToEur : n;

  /* ---------- Cálculos ---------- */
  function profitOf(p) {
    const cost = Number(p.cost) || 0, price = Number(p.price) || 0;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { cost, price, profit, margin };
  }

  /* ---------- Firebase Storage ---------- */
  function waitStorage() {
    return new Promise((resolve) => {
      if (window.__zongaStorage) return resolve(window.__zongaStorage);
      const done = () => resolve(window.__zongaStorage || null);
      window.addEventListener('zonga:storageReady', done, { once: true });
      setTimeout(done, 6000);
    });
  }
  const withTimeout = (promise, ms) => Promise.race([
    promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);

  /* ---------- Imagenes: comprimir antes de subir ----------
     Una portada no necesita los 8 MB que suelta un movil. Se reescala a 1400 px
     de lado mayor y se pasa a JPEG: una foto normal queda en 150-300 KB. Sube
     mas rapido, ocupa menos en la nube y, sobre todo, hace que el respaldo de
     emergencia (base64 en el navegador) quepa sin reventar el almacen de 5 MB
     que comparten todas las herramientas. */
  const MAX_LADO = 1400;
  const CALIDAD_JPEG = 0.82;
  const MAX_RESPALDO_BYTES = 500 * 1024;

  function leerComoDataURL(blob) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => res('');
      r.readAsDataURL(blob);
    });
  }

  async function comprimirImagen(file) {
    const original = { blob: file, dataURL: await leerComoDataURL(file) };
    try {
      const bitmapUrl = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('no dibujable'));
        i.src = bitmapUrl;
      });
      URL.revokeObjectURL(bitmapUrl);

      const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * escala));
      const h = Math.max(1, Math.round(img.height * escala));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);

      const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', CALIDAD_JPEG));
      // Si no mejora (ya era pequena, o es un PNG con transparencia que engorda),
      // nos quedamos con el archivo tal cual.
      if (!blob || blob.size >= file.size) return original;
      return { blob, dataURL: await leerComoDataURL(blob) };
    } catch {
      return original;  // formatos que el navegador no sabe dibujar (HEIC, etc.)
    }
  }

  async function resolvePhoto(id) {
    // Devuelve { url, path } según pendingPhoto. Sube a Storage si es archivo.
    if (!pendingPhoto) return { url: '', path: '' };
    if (pendingPhoto.kind === 'existing') return { url: pendingPhoto.url, path: pendingPhoto.path || '' };
    if (pendingPhoto.kind === 'url') return { url: pendingPhoto.url, path: '' };
    if (pendingPhoto.kind === 'file') {
      const blob = pendingPhoto.blob;
      const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
      try {
        const stor = await waitStorage();
        if (stor) {
          const userId = await withTimeout(stor.uid(), 5000);
          const path = `users/${userId}/banco-productos/${id}.${ext}`;
          const url = await stor.upload(path, blob);
          return { url, path };
        }
      } catch (e) {
        console.warn('[banco] subida a Storage falló, uso imagen local', e?.message || e);
      }
      // Respaldo cuando la subida falla. Guardar la imagen en base64 dentro del
      // navegador solo si es pequena: una foto grande aqui llena el almacen
      // compartido de 5 MB y rompe el guardado de TODAS las herramientas, que
      // es exactamente lo que pasaba con las fotos del Diario.
      const d = pendingPhoto.dataURL || '';
      if (d && d.length <= MAX_RESPALDO_BYTES) return { url: d, path: '', pendiente: true };
      toast('No se ha podido subir la foto y pesa demasiado para dejarla en este dispositivo. El producto se guarda sin foto: vuelve a editarlo con mejor conexion.');
      return { url: '', path: '' };
    }
    return { url: '', path: '' };
  }

  async function deleteCloudPhoto(path) {
    if (!path) return;
    try { const stor = await waitStorage(); if (stor) await stor.del(path); } catch {}
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function renderStats() {
    const total = products.length;
    const ganadores = products.filter(p => p.status === 'ganador').length;
    const descartados = products.filter(p => p.status === 'descartado').length;
    const potencial = products
      .filter(p => p.status !== 'descartado')
      .reduce((s, p) => s + Math.max(0, toEur(profitOf(p).profit, p.currency)), 0);

    $('#stats').innerHTML = `
      <article class="stat stat--total">
        <div class="stat__top"><span class="stat__label">Productos</span><span class="stat__ico">📦</span></div>
        <div class="stat__value">${total}</div>
        <div class="stat__sub">en tu banco</div>
      </article>
      <article class="stat stat--ganador">
        <div class="stat__top"><span class="stat__label">Ganadores</span><span class="stat__ico">🏆</span></div>
        <div class="stat__value">${ganadores}</div>
        <div class="stat__sub">${total ? Math.round(ganadores / total * 100) : 0}% del total</div>
      </article>
      <article class="stat stat--descartado">
        <div class="stat__top"><span class="stat__label">Descartados</span><span class="stat__ico">🗑️</span></div>
        <div class="stat__value">${descartados}</div>
        <div class="stat__sub">${total ? Math.round(descartados / total * 100) : 0}% del total</div>
      </article>
      <article class="stat stat--profit">
        <div class="stat__top"><span class="stat__label">Beneficio potencial</span><span class="stat__ico">💰</span></div>
        <div class="stat__value">${fmtMoney(potencial, 'EUR')}</div>
        <div class="stat__sub">venta − coste · sin descartados</div>
      </article>`;
  }

  function renderFilters() {
    const counts = { all: products.length };
    STATUSES.forEach(s => counts[s.val] = products.filter(p => p.status === s.val).length);
    const chip = (val, emoji, label) => `
      <button class="filter-chip ${filterStatus === val ? 'is-active' : ''}" data-filter="${val}" role="tab" aria-selected="${filterStatus === val}">
        ${emoji ? `<span>${emoji}</span>` : ''}<span>${label}</span>
        <span class="count">${counts[val] || 0}</span>
      </button>`;
    $('#statusFilters').innerHTML =
      chip('all', '', 'Todos') +
      STATUSES.map(s => chip(s.val, s.emoji, s.label)).join('');
  }

  function cardHTML(p) {
    const { cost, price, profit, margin } = profitOf(p);
    const st = stById(p.status), sc = srcById(p.source);
    const hasPrices = (cost || price);
    const profitCls = profit >= 0 ? 'profit-pos' : 'profit-neg';
    const marginCls = profit >= 0 ? 'margin-pos' : 'margin-neg';
    return `
    <article class="card" data-id="${p.id}">
      <div class="card__media">
        ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">` : ''}
        <span class="card__status st-${p.status}">${st.emoji} ${st.label}</span>
        <div class="card__actions">
          <button class="card__act" data-edit="${p.id}" aria-label="Editar" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="card__act is-danger" data-del="${p.id}" aria-label="Eliminar" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
      <div class="card__body">
        <h3 class="card__name">${esc(p.name)}</h3>

        ${hasPrices ? `
        <div class="card__prices">
          <div class="price-tag"><span>Coste</span><b>${fmtMoney(cost, p.currency)}</b></div>
          <span class="price-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          <div class="price-tag"><span>Venta</span><b>${fmtMoney(price, p.currency)}</b></div>
        </div>
        <div class="card__profit">
          <span class="lbl">Beneficio</span>
          <span class="val ${profitCls}">${fmtMoney(profit, p.currency)}</span>
          <span class="margin ${marginCls}">${Math.round(margin)}%</span>
        </div>` : ''}

        ${p.notes ? `<p class="card__notes">${esc(p.notes)}</p>` : ''}

        <div class="card__foot">
          <span class="tag-source">${sc.emoji} ${sc.label}</span>
          ${p.link ? `<a class="card__link" href="${esc(p.link)}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            Abrir</a>` : ''}
        </div>
      </div>
    </article>`;
  }

  function renderGrid() {
    renderStats();
    renderFilters();
    let list = products.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus);
    if (filterSource !== 'all') list = list.filter(p => p.source === filterSource);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q));
    }

    const grid = $('#grid'), empty = $('#empty');
    if (!products.length) {
      grid.innerHTML = ''; grid.hidden = true; empty.hidden = false;
      $('#emptyTitle').textContent = 'Aún no hay productos';
      $('#emptyText').textContent = 'Añade tu primer producto para empezar a construir tu banco.';
    } else if (!list.length) {
      grid.innerHTML = ''; grid.hidden = true; empty.hidden = false;
      $('#emptyTitle').textContent = 'Sin resultados';
      $('#emptyText').textContent = 'Ningún producto coincide con el filtro o la búsqueda.';
    } else {
      empty.hidden = true; grid.hidden = false;
      grid.innerHTML = list.map(cardHTML).join('');
    }
  }

  /* ============================================================
     DETALLE
     ============================================================ */
  const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  function openDetail(p) {
    const { cost, price, profit, margin } = profitOf(p);
    const st = stById(p.status), sc = srcById(p.source);
    const hasPrices = (cost || price);
    const profitCls = profit >= 0 ? 'detail__stat--profit' : 'detail__stat--loss';

    $('#detailBody').innerHTML = `
      <div class="detail__hero">
        ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}">` : ''}
        <div class="detail__badges">
          <span class="detail__badge st-${p.status}">${st.emoji} ${st.label}</span>
          <span class="detail__badge detail__badge--src">${sc.emoji} ${sc.label}</span>
        </div>
      </div>
      <div class="detail__content">
        <h3 class="detail__name" id="detailName">${esc(p.name)}</h3>

        ${hasPrices ? `
        <div class="detail__stats">
          <div class="detail__stat"><span>Coste</span><b>${fmtMoney(cost, p.currency)}</b></div>
          <div class="detail__stat"><span>Venta</span><b>${fmtMoney(price, p.currency)}</b></div>
          <div class="detail__stat ${profitCls}"><span>Beneficio</span><b>${fmtMoney(profit, p.currency)}</b></div>
          <div class="detail__stat ${profitCls}"><span>Margen</span><b>${Math.round(margin)}%</b></div>
        </div>` : ''}

        ${p.link ? `
        <div class="detail__section">
          <h4>Tienda</h4>
          <a class="detail__linkbtn" href="${esc(p.link)}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            ${esc(p.link)}
          </a>
        </div>` : ''}

        ${p.notes ? `
        <div class="detail__section">
          <h4>Notas</h4>
          <p class="detail__notes">${esc(p.notes)}</p>
        </div>` : ''}

        <div class="detail__meta">
          <span>Añadido el ${fmtDate(p.createdAt)}</span>
          ${p.updatedAt && p.updatedAt !== p.createdAt ? `<span>· Editado el ${fmtDate(p.updatedAt)}</span>` : ''}
        </div>

        <div class="detail__actions">
          <button type="button" class="btn btn--ghost" data-detail-edit="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Editar
          </button>
          <button type="button" class="btn btn--danger" data-detail-del="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Eliminar
          </button>
        </div>
      </div>`;

    $('#detail').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    $('#detail').hidden = true;
    if ($('#modal').hidden) document.body.style.overflow = '';
  }

  /* ============================================================
     MODAL / FORM
     ============================================================ */
  function buildPickers() {
    $('#statusPicker').innerHTML = STATUSES.map(s =>
      `<button type="button" class="chip" data-val="${s.val}" role="radio" aria-checked="false"><span class="emo">${s.emoji}</span>${s.label}</button>`).join('');
    $('#sourcePicker').innerHTML = SOURCES.map(s =>
      `<button type="button" class="chip" data-src="${s.val}" role="radio" aria-checked="false"><span class="emo">${s.emoji}</span>${s.label}</button>`).join('');
  }

  function setPicker(container, value, attr) {
    $$(`[${attr}]`, container).forEach(b => {
      const on = b.getAttribute(attr) === value;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on);
    });
  }

  function setCurrency(cur) {
    formCurrency = cur;
    $$('#currencyToggle button').forEach(b => b.classList.toggle('is-active', b.dataset.cur === cur));
    $$('.price-input .cur-sym').forEach(el => el.textContent = cur === 'USD' ? '$' : '€');
    updateProfitPreview();
  }

  function updateProfitPreview() {
    const cost = parseFloat($('#cost').value) || 0;
    const price = parseFloat($('#price').value) || 0;
    const box = $('#profitPreview');
    if (!cost && !price) { box.hidden = true; return; }
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    box.hidden = false;
    box.innerHTML = `
      <span>Beneficio: <span class="${profit >= 0 ? 'profit-pos' : 'profit-neg'}">${fmtMoney(profit, formCurrency)}</span></span>
      <span class="pp-margin ${profit >= 0 ? 'margin-pos' : 'margin-neg'}">Margen ${Math.round(margin)}%</span>`;
  }

  function setPhotoPreview(src) {
    const img = $('#photoPreview'), ph = $('#dropPlaceholder'), clr = $('#photoClear');
    if (src) { img.src = src; img.hidden = false; ph.hidden = true; clr.hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; ph.hidden = false; clr.hidden = true; }
  }

  function clearPhoto() {
    pendingPhoto = null;
    $('#photoFile').value = '';
    $('#photoUrl').value = '';
    setPhotoPreview('');
  }

  function openModal(product) {
    editingId = product ? product.id : null;
    $('#modalTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';
    $('#saveBtn').querySelector('span').textContent = product ? 'Guardar cambios' : 'Guardar producto';

    // reset
    $('#form').reset();
    pendingPhoto = null;
    setPhotoPreview('');
    $('#profitPreview').hidden = true;
    $$('.input.invalid').forEach(i => i.classList.remove('invalid'));
    $$('.field__error').forEach(e => e.hidden = true);

    if (product) {
      $('#name').value = product.name || '';
      $('#link').value = product.link || '';
      $('#cost').value = product.cost ?? '';
      $('#price').value = product.price ?? '';
      $('#notes').value = product.notes || '';
      setCurrency(product.currency || 'EUR');
      setPicker($('#statusPicker'), product.status, 'data-val');
      setPicker($('#sourcePicker'), product.source, 'data-src');
      if (product.photo) { pendingPhoto = { kind: 'existing', url: product.photo, path: product.photoPath }; setPhotoPreview(product.photo); }
    } else {
      setCurrency('EUR');
      setPicker($('#statusPicker'), 'evaluar', 'data-val');
      setPicker($('#sourcePicker'), 'sin-especificar', 'data-src');
    }
    updateProfitPreview();

    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#name').focus(), 50);
  }

  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    editingId = null; pendingPhoto = null;
  }

  async function submitForm(e) {
    e.preventDefault();
    let ok = true;

    const name = $('#name').value.trim();
    if (!name) { $('#nameError').hidden = false; $('#name').classList.add('invalid'); ok = false; }
    else { $('#nameError').hidden = true; $('#name').classList.remove('invalid'); }

    // foto: archivo, url o existente
    const urlVal = $('#photoUrl').value.trim();
    if (!pendingPhoto && urlVal) pendingPhoto = { kind: 'url', url: urlVal };
    if (!pendingPhoto) { $('#photoError').hidden = false; $('#dropzone').classList.add('is-drag'); ok = false; }
    else { $('#photoError').hidden = true; $('#dropzone').classList.remove('is-drag'); }

    if (!ok) return;

    const status = $('#statusPicker .is-active')?.dataset.val || 'evaluar';
    const source = $('#sourcePicker .is-active')?.dataset.src || 'sin-especificar';

    const btn = $('#saveBtn');
    btn.disabled = true; btn.querySelector('span').textContent = 'Guardando…';

    const id = editingId || uid();
    const prev = editingId ? products.find(p => p.id === editingId) : null;

    // si en edición cambió la foto y la antigua estaba en Storage, bórrala
    let photo = '', photoPath = '', fotoPendiente = false;
    try {
      const r = await resolvePhoto(id);
      photo = r.url; photoPath = r.path; fotoPendiente = !!r.pendiente;
    } catch { photo = prev?.photo || ''; photoPath = prev?.photoPath || ''; }

    if (prev && prev.photoPath && prev.photoPath !== photoPath) deleteCloudPhoto(prev.photoPath);

    const record = {
      id,
      name,
      link: $('#link').value.trim(),
      cost: $('#cost').value === '' ? null : parseFloat($('#cost').value),
      price: $('#price').value === '' ? null : parseFloat($('#price').value),
      currency: formCurrency,
      status, source,
      notes: $('#notes').value.trim(),
      photo, photoPath, fotoPendiente,
      createdAt: prev?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (prev) products = products.map(p => p.id === id ? record : p);
    else products.unshift(record);
    saveProducts();
    renderGrid();

    btn.disabled = false;
    closeModal();
    toast(prev ? 'Producto actualizado' : 'Producto guardado');
  }

  /* ---------- Confirm + Toast ---------- */
  function askDelete(id) {
    const p = products.find(x => x.id === id); if (!p) return;
    askConfirm('¿Eliminar producto?', `“${p.name}” se eliminará para siempre.`, () => {
      if (p.photoPath) deleteCloudPhoto(p.photoPath);
      products = products.filter(x => x.id !== p.id);
      saveProducts(); renderGrid(); closeConfirm(); toast('Producto eliminado');
    });
  }

  function askConfirm(title, text, cb) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    confirmCb = cb;
    $('#confirm').hidden = false;
  }
  function closeConfirm() { $('#confirm').hidden = true; confirmCb = null; }

  let toastT;
  function toast(msg) {
    const el = $('#toast');
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>${esc(msg)}`;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.hidden = true, 220); }, 2400);
  }

  /* ---------- Tema ---------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  /* ============================================================
     EVENTOS
     ============================================================ */
  function bind() {
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#addBtn').addEventListener('click', () => openModal(null));
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-add]')) openModal(null);
    });

    // toolbar
    $('#search').addEventListener('input', (e) => { query = e.target.value.trim(); renderGrid(); });
    $('#sourceFilter').addEventListener('change', (e) => { filterSource = e.target.value; renderGrid(); });
    $('#statusFilters').addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      filterStatus = b.dataset.filter; renderGrid();
    });

    // grid (delegación)
    $('#grid').addEventListener('click', (e) => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) { const p = products.find(x => x.id === edit.dataset.edit); if (p) openModal(p); return; }
      if (del) { askDelete(del.dataset.del); return; }
      // clic en el enlace "Abrir": dejar el comportamiento por defecto
      if (e.target.closest('.card__link')) return;
      const card = e.target.closest('.card');
      if (card) { const p = products.find(x => x.id === card.dataset.id); if (p) openDetail(p); }
    });

    // detalle
    $('#detail').addEventListener('click', (e) => {
      if (e.target.closest('[data-detail-close]')) { closeDetail(); return; }
      const edit = e.target.closest('[data-detail-edit]');
      const del = e.target.closest('[data-detail-del]');
      if (edit) { const p = products.find(x => x.id === edit.dataset.detailEdit); closeDetail(); if (p) openModal(p); return; }
      if (del) { closeDetail(); askDelete(del.dataset.detailDel); }
    });

    // modal close
    $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    $('#confirm').addEventListener('click', (e) => { if (e.target.closest('[data-confirm-close]')) closeConfirm(); });
    $('#confirmOk').addEventListener('click', () => confirmCb && confirmCb());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('#confirm').hidden) closeConfirm();
        else if (!$('#modal').hidden) closeModal();
        else if (!$('#detail').hidden) closeDetail();
      }
    });

    // form
    $('#form').addEventListener('submit', submitForm);
    $('#cost').addEventListener('input', updateProfitPreview);
    $('#price').addEventListener('input', updateProfitPreview);
    $('#currencyToggle').addEventListener('click', (e) => { const b = e.target.closest('[data-cur]'); if (b) setCurrency(b.dataset.cur); });
    $('#statusPicker').addEventListener('click', (e) => { const b = e.target.closest('[data-val]'); if (b) setPicker($('#statusPicker'), b.dataset.val, 'data-val'); });
    $('#sourcePicker').addEventListener('click', (e) => { const b = e.target.closest('[data-src]'); if (b) setPicker($('#sourcePicker'), b.dataset.src, 'data-src'); });

    // foto: dropzone
    const dz = $('#dropzone'), fileInput = $('#photoFile');
    dz.addEventListener('click', (e) => { if (!e.target.closest('#photoClear')) fileInput.click(); });
    dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    $('#photoClear').addEventListener('click', (e) => { e.stopPropagation(); clearPhoto(); });
    fileInput.addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) handleFile(f); });
    ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-drag'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); if (ev !== 'drop') dz.classList.remove('is-drag'); }));
    dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) handleFile(f); });

    // foto: url
    $('#photoUrl').addEventListener('input', (e) => {
      const v = e.target.value.trim();
      if (v) { pendingPhoto = { kind: 'url', url: v }; setPhotoPreview(v); $('#photoError').hidden = true; }
      else if (pendingPhoto?.kind === 'url') { clearPhoto(); }
    });
  }

  async function handleFile(file) {
    if (file.size > 8 * 1024 * 1024) { toast('La imagen supera 8 MB'); return; }
    const { blob, dataURL } = await comprimirImagen(file);
    pendingPhoto = { kind: 'file', blob, dataURL };
    setPhotoPreview(dataURL);
    $('#photoUrl').value = '';
    $('#photoError').hidden = true; $('#dropzone').classList.remove('is-drag');
  }

  /* ---------- Rescate de fotos que se quedaron en el navegador ----------
     Si en su dia la subida a Storage fallo, la foto quedo como base64 dentro
     del producto, ocupando sitio en el almacen compartido. En cada carga se
     intenta subirla y dejar solo el enlace. Tambien repara los productos
     antiguos guardados antes de que existiera este limite. */
  async function rescatarFotosLocales() {
    const pendientes = products.filter(p => typeof p.photo === 'string' && p.photo.startsWith('data:'));
    if (!pendientes.length) return;

    const stor = await waitStorage().catch(() => null);
    if (!stor) return;
    let userId;
    try { userId = await withTimeout(stor.uid(), 8000); } catch { return; }

    let subidas = 0;
    for (const p of pendientes) {
      try {
        const blob = await (await fetch(p.photo)).blob();
        const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
        const path = `users/${userId}/banco-productos/${p.id}.${ext}`;
        const url = await stor.upload(path, blob);
        p.photo = url; p.photoPath = path; p.fotoPendiente = false;
        subidas++;
      } catch { /* sin conexion o sin permisos: se reintenta en la proxima carga */ }
    }
    if (subidas) {
      saveProducts();
      renderGrid();
      console.info('[banco] ' + subidas + ' foto(s) movidas del navegador a la nube');
    }
  }

  /* ---------- Re-render cuando sync.js trae datos de la nube ---------- */
  window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { loadProducts(); renderGrid(); } });

  /* ---------- Init ---------- */
  function init() {
    initTheme();
    loadProducts();
    buildPickers();
    bind();
    renderGrid();
    loadFx();
    // tras unos segundos, sync.js puede haber traído datos: refresca
    setTimeout(() => { loadProducts(); renderGrid(); rescatarFotosLocales(); }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
