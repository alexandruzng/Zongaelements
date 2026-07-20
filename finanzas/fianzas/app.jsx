// ─── Fianzas: App shell (state, header, nav, FAB, modal wiring) ─────────

const { useState: useS, useEffect: useE, useMemo: useM, useCallback: useC } = React;
const A_UI = window.FZ_UI;
const A_I = window.FZ_Icon;
const A_FD = window.FIANZAS_DATA;
const A_Modal = window.FZ_Modal;
const A_QuickAdd = window.FZ_QuickAdd;

// Snapshot inmutable de las categorías originales del seed.
// Se toma UNA vez al cargar el script para poder reconstruir la tabla de
// categorías en cada render (built-in + overrides + custom).
if (!A_FD.__BUILTIN_SEED) {
  A_FD.__BUILTIN_SEED = JSON.parse(JSON.stringify(A_FD.CATEGORIES));
}
const { Dashboard } = window.FZ_Dashboard;
const { MonthView } = window.FZ_Month;
const { GoalsView } = window.FZ_Goals;

// ── Tweaks (persisted) ──────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentStyle": "mono",
  "density": "comfortable",
  "fontHeadline": "fraunces",
  "showTips": true
} /*EDITMODE-END*/;

function useTweaks() {
  const [tweaks, setTweaks] = useS(TWEAK_DEFAULTS);
  const [visible, setVisible] = useS(false);
  useE(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setVisible(true);else
      if (d.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const update = (k, v) => {
    setTweaks((t) => {
      const next = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return next;
    });
  };
  return { tweaks, visible, update };
}

// ── App ──────────────────────────────────────────────────────────────────
function App() {
  // Theme
  const [theme, setTheme] = useS(() => localStorage.getItem('fz:theme') || 'light');
  useE(() => {document.documentElement.setAttribute('data-theme', theme);localStorage.setItem('fz:theme', theme);}, [theme]);

  // Tipo de cambio EUR→RON en vivo: descarga la tasa del día y re-renderiza
  // cuando llega (los importes en RON se recalculan solos, EUR intacto).
  const [, setRateTick] = useS(0);
  useE(() => {
    const onRate = () => setRateTick((n) => n + 1);
    window.addEventListener('fz:rate-updated', onRate);
    window.FZ_RATE?.refresh();
    return () => window.removeEventListener('fz:rate-updated', onRate);
  }, []);

  // Data state (persisted)
  // lee: ZongaLS descomprime y es compatible con datos antiguos sin comprimir.
  const readLS = (key) => (window.ZongaLS ? ZongaLS.load(key) : localStorage.getItem(key));
  // escribe: comprime y avisa si la cuota está llena en vez de perder datos en silencio.
  const writeLS = (key, val) => {
    const json = JSON.stringify(val);
    if (window.ZongaLS) { ZongaLS.save(key, json); return; }
    try { localStorage.setItem(key, json); } catch (e) {}
  };
  const [transactions, setTransactions] = useS(() => {
    try {
      const raw = readLS('fz:transactions');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return A_FD.SEED_TX;
  });

  // Cargar el histórico EUR→RON del BCE para poder MOSTRAR cada transacción a la
  // tasa de su fecha. Importante: NO reescribe las transacciones (evita un bucle
  // de recarga con sync). El histórico se guarda solo en la caché local de
  // fz-rate.js (fz:eurRonHist, excluida del sync) y el RON se deriva al render.
  useE(() => {
    if (!window.FZ_RATE || !window.FZ_RATE.backfill) return;
    const dates = transactions.map((t) => t && t.date).filter(Boolean);
    if (dates.length === 0) return;
    const minDate = dates.reduce((m, d) => (d < m ? d : m), dates[0]);
    window.FZ_RATE.backfill(minDate); // dispara 'fz:rate-updated' → re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [goals, setGoals] = useS(() => {
    try {
      const raw = readLS('fz:goals');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return A_FD.GOALS_SEED;
  });
  const [budgets, setBudgets] = useS(() => {
    try {
      const raw = readLS('fz:budgets');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return A_FD.BUDGETS_SEED;
  });

  // Categorías personalizadas (key, label, color, icon, type: 'expense'|'income', custom: true)
  const [customCats, setCustomCats] = useS(() => {
    try {
      const raw = readLS('fz:categories');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  // Overrides para categorías built-in: { food: { label, color, icon }, ... }
  const [categoryOverrides, setCategoryOverrides] = useS(() => {
    try {
      const raw = readLS('fz:categoryOverrides');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });

  // Reconstruir A_FD.CATEGORIES desde el seed inmutable cada vez que cambian
  // overrides o custom. Sincrónico para que la primera render ya lo vea.
  function rebuildCategories() {
    Object.keys(A_FD.CATEGORIES).forEach(k => delete A_FD.CATEGORIES[k]);
    Object.entries(A_FD.__BUILTIN_SEED).forEach(([k, v]) => {
      A_FD.CATEGORIES[k] = { ...v, ...(categoryOverrides[k] || {}) };
    });
    customCats.forEach(c => { A_FD.CATEGORIES[c.key] = c; });
  }
  rebuildCategories();

  useE(() => {
    rebuildCategories();
    writeLS('fz:categories', customCats);
    writeLS('fz:categoryOverrides', categoryOverrides);
  }, [customCats, categoryOverrides]);

  const addCategory = (cat) => setCustomCats(prev => [...prev, cat]);
  const deleteCategory = (key) => {
    setCustomCats(prev => prev.filter(c => c.key !== key));
  };
  const updateCustomCategory = (key, patch) => {
    setCustomCats(prev => prev.map(c => c.key === key ? { ...c, ...patch } : c));
  };
  const updateCategoryOverride = (key, patch) => {
    setCategoryOverrides(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };
  const resetCategoryOverride = (key) => {
    setCategoryOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useE(() => { writeLS('fz:transactions', transactions); }, [transactions]);
  useE(() => { writeLS('fz:goals', goals); }, [goals]);
  useE(() => { writeLS('fz:budgets', budgets); }, [budgets]);

  // UI state
  const [view, setView] = useS(localStorage.getItem('fz:view') || 'dashboard');
  useE(() => localStorage.setItem('fz:view', view), [view]);

  const [modalOpen, setModalOpen] = useS(false);
  const [modalType, setModalType] = useS('expense');
  const [editingTx, setEditingTx] = useS(null);
  const [quickOpen, setQuickOpen] = useS(false);

  // Última fecha usada al registrar/editar una tx — para que el siguiente movimiento la herede
  const [lastTxDate, setLastTxDate] = useS(() => {
    try { return localStorage.getItem('fz:lastTxDate') || null; } catch { return null; }
  });
  useE(() => {
    if (lastTxDate) try { localStorage.setItem('fz:lastTxDate', lastTxDate); } catch {}
  }, [lastTxDate]);

  // "Hoy" real del navegador — A_FD.TODAY es solo ancla del seed
  const today = useM(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }, []);

  // Current month for month-filter view (mes real actual)
  const initialMonthKey = `${today.y}-${String(today.m).padStart(2, '0')}`;
  const [currentKey, setCurrentKey] = useS(initialMonthKey);
  const [dashKey, setDashKey] = useS(initialMonthKey);

  const activeKey = view === 'month' ? currentKey : dashKey;
  const isAllTime = view === 'dashboard' && dashKey === 'all';

  // Month keys available (sorted desc)
  const monthKeys = useM(() => {
    const set = new Set(transactions.map((t) => A_UI.monthKey(t.date)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Derive data
  const derived = useM(() => {
    // full series: for each month key ascending
    const keysAsc = [...monthKeys].reverse();
    const fullSeries = keysAsc.map((k) => {
      const txs = transactions.filter((t) => A_UI.monthKey(t.date) === k);
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { key: k, label: A_UI.labelMonthShort(k), income, expense };
    });

    if (isAllTime) {
      // Aggregate across ALL months
      const series = fullSeries; // show full history
      const monthTx = [...transactions].sort((a, b) => a.date < b.date ? 1 : -1);
      const income  = monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
      const expense = monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
      const balance = income - expense;

      const monthsCount = keysAsc.length || 1;
      const avgIncome  = income  / monthsCount;
      const avgExpense = expense / monthsCount;
      const avgBalance = balance / monthsCount;

      const bd = {};
      monthTx.filter(t=>t.type==='expense').forEach(t => { bd[t.category] = (bd[t.category]||0) + t.amount; });
      const breakdown = Object.entries(bd)
        .map(([k,total]) => ({ key:k, label: (A_FD.CATEGORIES[k]?.label) || 'Otros', color: (A_FD.CATEGORIES[k]?.color) || '#78716c', total }))
        .sort((a,b) => b.total - a.total);

      // best / worst month by balance
      const withBal = fullSeries.map(s => ({...s, bal: s.income - s.expense}));
      const best  = withBal.reduce((a,b) => b.bal > a.bal ? b : a, withBal[0] || {bal:0});
      const worst = withBal.reduce((a,b) => b.bal < a.bal ? b : a, withBal[0] || {bal:0});

      const recent = monthTx.slice(0, 5);
      const tips = computeTipsAllTime({ breakdown, income, expense, balance, monthsCount, best, worst, avgIncome, avgExpense });

      return {
        fullSeries, series, monthTx, currentKey: 'all', prevKey: null,
        summary: {
          income, expense, balance,
          prevIncome: avgIncome, prevExpense: avgExpense, prevBalance: avgBalance,
          incomeDelta: null, expenseDelta: null, balanceDelta: null,
        },
        breakdown,
        breakdownFull: bd,
        recent, txCountThisMonth: monthTx.length, daysElapsed: monthsCount * 30,
        tips,
        hasMonthOverMonth: false,
        isAllTime: true,
        monthsCount, avgIncome, avgExpense, avgBalance, best, worst,
      };
    }

    // series = last 7 months up to currentKey (for sparkline/line)
    const idxActive = keysAsc.indexOf(activeKey);
    const sliceStart = Math.max(0, idxActive - 6);
    const series = fullSeries.slice(sliceStart, idxActive + 1);

    // current month
    const monthTx = transactions.filter((t) => A_UI.monthKey(t.date) === activeKey).
    sort((a, b) => a.date < b.date ? 1 : -1);
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    // previous month
    const prevKey = A_UI.prevMonthKey(activeKey);
    const prevTx = transactions.filter((t) => A_UI.monthKey(t.date) === prevKey);
    const prevIncome = prevTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevBalance = prevIncome - prevExpense;

    const incomeDelta = prevIncome ? (income - prevIncome) / prevIncome * 100 : 0;
    const expenseDelta = prevExpense ? (expense - prevExpense) / prevExpense * 100 : 0;
    const balanceDelta = prevBalance ? (balance - prevBalance) / Math.abs(prevBalance) * 100 : 0;

    // breakdown (expenses by category)
    const bd = {};
    monthTx.filter((t) => t.type === 'expense').forEach((t) => {bd[t.category] = (bd[t.category] || 0) + t.amount;});
    const breakdown = Object.entries(bd).
    map(([k, total]) => ({ key: k, label: (A_FD.CATEGORIES[k]?.label) || 'Otros', color: (A_FD.CATEGORIES[k]?.color) || '#78716c', total })).
    sort((a, b) => b.total - a.total);

    // recent = last 5 tx across all time
    const recent = [...transactions].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 5);
    const txCountThisMonth = monthTx.length;

    // days elapsed in month (for "daily avg")
    const [y, m] = activeKey.split('-').map(Number);
    const daysElapsed = y === today.y && m === today.m ? today.d : A_UI.daysInMonth(y, m);

    // Tips dynamic
    const tips = computeTips({ breakdown, income, expense, balance, goals, activeKey, budgets });

    return {
      fullSeries, series, monthTx, currentKey: activeKey, prevKey,
      summary: { income, expense, balance, prevIncome, prevExpense, prevBalance, incomeDelta, expenseDelta, balanceDelta },
      breakdown,
      breakdownFull: bd,
      recent, txCountThisMonth, daysElapsed,
      tips,
      hasMonthOverMonth: prevTx.length > 0,
      isAllTime: false,
    };
  }, [transactions, activeKey, goals, budgets, monthKeys, isAllTime, today]);

  // Actions
  const addTx = (tx) => setTransactions((prev) => [tx, ...prev]);
  const addManyTx = (arr) => {
    if (!arr || arr.length === 0) return;
    setTransactions((prev) => [...arr, ...prev]);
    // recordar la fecha de la última fila añadida
    const lastDate = arr[arr.length - 1]?.date;
    if (lastDate) setLastTxDate(lastDate);
  };
  const updateTx = (id, patch) => setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  const deleteTx = (id) => setTransactions((prev) => prev.filter((t) => t.id !== id));
  const editTx = (tx) => { setEditingTx(tx); setModalType(tx.type); setModalOpen(true); };
  const updateGoal = (id, current) => setGoals((prev) => prev.map((g) => g.id === id ? { ...g, current: Math.min(g.target, current) } : g));
  const addGoal = (goal) => setGoals((prev) => [...prev, goal]);
  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const exportCSV = () => {
    const header = 'id,fecha,tipo,categoria,concepto,importe_eur,importe_ron,tasa_eur_ron\n';
    const rows = transactions.map((t) => {
      const rate = t.rate || (window.FZ_RATE ? window.FZ_RATE.rateFor(t.date) : A_FD.EUR_TO_RON);
      return [t.id, t.date, t.type, t.category, `"${t.concept.replace(/"/g, '""')}"`, t.amount.toFixed(2), (t.amount * rate).toFixed(2), rate.toFixed(4)].join(',');
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = 'fianzas-transacciones.csv';a.click();
    URL.revokeObjectURL(url);
  };

  const actions = { addTx, updateTx, deleteTx, editTx, updateGoal, addGoal, deleteGoal, exportCSV, setView };

  const resetAll = () => {
    if (!confirm('¿Seguro que quieres borrar todos tus datos? Esta acción no se puede deshacer.')) return;
    try {
      localStorage.removeItem('fz:transactions');
      localStorage.removeItem('fz:goals');
      localStorage.removeItem('fz:budgets');
    } catch (e) {}
    setTransactions([]);
    setGoals([]);
    setBudgets({});
  };

  const openModal = (type = 'expense') => { setEditingTx(null); setModalType(type); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTx(null); };

  const handleSave = (tx) => {
    if (editingTx) updateTx(editingTx.id, tx);
    else addTx(tx);
    if (tx && tx.date) setLastTxDate(tx.date);
  };
  const handleDeleteFromModal = (id) => { deleteTx(id); closeModal(); };

  // Tweaks
  const { tweaks, visible: tweaksVisible, update: updateTweak } = useTweaks();
  useE(() => {
    // apply font tweak
    const map = { fraunces: 'Fraunces', inter: 'Inter', geist: 'JetBrains Mono' };
    document.documentElement.style.setProperty('--headline-font', map[tweaks.fontHeadline] || 'Fraunces');
    // target the .serif class
    const styleId = 'fz-tweak-style';
    let el = document.getElementById(styleId);
    if (!el) {el = document.createElement('style');el.id = styleId;document.head.appendChild(el);}
    const fontFam = tweaks.fontHeadline === 'inter' ? "'Inter', sans-serif" :
    tweaks.fontHeadline === 'geist' ? "'JetBrains Mono', monospace" :
    "'Fraunces', serif";
    el.textContent = `.serif { font-family: ${fontFam} !important; font-weight: ${tweaks.fontHeadline === 'inter' ? 600 : 500}; letter-spacing: ${tweaks.fontHeadline === 'inter' ? '-0.02em' : '-0.01em'}; }`;
  }, [tweaks.fontHeadline]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header
        view={view} onView={setView}
        theme={theme} onTheme={() => setTheme((t) => t === 'light' ? 'dark' : 'light')}
        monthKeys={monthKeys} currentKey={activeKey}
        includeAll={view === 'dashboard'}
        onMonth={view === 'month' ? setCurrentKey : setDashKey}
        onAdd={() => openModal('expense')}
        onQuickAdd={() => setQuickOpen(true)} />
      

      <main className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-32">
        {view === 'dashboard' && <Dashboard state={{ transactions, budgets }} actions={actions} derived={derived} />}
        {view === 'month' && <MonthView state={{ transactions }} actions={actions} derived={derived} />}
        {view === 'goals' && <GoalsView state={{ goals }} actions={actions} derived={derived} />}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => openModal('expense')} title="Añadir transacción" aria-label="Añadir">
        <A_I.plus size={24} strokeWidth={2.2} />
      </button>

      <A_Modal.TxModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        defaultType={modalType}
        editingTx={editingTx}
        lastDate={lastTxDate}
        onDeleteTx={handleDeleteFromModal}
        customCats={customCats}
        categoryOverrides={categoryOverrides}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onUpdateCustomCategory={updateCustomCategory}
        onUpdateCategoryOverride={updateCategoryOverride}
        onResetCategoryOverride={resetCategoryOverride} />

      <A_QuickAdd.QuickAddModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onCommit={addManyTx}
        customCats={customCats} />
      

      {tweaksVisible && <TweaksPanel tweaks={tweaks} onUpdate={updateTweak} onReset={resetAll} />}
    </div>);

}

// ── Header ───────────────────────────────────────────────────────────────
function Header({ view, onView, theme, onTheme, monthKeys, currentKey, onMonth, onAdd, onQuickAdd, includeAll }) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <header>
      {/* Top bar */}
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pt-8 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <A_I.logo size={28} />
          <div>
            <div className="brand" style={{ fontSize: 20 }}>Fianzas</div>
            <div className="text-[10px] ink-3 uppercase tracking-wider -mt-0.5">Finanzas personales</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 surface-2 p-1 rounded-xl">
          {[
          { k: 'dashboard', label: 'Dashboard' },
          { k: 'month', label: 'Por mes' },
          { k: 'goals', label: 'Metas' }].
          map((t) =>
          <button key={t.k} onClick={() => onView(t.k)}
          className="toggle-pill" data-active={view === t.k}
          style={{ padding: '8px 16px', fontSize: 13 }}>
              {t.label}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button className="btn-ghost flex items-center gap-1.5" onClick={onTheme}
          style={{ padding: '9px 11px' }} aria-label="Cambiar tema">
            {theme === 'light' ? <A_I.moon size={14} /> : <A_I.sun size={14} />}
          </button>
          <button className="btn-ghost flex items-center gap-1.5" onClick={onQuickAdd}
          style={{ padding: '10px 14px', fontSize: 13 }}
          title="Añadir varios movimientos en bloque">
            <A_I.sparkles size={14} /> Rápido
          </button>
          <button className="btn-primary flex items-center gap-1.5" onClick={onAdd}
          style={{ padding: '10px 14px', fontSize: 13 }}>
            <A_I.plus size={14} /> Nueva
          </button>
        </div>
      </div>

      {/* Greeting + month filter band */}
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pt-4 pb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[12px] ink-3 num capitalize">{dateLabel}</div>
          <h1 className="serif font-medium mt-1" style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {greeting}, <span style={{ color: 'var(--ink)', fontStyle: 'italic', fontWeight: 400 }}>Alex</span>
          </h1>
          <div className="text-[13px] ink-2 mt-2 max-w-[540px]">
            {view === 'dashboard' && 'Una mirada rápida a tus ingresos, gastos y metas de ahorro este mes.'}
            {view === 'month' && 'Explora movimientos por mes, compara con el anterior y filtra por categoría.'}
            {view === 'goals' && 'Tus objetivos de ahorro y el resumen del año mes a mes.'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RateBadge />
          <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Mes activo</div>
          <A_UI.MonthDropdown value={currentKey} options={monthKeys} onChange={onMonth} includeAll={includeAll} />
        </div>
      </div>
    </header>);

}

// ── Rate badge ──────────────────────────────────────────────────────────
// Muestra el tipo de cambio EUR→RON vigente y cuándo se actualizó.
function RateBadge() {
  const rate = A_FD.EUR_TO_RON;
  const R = window.FZ_RATE;
  const label = R ? (R.stale ? 'sin conexión' : R.dateLabel()) : null;
  return (
    <div className="chip hidden sm:flex items-center gap-1.5"
         title={R && R.source ? `Fuente: ${R.source}` : 'Tipo de cambio EUR↔RON'}
         style={{ padding: '4px 10px' }}>
      <A_I.refresh size={11} />
      <span className="num text-[11px] ink-2">1&nbsp;€ = {rate.toFixed(2)} RON</span>
      {label && <span className="text-[10px] ink-3">· {label}</span>}
    </div>);

}

// ── Tweaks panel ────────────────────────────────────────────────────────
function TweaksPanel({ tweaks, onUpdate, onReset }) {
  return (
    <div className="tweak-panel scale-in">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-medium uppercase tracking-wider">Tweaks</div>
        <div className="chip" style={{ padding: '2px 8px' }}><A_I.sliders size={10} /></div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="text-[10px] ink-3 uppercase tracking-wider mb-1.5">Tipografía titulares</div>
          <div className="toggle-track w-full" style={{ padding: 3 }}>
            {['fraunces', 'inter', 'geist'].map((v) =>
            <div key={v} className="toggle-pill flex-1 text-center"
            data-active={tweaks.fontHeadline === v}
            style={{ padding: '6px', fontSize: 11 }}
            onClick={() => onUpdate('fontHeadline', v)}>
                {v === 'fraunces' ? 'Serif' : v === 'inter' ? 'Sans' : 'Mono'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] ink-3 uppercase tracking-wider mb-1.5">Densidad</div>
          <div className="toggle-track w-full" style={{ padding: 3 }}>
            {['comfortable', 'compact'].map((v) =>
            <div key={v} className="toggle-pill flex-1 text-center"
            data-active={tweaks.density === v}
            style={{ padding: '6px', fontSize: 11 }}
            onClick={() => onUpdate('density', v)}>
                {v === 'comfortable' ? 'Cómodo' : 'Compacto'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] ink-3 uppercase tracking-wider mb-1.5">Estilo de acentos</div>
          <div className="toggle-track w-full" style={{ padding: 3 }}>
            {['mono', 'vivid'].map((v) =>
            <div key={v} className="toggle-pill flex-1 text-center"
            data-active={tweaks.accentStyle === v}
            style={{ padding: '6px', fontSize: 11 }}
            onClick={() => onUpdate('accentStyle', v)}>
                {v === 'mono' ? 'Monocromo' : 'Vivo'}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] ink-3" style={{ lineHeight: 1.5 }}>
          Edita vía la barra Tweaks. Cambios se guardan en el archivo.
        </div>

        <button
          onClick={onReset}
          className="w-full text-[11px] font-medium py-2 rounded-lg transition"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--neg-ink)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neg-soft)'; e.currentTarget.style.borderColor = 'var(--neg-ink)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          Borrar todos los datos
        </button>
      </div>
    </div>);

}

// ── Tips computation (dynamic) ──────────────────────────────────────────
function computeTips({ breakdown, income, expense, balance, goals, activeKey, budgets }) {
  const tips = [];
  // Tip 1: savings rate
  if (income > 0) {
    const rate = Math.round((income - expense) / income * 100);
    if (rate >= 20) {
      tips.push({ title: `Estás ahorrando un ${rate}% este mes`, body: 'Excelente ritmo. Considera transferir ese excedente a una cuenta de ahorro con mejor rentabilidad.' });
    } else if (rate >= 5) {
      tips.push({ title: `Ahorras un ${rate}% este mes`, body: 'Buena dirección. El objetivo saludable está entre 15% y 25%: revisa qué categoría puedes ajustar.' });
    } else if (rate >= 0) {
      tips.push({ title: `Balance muy ajustado (${rate}%)`, body: 'Tus gastos están muy cerca de tus ingresos. Identifica 1 o 2 categorías donde puedas recortar un 10%.' });
    } else {
      tips.push({ title: 'Estás gastando más de lo que ingresas', body: 'Este mes ha cerrado en negativo. Revisa las categorías con mayor volumen y plantea un límite para el próximo mes.' });
    }
  }

  // Tip 2: top category concentration
  if (breakdown.length > 0 && expense > 0) {
    const top = breakdown[0];
    const pct = Math.round(top.total / expense * 100);
    if (pct >= 35) {
      tips.push({ title: `Estás gastando un ${pct}% en ${top.label.toLowerCase()}`, body: `Es más del tercio de tu gasto total. Considera reducirlo hacia el 25-30% para ganar margen en otras categorías.` });
    } else {
      tips.push({ title: `${top.label} lidera tu gasto (${pct}%)`, body: 'Tu distribución de gasto está bastante equilibrada. Mantén este patrón y vigila picos puntuales.' });
    }
  }

  // Tip 3: budgets exceeded
  const over = Object.entries(budgets).filter(([k, lim]) => {
    const spent = breakdown.find((b) => b.key === k)?.total || 0;
    return spent >= lim;
  });
  if (over.length > 0) {
    const names = over.map(([k]) => ((A_FD.CATEGORIES[k]?.label) || 'otros').toLowerCase()).join(', ');
    tips.push({ title: `Presupuesto superado en ${over.length} categoría${over.length > 1 ? 's' : ''}`, body: `Has pasado el límite en ${names}. Ajusta los presupuestos o modera el gasto en los próximos días del mes.` });
  }

  // Tip 4: goal progress
  const goalsNear = goals.filter((g) => g.current / g.target >= 0.75 && g.current < g.target);
  if (goalsNear.length > 0) {
    const g = goalsNear[0];
    tips.push({ title: `Casi logras "${g.name}"`, body: `Llevas el ${Math.round(g.current / g.target * 100)}%. Con unos ${A_UI.fmtEUR(g.target - g.current, { decimals: 0 })} más llegas al objetivo. Un pequeño empujón extra puede cerrarla este mes.` });
  } else if (goals.length > 0) {
    tips.push({ title: 'Aporta algo pequeño a tus metas', body: 'Incluso un 2% de tus ingresos mensuales hacia ahorro acelera notablemente cualquier objetivo a 6-12 meses.' });
  }

  // Tip 5: generic always on
  tips.push({ title: 'Revisa tus suscripciones recurrentes', body: 'Las suscripciones se acumulan silenciosamente. Pon un recordatorio trimestral para auditar cuáles realmente usas.' });

  return tips;
}

function computeTipsAllTime({ breakdown, income, expense, balance, monthsCount, best, worst, avgIncome, avgExpense }) {
  const tips = [];
  const rate = income > 0 ? Math.round(((income - expense)/income)*100) : 0;
  tips.push({ title: `Tasa de ahorro histórica: ${rate}%`, body: `En ${monthsCount} meses has ingresado ${A_UI.fmtEUR(income,{decimals:0})} y gastado ${A_UI.fmtEUR(expense,{decimals:0})}. ${rate >= 20 ? 'Ritmo excelente.' : rate >= 10 ? 'Vas bien; apunta al 20%.' : 'Hay margen de mejora.'}` });
  if (best && worst && best.key && worst.key) {
    tips.push({ title: `Mejor mes: ${A_UI.labelMonth(best.key)}`, body: `Cerraste con ${A_UI.fmtEUR(best.bal,{decimals:0})} de balance. Tu peor mes fue ${A_UI.labelMonth(worst.key)} con ${A_UI.fmtEUR(worst.bal,{decimals:0})}.` });
  }
  if (breakdown.length > 0) {
    const top = breakdown[0];
    const pct = Math.round((top.total/expense)*100);
    tips.push({ title: `${top.label} es tu mayor gasto histórico`, body: `Representa el ${pct}% (${A_UI.fmtEUR(top.total,{decimals:0})}) de todo lo gastado. Una reducción del 10% aquí equivale a ${A_UI.fmtEUR(top.total*0.1,{decimals:0})} ahorrados.` });
  }
  tips.push({ title: 'Media mensual', body: `Ingresas ${A_UI.fmtEUR(avgIncome,{decimals:0})} y gastas ${A_UI.fmtEUR(avgExpense,{decimals:0})} al mes de media. Úsalo como referencia para tu presupuesto.` });
  return tips;
}

// ── Mount ────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);