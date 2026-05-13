// ─── Fianzas: modal "Añadir transacción" ────────────────────────────────

const { useState: useStateM, useEffect: useEffectM, useMemo: useMemoM } = React;
const Ic = window.FZ_Icon;
const { FIANZAS_DATA: FD_M } = window;
const { EUR_TO_RON: E2R_M, CATEGORIES: CATS_M } = FD_M;
const { MONTH_NAMES: MN_M, DAY_NAMES: DN_M, daysInMonth: dim_M, parseISO: pISO_M, fmtEUR: fEUR_M, fmtRON: fRON_M } = window.FZ_UI;

// ── Calendar picker ─────────────────────────────────────────────────────
function Calendar({ value, onChange }) {
  const { y, m } = pISO_M(value);
  const [view, setView] = useStateM({ y, m });
  const days = dim_M(view.y, view.m);
  // first weekday (Mon=0)
  const first = new Date(view.y, view.m-1, 1).getDay(); // Sun=0
  const offset = (first + 6) % 7; // Monday first
  const prevDays = dim_M(view.y, view.m - 1 <= 0 ? 12 : view.m-1);

  const today = new Date();
  const todayY = today.getFullYear(), todayM = today.getMonth()+1, todayD = today.getDate();

  const selected = pISO_M(value);

  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push({ d: prevDays - offset + 1 + i, muted: true });
  }
  for (let d = 1; d <= days; d++) cells.push({ d, muted: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - offset - days + 1, muted: true });

  const nav = (dir) => {
    let nm = view.m + dir, ny = view.y;
    if (nm > 12) { nm = 1; ny++; } else if (nm < 1) { nm = 12; ny--; }
    setView({ y: ny, m: nm });
  };

  const pick = (d, muted) => {
    if (muted) return;
    const dd = String(d).padStart(2,'0');
    const mm = String(view.m).padStart(2,'0');
    onChange(`${view.y}-${mm}-${dd}`);
  };

  return (
    <div className="surface-2" style={{borderRadius: 14, padding: 12}}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" className="p-1.5 rounded-md hover:bg-[var(--bg)] transition" onClick={()=>nav(-1)}>
          <Ic.chevLeft size={14}/>
        </button>
        <div className="text-[13px] font-medium">{MN_M[view.m-1]} {view.y}</div>
        <button type="button" className="p-1.5 rounded-md hover:bg-[var(--bg)] transition" onClick={()=>nav(1)}>
          <Ic.chevRight size={14}/>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DN_M.map((d,i)=>(
          <div key={i} className="text-center text-[10px] ink-3 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const isSel = !c.muted && selected.y===view.y && selected.m===view.m && selected.d===c.d;
          const isToday = !c.muted && todayY===view.y && todayM===view.m && todayD===c.d;
          return (
            <div key={i} className="cal-day num"
                 data-muted={c.muted}
                 data-selected={isSel}
                 data-today={isToday && !isSel}
                 onClick={()=>pick(c.d, c.muted)}>
              {c.d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Paleta y selección de iconos para categorías custom ────────────────
const CAT_PALETTE = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1',
  '#3b82f6', '#14b8a6', '#10b981', '#22c55e', '#eab308',
  '#f59e0b', '#78716c'
];
const CAT_ICONS = [
  'tag', 'utensils', 'car', 'home', 'heart', 'bag', 'repeat', 'briefcase',
  'laptop', 'gift', 'sparkles', 'target', 'piggy', 'wallet', 'lightbulb',
  'bell', 'more'
];

// Built-in keys por tipo (los originales)
const BUILTIN_EXPENSE = ['food','transport','home','leisure','shopping','subs','health','other'];
const BUILTIN_INCOME  = ['salary','freelance','gift','other'];

function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
    .slice(0, 32) || 'cat';
}

// ── TxModal ─────────────────────────────────────────────────────────────
function TxModal({ open, onClose, onSave, defaultType='expense', customCats=[], onAddCategory, onDeleteCategory }) {
  const [type, setType]           = useStateM(defaultType);
  const [date, setDate]           = useStateM(() => {
    const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  });
  const [concept, setConcept]     = useStateM('');
  const [amountStr, setAmountStr] = useStateM('');
  const [currency, setCurrency]   = useStateM('EUR');
  const [category, setCategory]   = useStateM(defaultType==='expense' ? 'food' : 'salary');
  const [showCal, setShowCal]     = useStateM(false);
  const [saving, setSaving]       = useStateM(false);

  // Estado del formulario "Nueva categoría"
  const [showNewCat, setShowNewCat]   = useStateM(false);
  const [newCatLabel, setNewCatLabel] = useStateM('');
  const [newCatColor, setNewCatColor] = useStateM(CAT_PALETTE[0]);
  const [newCatIcon, setNewCatIcon]   = useStateM(CAT_ICONS[0]);
  const [newCatError, setNewCatError] = useStateM('');

  useEffectM(() => {
    if (!open) return;
    setType(defaultType);
    setConcept(''); setAmountStr(''); setCurrency('EUR'); setSaving(false); setShowCal(false);
    setCategory(defaultType==='expense' ? 'food' : 'salary');
    setShowNewCat(false); setNewCatLabel(''); setNewCatColor(CAT_PALETTE[0]); setNewCatIcon(CAT_ICONS[0]); setNewCatError('');
    const t = new Date(); setDate(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, defaultType]);

  if (!open) return null;

  const isIncome = type === 'income';
  const builtIn = isIncome ? BUILTIN_INCOME : BUILTIN_EXPENSE;
  const userCats = (customCats || []).filter(c => c.type === type).map(c => c.key);
  const availableCats = [...builtIn, ...userCats];

  const createCategory = () => {
    setNewCatError('');
    const label = newCatLabel.trim();
    if (label.length < 2) { setNewCatError('Mínimo 2 caracteres'); return; }
    if (label.length > 24) { setNewCatError('Máximo 24 caracteres'); return; }

    // Generar key única
    let baseKey = slugify(label);
    let key = baseKey;
    let i = 2;
    const existing = new Set(Object.keys(CATS_M));
    while (existing.has(key)) { key = `${baseKey}-${i++}`; }

    const cat = { key, label, color: newCatColor, icon: newCatIcon, type, custom: true };
    onAddCategory?.(cat);
    // Registrar inmediatamente en el map global para que los pills la vean en este render
    CATS_M[key] = cat;
    setCategory(key);
    setShowNewCat(false);
    setNewCatLabel(''); setNewCatColor(CAT_PALETTE[0]); setNewCatIcon(CAT_ICONS[0]);
  };

  const removeCustom = (k) => {
    if (!confirm('¿Eliminar esta categoría? Las transacciones existentes no se borrarán.')) return;
    onDeleteCategory?.(k);
    if (category === k) setCategory(isIncome ? 'salary' : 'food');
  };

  // Validation
  const amountNum = parseFloat(String(amountStr).replace(',','.'));
  const amountValid = !isNaN(amountNum) && amountNum > 0;
  const conceptValid = concept.trim().length >= 2;
  const canSave = amountValid && conceptValid;

  // Currency conversion live
  const amountEUR = currency === 'EUR' ? amountNum : amountNum / E2R_M;
  const amountRON = currency === 'RON' ? amountNum : amountNum * E2R_M;

  const tint = isIncome
    ? { head: 'var(--pos-soft)', stroke: 'var(--pos)', ink: 'var(--pos-ink)' }
    : { head: 'var(--neg-soft)', stroke: 'var(--neg)', ink: 'var(--neg-ink)' };

  const submit = () => {
    if (!canSave) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        id: 'tx-' + Date.now(),
        type, date, concept: concept.trim(),
        amount: amountEUR,
        category,
      });
      setSaving(false);
      onClose();
    }, 450);
  };

  const { y, m, d } = pISO_M(date);
  const dateLabel = `${String(d).padStart(2,'0')} ${MN_M[m-1].slice(0,3)} ${y}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop fade-in"
         onClick={onClose}>
      <div className="card scale-in" style={{width: 520, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto'}}
           onClick={(e)=>e.stopPropagation()}>

        {/* Header band tinted */}
        <div className="p-6 pb-5 relative" style={{background: tint.head, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottom: `1px solid ${tint.stroke}22`}}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider" style={{color: tint.ink}}>
                Nueva transacción
              </div>
              <div className="serif text-[26px] font-medium mt-1" style={{color: 'var(--ink)', lineHeight: 1.1}}>
                {isIncome ? 'Registrar ingreso' : 'Registrar gasto'}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg)] transition" aria-label="Cerrar">
              <Ic.x size={16}/>
            </button>
          </div>

          {/* Type toggle */}
          <div className="toggle-track mt-5">
            <div className="toggle-pill" data-active={!isIncome}
                 onClick={()=>{setType('expense'); setCategory('food');}}>
              <span className="inline-flex items-center gap-1.5">
                <Ic.minus size={12}/> Gasto
              </span>
            </div>
            <div className="toggle-pill" data-active={isIncome}
                 onClick={()=>{setType('income'); setCategory('salary');}}>
              <span className="inline-flex items-center gap-1.5">
                <Ic.plus size={12}/> Ingreso
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* DATE */}
          <div>
            <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Fecha</label>
            <button type="button" onClick={()=>setShowCal(s=>!s)}
                    className="input mt-1.5 flex items-center justify-between text-left">
              <span className="flex items-center gap-2">
                <Ic.calendar size={14} className="ink-3"/>
                <span className="num" style={{color: 'var(--ink)'}}>{dateLabel}</span>
              </span>
              <Ic.chevDown size={14} className="ink-3" style={{transform: showCal?'rotate(180deg)':'none', transition: 'transform .2s'}}/>
            </button>
            {showCal && (
              <div className="mt-2 fade-in">
                <Calendar value={date} onChange={(v)=>{setDate(v); setShowCal(false);}}/>
              </div>
            )}
          </div>

          {/* CONCEPT */}
          <div>
            <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Concepto</label>
            <input type="text" className="input mt-1.5"
                   placeholder={isIncome ? 'Ej. Pago cliente freelance' : 'Ej. Producto AliExpress'}
                   value={concept}
                   onChange={(e)=>setConcept(e.target.value)}/>
            {concept.length > 0 && !conceptValid && (
              <div className="text-[11px] mt-1.5" style={{color: 'var(--neg-ink)'}}>Mínimo 2 caracteres</div>
            )}
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Categoría</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {availableCats.map(k => {
                const cat = CATS_M[k];
                if (!cat) return null;
                const Icn = Ic[cat.icon] || Ic.more;
                const active = category === k;
                const isCustom = !!cat.custom;
                return (
                  <button key={k} type="button" onClick={()=>setCategory(k)}
                          onContextMenu={(e)=>{ if (isCustom) { e.preventDefault(); removeCustom(k); } }}
                          title={isCustom ? 'Clic derecho para eliminar' : undefined}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition"
                          style={{
                            border: `1px solid ${active ? cat.color : 'var(--border)'}`,
                            background: active ? `${cat.color}14` : 'var(--bg)',
                            color: active ? cat.color : 'var(--ink-2)',
                            fontWeight: active ? 600 : 400,
                          }}>
                    <Icn size={12}/> {cat.label}
                    {isCustom && active && (
                      <span
                        role="button"
                        aria-label="Eliminar categoría"
                        onClick={(e)=>{ e.stopPropagation(); removeCustom(k); }}
                        style={{
                          marginLeft: 4, opacity: 0.6, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center'
                        }}>
                        <Ic.x size={11}/>
                      </span>
                    )}
                  </button>
                );
              })}
              {/* Botón "+ Nueva" */}
              <button type="button" onClick={()=>setShowNewCat(s=>!s)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition"
                      style={{
                        border: `1px dashed var(--border)`,
                        background: showNewCat ? 'var(--surface)' : 'transparent',
                        color: 'var(--ink-2)',
                      }}>
                <Ic.plus size={12}/> Nueva
              </button>
            </div>

            {/* Mini-form: nueva categoría */}
            {showNewCat && (
              <div className="surface-2 fade-in" style={{borderRadius: 14, padding: 14, marginTop: 10}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-medium">Nueva categoría · {isIncome ? 'Ingreso' : 'Gasto'}</div>
                  <button type="button" onClick={()=>setShowNewCat(false)}
                          className="p-1 rounded-md hover:bg-[var(--bg)] transition"
                          aria-label="Cerrar">
                    <Ic.x size={12}/>
                  </button>
                </div>

                <input type="text" className="input"
                       placeholder="Nombre (ej. Mascotas, Inversiones, Café)"
                       value={newCatLabel}
                       maxLength={24}
                       onChange={(e)=>{ setNewCatLabel(e.target.value); setNewCatError(''); }}
                       onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); createCategory(); } }} />

                {/* Color */}
                <div className="mt-3">
                  <div className="text-[10px] ink-3 uppercase tracking-wider mb-1.5">Color</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CAT_PALETTE.map(c => (
                      <button key={c} type="button" onClick={()=>setNewCatColor(c)}
                              aria-label={`Color ${c}`}
                              style={{
                                width: 24, height: 24, borderRadius: 8, background: c, cursor: 'pointer',
                                border: newCatColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                                transition: 'transform .15s ease',
                                transform: newCatColor === c ? 'scale(1.08)' : 'scale(1)'
                              }}/>
                    ))}
                  </div>
                </div>

                {/* Icono */}
                <div className="mt-3">
                  <div className="text-[10px] ink-3 uppercase tracking-wider mb-1.5">Icono</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CAT_ICONS.map(iconKey => {
                      const Icn = Ic[iconKey] || Ic.more;
                      const active = newCatIcon === iconKey;
                      return (
                        <button key={iconKey} type="button" onClick={()=>setNewCatIcon(iconKey)}
                                aria-label={`Icono ${iconKey}`}
                                style={{
                                  width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: `1px solid ${active ? newCatColor : 'var(--border)'}`,
                                  background: active ? `${newCatColor}14` : 'var(--bg)',
                                  color: active ? newCatColor : 'var(--ink-2)',
                                }}>
                          <Icn size={14}/>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {newCatError && (
                  <div className="text-[11px] mt-2" style={{color: 'var(--neg-ink)'}}>{newCatError}</div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <button type="button" className="btn-ghost flex-1" onClick={()=>setShowNewCat(false)}>Cancelar</button>
                  <button type="button" className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                          disabled={newCatLabel.trim().length < 2}
                          style={{opacity: newCatLabel.trim().length < 2 ? 0.4 : 1}}
                          onClick={createCategory}>
                    <Ic.check size={12}/> Crear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AMOUNT + CURRENCY */}
          <div>
            <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Cantidad</label>
            <div className="mt-1.5 flex items-stretch gap-2">
              <div className="flex-1 relative">
                <input
                  type="text" inputMode="decimal"
                  className="input num pr-10" style={{fontSize: 20, fontWeight: 600, height: 56}}
                  placeholder="0,00"
                  value={amountStr}
                  onChange={(e)=>setAmountStr(e.target.value.replace(/[^0-9.,]/g,''))}/>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 num text-[14px] ink-3">
                  {currency === 'EUR' ? '€' : 'RON'}
                </div>
              </div>
              <div className="toggle-track" style={{alignSelf: 'stretch', padding: 4}}>
                <div className="toggle-pill" data-active={currency==='EUR'} onClick={()=>setCurrency('EUR')}>
                  <span className="inline-flex items-center gap-1.5"><Ic.euro size={12}/>EUR</span>
                </div>
                <div className="toggle-pill" data-active={currency==='RON'} onClick={()=>setCurrency('RON')}>
                  <span className="inline-flex items-center gap-1.5"><Ic.ron size={12}/>RON</span>
                </div>
              </div>
            </div>
            {/* Live conversion */}
            <div className="mt-2 flex items-center justify-between text-[11px] ink-3 num">
              <div className="flex items-center gap-1.5">
                <Ic.refresh size={10}/>
                <span>1 EUR = {E2R_M.toFixed(2)} RON</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{amountValid ? fEUR_M(amountEUR, {decimals: 2}) : '— €'}</span>
                <span className="ink-3">↔</span>
                <span>{amountValid ? fRON_M(amountRON) : '— RON'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
            <button type="button"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={!canSave || saving}
                    style={{opacity: (!canSave || saving) ? 0.4 : 1, cursor: (!canSave || saving) ? 'not-allowed' : 'pointer'}}
                    onClick={submit}>
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                  Guardando…
                </>
              ) : (
                <>
                  <Ic.check size={14}/> Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.FZ_Modal = { TxModal };
