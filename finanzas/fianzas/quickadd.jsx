// ─── Fianzas: Añadido rápido — flujo de 3 pasos ─────────────────────────
// 1) Mes + nº de gastos por día (rejilla)
// 2) Mismo mes + nº de ingresos por día
// 3) Lista de filas (concepto, categoría, cantidad) — guardado en bloque

const { useState: useStateQA, useEffect: useEffectQA, useMemo: useMemoQA, useRef: useRefQA } = React;
const QA_Ic = window.FZ_Icon;
const QA_FD = window.FIANZAS_DATA;
const { CATEGORIES: QA_CATS, EUR_TO_RON: QA_E2R } = QA_FD;
const QA_UI = window.FZ_UI;

const QA_MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const QA_BUILTIN_EXPENSE = ['food','transport','home','leisure','shopping','subs','health','other'];
const QA_BUILTIN_INCOME  = ['salary','freelance','gift','other'];

function qaDaysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function qaPad(n) { return String(n).padStart(2, '0'); }
function qaDateStr(y, m, d) { return `${y}-${qaPad(m)}-${qaPad(d)}`; }
function qaFirstWeekday(y, m) { return (new Date(y, m - 1, 1).getDay() + 6) % 7; }

function QA_CategoryOptions({ type, customCats }) {
  const builtin = type === 'expense' ? QA_BUILTIN_EXPENSE : QA_BUILTIN_INCOME;
  const userKeys = (customCats || []).filter(c => c.type === type).map(c => c.key);
  const keys = [...builtin, ...userKeys];
  return keys.map(k => {
    const c = QA_CATS[k];
    if (!c) return null;
    return <option key={k} value={k}>{c.label}</option>;
  });
}

