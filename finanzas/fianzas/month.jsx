// ─── Fianzas: Month view (filtrado por mes) ──────────────────────────────

const MUI = window.FZ_UI;
const MI = window.FZ_Icon;
const MCATS = window.FIANZAS_DATA.CATEGORIES;
const { useState: useStateX, useMemo: useMemoX } = React;

function MonthView({ state, actions, derived }) {
  const { transactions } = state;
  const { summary, monthTx, breakdown, series, currentKey, prevKey } = derived;

  const [catFilter, setCatFilter] = useStateX('all');
  const [query, setQuery]         = useStateX('');
  const [typeFilter, setTypeFilter] = useStateX('all');

  const filteredTx = useMemoX(() => {
    return monthTx.filter(t => {
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (query && !t.concept.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [monthTx, catFilter, query, typeFilter]);

  const catsInMonth = Array.from(new Set(monthTx.map(t => t.category)));

  return (
    <div className="fade-up">
      {/* Context bar */}
      <div className="card soft-shadow p-6 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Estás explorando</div>
          <div className="serif text-[28px] font-medium mt-0.5" style={{lineHeight:1.1}}>{MUI.labelMonth(currentKey)}</div>
          <div className="text-[12px] ink-2 mt-1">
            {monthTx.length} movimientos
            <span className="dot-sep"/>
            <span className="num">{MUI.fmtEUR(summary.income, {decimals:0})}</span>
            <span className="ink-3"> ingresos</span>
            <span className="dot-sep"/>
            <span className="num">{MUI.fmtEUR(summary.expense, {decimals:0})}</span>
            <span className="ink-3"> gastos</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] ink-3 uppercase tracking-wider">Balance del mes</div>
            <div className="num font-semibold" style={{fontSize: 26, color: summary.balance >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
              {summary.balance < 0 ? '−' : ''}{MUI.fmtEUR(Math.abs(summary.balance), {decimals: 2}).replace('−','')}
            </div>
          </div>
        </div>
      </div>

      {/* Comparative with previous month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <CompareCard label="Ingresos" current={summary.income}  prev={summary.prevIncome}  kind="pos"/>
        <CompareCard label="Gastos"   current={summary.expense} prev={summary.prevExpense} kind="neg"/>
        <CompareCard label="Balance"  current={summary.balance} prev={summary.prevBalance} kind="balance"/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        <div className="card soft-shadow p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Día a día</div>
              <div className="serif text-[20px] font-medium mt-0.5">Flujo diario del mes</div>
            </div>
          </div>
          <DailyBars tx={monthTx} monthKey={currentKey}/>
        </div>
        <div className="card soft-shadow p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Distribución</div>
              <div className="serif text-[20px] font-medium mt-0.5">Gastos del mes</div>
            </div>
          </div>
          {breakdown.length > 0
            ? <MUI.ExpenseDonut breakdown={breakdown} total={summary.expense}/>
            : <div className="ink-3 text-[13px] py-10 text-center">Sin gastos registrados.</div>}
        </div>
      </div>

      {/* Full tx list with filters */}
      <div className="card soft-shadow p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Movimientos</div>
            <div className="serif text-[20px] font-medium mt-0.5">
              {filteredTx.length} de {monthTx.length}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type segments */}
            <div className="toggle-track" style={{padding:3}}>
              <div className="toggle-pill" style={{padding:'6px 11px', fontSize: 12}} data-active={typeFilter==='all'} onClick={()=>setTypeFilter('all')}>Todos</div>
              <div className="toggle-pill" style={{padding:'6px 11px', fontSize: 12}} data-active={typeFilter==='income'} onClick={()=>setTypeFilter('income')}>Ingresos</div>
              <div className="toggle-pill" style={{padding:'6px 11px', fontSize: 12}} data-active={typeFilter==='expense'} onClick={()=>setTypeFilter('expense')}>Gastos</div>
            </div>
            {/* Search */}
            <div className="relative">
              <MI.search size={13} className="ink-3 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input className="input pl-8" style={{height: 36, fontSize: 13, minWidth: 220}}
                     placeholder="Buscar concepto…"
                     value={query} onChange={(e)=>setQuery(e.target.value)}/>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" style={{scrollbarWidth:'thin'}}>
          <button className="seg-btn shrink-0" data-active={catFilter==='all'} onClick={()=>setCatFilter('all')}>
            Todas las categorías
          </button>
          {catsInMonth.map(k => {
            const c = MCATS[k];
            return (
              <button key={k} className="seg-btn shrink-0 flex items-center gap-1.5"
                      data-active={catFilter===k} onClick={()=>setCatFilter(catFilter===k?'all':k)}>
                <span className="swatch" style={{background: c.color}}/> {c.label}
              </button>
            );
          })}
        </div>

        <div className="stagger">
          {filteredTx.length === 0 && <div className="ink-3 text-[13px] py-10 text-center">Ningún movimiento coincide con los filtros.</div>}
          {filteredTx.map(tx => <MUI.TxRow key={tx.id} tx={tx} onDelete={actions.deleteTx}/>)}
        </div>
      </div>
    </div>
  );
}

function CompareCard({ label, current, prev, kind }) {
  const diff = current - prev;
  const pct = prev !== 0 ? (diff/Math.abs(prev))*100 : (current > 0 ? 100 : 0);
  const isBalance = kind === 'balance';
  const color = kind === 'pos' ? 'var(--pos)' : kind === 'neg' ? 'var(--neg)' : (current >= 0 ? 'var(--pos)' : 'var(--neg)');

  // Up-arrow is good for income, bad for expense
  const isUp = diff >= 0;
  const good = isBalance ? (current >= 0) : (kind === 'pos' ? isUp : !isUp);

  return (
    <div className="card soft-shadow p-5 fade-up">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">{label}</div>
        <div className="chip" style={{
          background: good ? 'var(--pos-soft)' : 'var(--neg-soft)',
          color: good ? 'var(--pos-ink)' : 'var(--neg-ink)',
          borderColor: 'transparent', padding: '3px 8px'
        }}>
          {isUp ? <MI.arrowUp size={10}/> : <MI.arrowDown size={10}/>}
          <span className="num text-[11px]">{Math.abs(pct).toFixed(1)}%</span>
        </div>
      </div>
      <div className="num font-semibold tracking-tight" style={{fontSize: 26, color, lineHeight: 1}}>
        {isBalance && current < 0 ? '−' : ''}{MUI.fmtEUR(Math.abs(current), {decimals: 2}).replace('−','')}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] ink-3">
        <span>Mes anterior</span>
        <span className="num ink-2">{MUI.fmtEUR(prev, {decimals: 0})}</span>
      </div>
    </div>
  );
}

function DailyBars({ tx, monthKey }) {
  const { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } = window.Recharts;
  const [y, m] = monthKey.split('-').map(Number);
  const days = MUI.daysInMonth(y, m);
  const data = Array.from({length: days}, (_, i) => ({ day: i+1, income: 0, expense: 0 }));
  tx.forEach(t => {
    const d = MUI.parseISO(t.date).d;
    if (t.type === 'income') data[d-1].income += t.amount;
    else data[d-1].expense += t.amount;
  });
  // Recharts wants expense negative to render below zero
  const plot = data.map(d => ({ day: d.day, Ingresos: d.income, Gastos: -d.expense }));
  return (
    <div style={{height: 260}} className="fade-in">
      <ResponsiveContainer>
        <BarChart data={plot} margin={{top:10, right:10, left:-15, bottom:0}}>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3"/>
          <XAxis dataKey="day" axisLine={false} tickLine={false} dy={6} interval={2}/>
          <YAxis axisLine={false} tickLine={false} width={50}
                 tickFormatter={(v)=> Math.abs(v)>=1000 ? `${(Math.abs(v)/1000).toFixed(1)}k` : Math.abs(v)}/>
          <Tooltip content={<DailyTip/>} cursor={{fill: 'var(--surface)'}}/>
          <ReferenceLine y={0} stroke="var(--border)"/>
          <Bar dataKey="Ingresos" fill="#10b981" radius={[4,4,0,0]} maxBarSize={14}/>
          <Bar dataKey="Gastos"   fill="#ef4444" radius={[0,0,4,4]} maxBarSize={14}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function DailyTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 soft-shadow" style={{borderRadius: 12}}>
      <div className="text-[11px] ink-3 mb-1.5">Día {label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="swatch" style={{background: p.color}}/>
          <span className="ink-2">{p.name}</span>
          <span className="num ml-auto font-medium">{MUI.fmtEUR(Math.abs(p.value), {decimals: 0})}</span>
        </div>
      ))}
    </div>
  );
}

window.FZ_Month = { MonthView };
