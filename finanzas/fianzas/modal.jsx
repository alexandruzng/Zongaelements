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

// ── TxModal ─────────────────────────────────────────────────────────────
function TxModal({ open, onClose, onSave, defaultType='expense' }) {
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

  useEffectM(() => {
    if (!open) return;
    setType(defaultType);
    setConcept(''); setAmountStr(''); setCurrency('EUR'); setSaving(false); setShowCal(false);
    setCategory(defaultType==='expense' ? 'food' : 'salary');
    const t = new Date(); setDate(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, defaultType]);

  if (!open) return null;

  const isIncome = type === 'income';
  const availableCats = isIncome ? ['salary','freelance','gift','other'] : ['food','transport','home','leisure','shopping','subs','health','other'];

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
                const Icn = Ic[cat.icon] || Ic.more;
                const active = category === k;
                return (
                  <button key={k} type="button" onClick={()=>setCategory(k)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition"
                          style={{
                            border: `1px solid ${active ? cat.color : 'var(--border)'}`,
                            background: active ? `${cat.color}14` : 'var(--bg)',
                            color: active ? cat.color : 'var(--ink-2)',
                            fontWeight: active ? 600 : 400,
                          }}>
                    <Icn size={12}/> {cat.label}
                  </button>
                );
              })}
            </div>
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