function QuickAddModal({ open, onClose, onCommit, customCats = [] }) {
  const today = new Date();
  const [step, setStep] = useStateQA(1);
  const [view, setView] = useStateQA(() => ({ y: today.getFullYear(), m: today.getMonth() + 1 }));
  const [expensesByDay, setExpensesByDay] = useStateQA({});
  const [incomesByDay, setIncomesByDay]   = useStateQA({});
  const [rows, setRows] = useStateQA([]);

  useEffectQA(() => {
    if (!open) return;
    setStep(1);
    setExpensesByDay({});
    setIncomesByDay({});
    setRows([]);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const totalExpenses = Object.values(expensesByDay).reduce((s, n) => s + (n || 0), 0);
  const totalIncomes  = Object.values(incomesByDay).reduce((s, n) => s + (n || 0), 0);

  // Construir filas al pasar al paso 3
  function goToStep3() {
    const list = [];
    const dim = qaDaysInMonth(view.y, view.m);
    for (let d = 1; d <= dim; d++) {
      const dateStr = qaDateStr(view.y, view.m, d);
      const ne = expensesByDay[d] || 0;
      const ni = incomesByDay[d] || 0;
      for (let i = 0; i < ne; i++) {
        list.push({
          uid: `qa-e-${dateStr}-${i}`,
          date: dateStr, type: 'expense',
          concept: '', category: 'food',
          amountStr: '', currency: 'EUR'
        });
      }
      for (let i = 0; i < ni; i++) {
        list.push({
          uid: `qa-i-${dateStr}-${i}`,
          date: dateStr, type: 'income',
          concept: '', category: 'salary',
          amountStr: '', currency: 'EUR'
        });
      }
    }
    setRows(list);
    setStep(3);
  }

  function updateRow(uid, patch) {
    setRows(prev => prev.map(r => r.uid === uid ? { ...r, ...patch } : r));
  }
  function removeRow(uid) {
    setRows(prev => prev.filter(r => r.uid !== uid));
  }

  function saveAll() {
    if (rows.length === 0) { onClose(); return; }
    // validar
    for (const r of rows) {
      if (r.concept.trim().length < 2) {
        alert(`Falta el concepto en una fila (${r.type === 'expense' ? 'gasto' : 'ingreso'} del ${r.date}).`);
        return;
      }
      const n = parseFloat(String(r.amountStr).replace(',', '.'));
      if (!isFinite(n) || n <= 0) {
        alert(`Cantidad no válida en una fila (${r.type === 'expense' ? 'gasto' : 'ingreso'} del ${r.date}).`);
        return;
      }
    }
    const stamp = Date.now();
    const txs = rows.map((r, idx) => {
      const n = parseFloat(String(r.amountStr).replace(',', '.'));
      const amountEUR = r.currency === 'EUR' ? n : n / QA_E2R;
      return {
        id: `tx-${stamp}-${idx}`,
        type: r.type,
        date: r.date,
        concept: r.concept.trim(),
        amount: amountEUR,
        category: r.category,
      };
    });
    onCommit(txs);
    onClose();
  }

  // ── Render ─────────────────────────────────────────
  const tintBlue = { head: 'rgba(37,99,235,0.08)', stroke: 'rgba(37,99,235,0.35)', ink: '#1E40AF' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop fade-in"
         onClick={onClose}>
      <div className="card scale-in"
           style={{ width: 720, maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 pb-4" style={{
          background: tintBlue.head,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          borderBottom: `1px solid ${tintBlue.stroke}`
        }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: tintBlue.ink }}>
                Añadido rápido · Paso {step} de 3
              </div>
              <div className="serif text-[24px] font-medium mt-1" style={{ lineHeight: 1.15 }}>
                {step === 1 && 'Nº de gastos por día'}
                {step === 2 && 'Nº de ingresos por día'}
                {step === 3 && 'Rellena cada movimiento'}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg)] transition" aria-label="Cerrar">
              <QA_Ic.x size={16}/>
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1.5 mt-4">
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                height: 4, flex: 1, borderRadius: 999,
                background: n <= step ? 'var(--ink)' : 'var(--border)'
              }}/>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto" style={{ flex: 1 }}>
          {(step === 1 || step === 2) && (
            <QA_CountStep
              view={view} setView={setView}
              counts={step === 1 ? expensesByDay : incomesByDay}
              setCounts={step === 1 ? setExpensesByDay : setIncomesByDay}
              type={step === 1 ? 'expense' : 'income'}
            />
          )}
          {step === 3 && (
            <QA_FillStep
              rows={rows}
              updateRow={updateRow}
              removeRow={removeRow}
              customCats={customCats}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 flex items-center justify-between gap-3"
             style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div className="text-[12px] ink-3">
            {step === 1 && (<>{QA_MONTHS[view.m - 1]} {view.y} · <b style={{color:'var(--ink)'}}>{totalExpenses}</b> {totalExpenses === 1 ? 'gasto' : 'gastos'}</>)}
            {step === 2 && (<>{QA_MONTHS[view.m - 1]} {view.y} · <b style={{color:'var(--ink)'}}>{totalIncomes}</b> {totalIncomes === 1 ? 'ingreso' : 'ingresos'}</>)}
            {step === 3 && (<><b style={{color:'var(--ink)'}}>{rows.length}</b> movimiento{rows.length === 1 ? '' : 's'} para guardar</>)}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button className="btn-ghost" onClick={() => setStep(step - 1)}>← Atrás</button>
            )}
            {step === 1 && (
              <button className="btn-primary" onClick={() => setStep(2)}>Continuar →</button>
            )}
            {step === 2 && (
              <button className="btn-primary" onClick={goToStep3}
                      disabled={totalExpenses === 0 && totalIncomes === 0}
                      style={{ opacity: (totalExpenses === 0 && totalIncomes === 0) ? 0.4 : 1 }}>
                Continuar →
              </button>
            )}
            {step === 3 && (
              <button className="btn-primary flex items-center gap-1.5" onClick={saveAll}
                      disabled={rows.length === 0}
                      style={{ opacity: rows.length === 0 ? 0.4 : 1 }}>
                <QA_Ic.check size={14}/> Guardar {rows.length} movimiento{rows.length === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Paso 1 / 2: rejilla de conteo por día ──────────────────────────────
function QA_CountStep({ view, setView, counts, setCounts, type }) {
  const dim = qaDaysInMonth(view.y, view.m);
  const firstWk = qaFirstWeekday(view.y, view.m);

  function setDay(d, v) {
    const raw = String(v).replace(/[^0-9]/g, '');
    if (raw === '') {
      const next = { ...counts };
      delete next[d];
      setCounts(next);
    } else {
      setCounts({ ...counts, [d]: parseInt(raw, 10) });
    }
  }

  function shiftMonth(delta) {
    let nm = view.m + delta, ny = view.y;
    if (nm > 12) { nm = 1; ny++; }
    if (nm < 1)  { nm = 12; ny--; }
    setView({ y: ny, m: nm });
  }

  const isExpense = type === 'expense';
  const colorVar  = isExpense ? 'var(--neg)' : 'var(--pos)';
  const softBg    = isExpense ? 'var(--neg-soft)' : 'var(--pos-soft)';
  const inkColor  = isExpense ? 'var(--neg-ink)'  : 'var(--pos-ink)';

  const cells = [];
  for (let i = 0; i < firstWk; i++) cells.push(<div key={`m-${i}`}/>);
  for (let d = 1; d <= dim; d++) {
    const val = counts[d];
    const has = val != null && val > 0;
    const isZero = val === 0;
    cells.push(
      <div key={d} style={{
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: 6, borderRadius: 10,
        background: has ? softBg : (isZero ? 'var(--surface-2)' : 'var(--bg)'),
        border: `1px solid ${has ? colorVar : 'var(--border)'}`,
        transition: 'all .15s ease',
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textAlign: 'left', paddingLeft: 2 }}>{d}</div>
        <input
          type="number" inputMode="numeric" min="0" step="1"
          value={val ?? ''}
          onChange={(e) => setDay(d, e.target.value)}
          placeholder="·"
          style={{
            width: '100%', textAlign: 'center',
            padding: '6px 2px', borderRadius: 6,
            fontSize: 14, fontWeight: 700,
            border: '1px solid transparent',
            background: 'transparent',
            color: has ? inkColor : 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
            outline: 'none',
            MozAppearance: 'textfield',
          }}
        />
      </div>
    );
  }
  // padding al final
  const totalCells = firstWk + dim;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailing; i++) cells.push(<div key={`t-${i}`}/>);

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => shiftMonth(-1)}>
          <QA_Ic.chevLeft size={14}/>
        </button>
        <div className="serif text-[20px] font-medium" style={{ textTransform: 'capitalize' }}>
          {QA_MONTHS[view.m - 1]} <span className="ink-3" style={{ fontSize: 14 }}>{view.y}</span>
        </div>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => shiftMonth(1)}>
          <QA_Ic.chevRight size={14}/>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map((dn, i) => (
          <div key={i} className="text-center text-[10px] ink-3 uppercase tracking-wider py-1 font-semibold">{dn}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5">{cells}</div>

      <div className="text-[11px] ink-3 mt-3" style={{ lineHeight: 1.5 }}>
        Pon el número de {isExpense ? 'gastos' : 'ingresos'} que tuviste cada día. Deja en blanco los días sin movimientos.
      </div>
    </div>
  );
}

// ── Paso 3: lista de filas (concepto / categoría / cantidad) ───────────
function QA_FillStep({ rows, updateRow, removeRow, customCats }) {
  if (rows.length === 0) {
    return (
      <div className="ink-3 text-[13px] text-center" style={{ padding: '40px 0' }}>
        No marcaste ningún movimiento en los pasos anteriores. Vuelve atrás y añade al menos uno.
      </div>
    );
  }

  // Agrupar por fecha
  const byDate = {};
  rows.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });
  const dates = Object.keys(byDate).sort();

  return (
    <div className="flex flex-col gap-5">
      {dates.map(date => (
        <div key={date}>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-2)' }}>
            {(() => {
              const p = QA_UI.parseISO(date);
              return `${qaPad(p.d)} ${QA_UI.MONTH_SHORT[p.m - 1]} ${p.y}`;
            })()}
          </div>
          <div className="flex flex-col gap-2">
            {byDate[date].map((r, idx) => (
              <QA_Row key={r.uid} row={r} index={idx} updateRow={updateRow} removeRow={removeRow} customCats={customCats}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QA_Row({ row, index, updateRow, removeRow, customCats }) {
  const isIncome = row.type === 'income';
  const accent = isIncome ? 'var(--pos)' : 'var(--neg)';
  const accentSoft = isIncome ? 'var(--pos-soft)' : 'var(--neg-soft)';
  const accentInk  = isIncome ? 'var(--pos-ink)'  : 'var(--neg-ink)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr 1fr auto auto auto',
      gap: 8, alignItems: 'center',
      padding: 8, borderRadius: 12,
      border: '1px solid var(--border)', background: 'var(--bg)',
    }}>
      {/* Tipo badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 8,
        background: accentSoft, color: accentInk,
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em'
      }}>
        {isIncome ? <QA_Ic.plus size={10}/> : <QA_Ic.minus size={10}/>}
        {isIncome ? 'In' : 'Ga'}
      </div>

      {/* Concepto */}
      <input type="text" className="input"
             placeholder={isIncome ? 'Concepto del ingreso' : 'Concepto del gasto'}
             value={row.concept}
             onChange={(e) => updateRow(row.uid, { concept: e.target.value })}
             style={{ padding: '8px 10px', fontSize: 13, borderRadius: 8 }}/>

      {/* Categoría */}
      <select
        value={row.category}
        onChange={(e) => updateRow(row.uid, { category: e.target.value })}
        style={{
          padding: '8px 10px', fontSize: 13, fontWeight: 500,
          border: '1px solid var(--border)', borderRadius: 8,
          background: 'var(--bg)', color: 'var(--ink)', cursor: 'pointer',
        }}>
        <QA_CategoryOptions type={row.type} customCats={customCats}/>
      </select>

      {/* Cantidad */}
      <input type="text" inputMode="decimal"
             placeholder="0,00"
             value={row.amountStr}
             onChange={(e) => updateRow(row.uid, { amountStr: e.target.value.replace(/[^0-9.,]/g, '') })}
             style={{
               width: 90, padding: '8px 10px', fontSize: 13, fontWeight: 600,
               border: '1px solid var(--border)', borderRadius: 8,
               background: 'var(--bg)', color: 'var(--ink)',
               textAlign: 'right', fontVariantNumeric: 'tabular-nums',
             }}/>

      {/* Divisa */}
      <select
        value={row.currency}
        onChange={(e) => updateRow(row.uid, { currency: e.target.value })}
        style={{
          padding: '8px 6px', fontSize: 12, fontWeight: 600,
          border: '1px solid var(--border)', borderRadius: 8,
          background: 'var(--bg)', color: 'var(--ink-2)', cursor: 'pointer', width: 64,
        }}>
        <option value="EUR">EUR</option>
        <option value="RON">RON</option>
      </select>

      {/* Eliminar */}
      <button type="button" onClick={() => removeRow(row.uid)}
              title="Eliminar esta fila" aria-label="Eliminar"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--ink-3)', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
        <QA_Ic.x size={14}/>
      </button>
    </div>
  );
}

window.FZ_QuickAdd = { QuickAddModal };
