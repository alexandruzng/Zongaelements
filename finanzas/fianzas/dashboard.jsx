// ─── Fianzas: Dashboard view ─────────────────────────────────────────────

const DS = window.FZ_UI;
const DI = window.FZ_Icon;
const DCATS = window.FIANZAS_DATA.CATEGORIES;
const { useState: useStateD, useMemo: useMemoD } = React;

function Dashboard({ state, actions, derived }) {
  const { transactions, budgets } = state;
  const { summary, series, breakdown, tips, recent, hasMonthOverMonth, isAllTime } = derived;

  // KPI subtitle depends on scope
  const scopeLabel = isAllTime
    ? `Histórico · ${derived.monthsCount} meses`
    : DS.labelMonth(derived.currentKey);

  return (
    <div className="fade-up">
      {isAllTime && (
        <div className="card soft-shadow p-5 mb-5 flex items-center gap-4 flex-wrap"
             style={{background: 'var(--surface)'}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{background: 'var(--bg)', border: '1px solid var(--border)'}}>
            <DI.sparkles size={16}/>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Resumen global</div>
            <div className="serif text-[20px] font-medium mt-0.5" style={{lineHeight:1.1}}>
              Todos los meses registrados
            </div>
            <div className="text-[12px] ink-2 mt-1">
              {DS.labelMonth(derived.fullSeries[0].key)} → {DS.labelMonth(derived.fullSeries[derived.fullSeries.length-1].key)}
              <span className="dot-sep"/>
              <span className="num">{derived.monthTx.length}</span> movimientos totales
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[10px] ink-3 uppercase tracking-wider">Media ingresos/mes</div>
              <div className="num font-semibold" style={{fontSize:18, color:'var(--pos-ink)'}}>{DS.fmtEUR(derived.avgIncome, {decimals:0})}</div>
            </div>
            <div>
              <div className="text-[10px] ink-3 uppercase tracking-wider">Media gastos/mes</div>
              <div className="num font-semibold" style={{fontSize:18, color:'var(--neg-ink)'}}>{DS.fmtEUR(derived.avgExpense, {decimals:0})}</div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <DS.KpiCard
          label={isAllTime ? 'Ingresos acumulados' : 'Ingresos totales'} subtle={scopeLabel}
          amount={summary.income} kind="pos"
          icon={<DI.arrowDown size={17}/>}
          trend={isAllTime ? null : { pct: summary.incomeDelta, prev: summary.prevIncome }}
          altFootnote={isAllTime ? `Media: ${DS.fmtEUR(derived.avgIncome, {decimals:0})} /mes` : null}
          sparkline={series.map(s=>s.income)}
          animateKey={derived.currentKey+'-inc'}
        />
        <DS.KpiCard
          label={isAllTime ? 'Gastos acumulados' : 'Gastos totales'} subtle={scopeLabel}
          amount={summary.expense} kind="neg"
          icon={<DI.arrowUp size={17}/>}
          trend={isAllTime ? null : { pct: summary.expenseDelta, prev: summary.prevExpense }}
          altFootnote={isAllTime ? `Media: ${DS.fmtEUR(derived.avgExpense, {decimals:0})} /mes` : null}
          sparkline={series.map(s=>s.expense)}
          animateKey={derived.currentKey+'-exp'}
        />
        <DS.KpiCard
          label={isAllTime ? 'Balance acumulado' : 'Balance'}
          subtle={isAllTime
            ? (summary.balance >= 0 ? 'Ahorro neto total' : 'Déficit acumulado')
            : (summary.balance >= 0 ? 'Este mes ahorras' : 'Este mes gastas más')}
          amount={summary.balance} kind="balance"
          icon={<DI.wallet size={17}/>}
          trend={isAllTime ? null : { pct: summary.balanceDelta, prev: summary.prevBalance }}
          altFootnote={isAllTime ? `Media: ${DS.fmtEUR(derived.avgBalance, {decimals:0})} /mes` : null}
          sparkline={series.map(s=>s.income - s.expense)}
          animateKey={derived.currentKey+'-bal'}
        />
      </div>

      {/* Row: line chart + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        <div className="card soft-shadow p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">{isAllTime ? 'Histórico completo' : 'Evolución mensual'}</div>
              <div className="serif text-[20px] font-medium mt-0.5">Ingresos vs. gastos</div>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 ink-2"><span className="swatch" style={{background:'#10b981'}}/>Ingresos</span>
              <span className="flex items-center gap-1.5 ink-2"><span className="swatch" style={{background:'#ef4444'}}/>Gastos</span>
            </div>
          </div>
          <DS.MonthlyLine data={series}/>
        </div>
        <div className="card soft-shadow p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">{isAllTime ? 'Gastos por categoría (histórico)' : 'Gastos por categoría'}</div>
              <div className="serif text-[20px] font-medium mt-0.5">Distribución</div>
            </div>
          </div>
          {breakdown.length > 0
            ? <DS.ExpenseDonut breakdown={breakdown} total={summary.expense}/>
            : <div className="ink-3 text-[13px] py-10 text-center">Sin gastos registrados.</div>
          }
        </div>
      </div>

      {isAllTime ? (
        <>
          {/* All-time: best/worst month table + tips */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
            <div className="card soft-shadow p-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Mes a mes</div>
                  <div className="serif text-[20px] font-medium mt-0.5">Resumen por mes</div>
                </div>
                <div className="chip">{derived.monthsCount} meses</div>
              </div>
              <AllMonthsTable series={derived.fullSeries} best={derived.best} worst={derived.worst} onPick={(k)=>actions.setView('month')}/>
            </div>
            <div className="lg:col-span-2">
              <DS.TipsCarousel tips={tips}/>
            </div>
          </div>

          {/* Recent tx full width */}
          <div className="card soft-shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Últimos movimientos</div>
                <div className="serif text-[20px] font-medium mt-0.5">Transacciones recientes</div>
              </div>
              <button className="btn-ghost text-[12px]" onClick={()=>actions.setView('month')}>
                Ver todas <DI.chevRight size={12} className="inline ml-1 -mr-0.5"/>
              </button>
            </div>
            <div className="stagger">
              {recent.map(tx => <DS.TxRow key={tx.id} tx={tx} onDelete={actions.deleteTx} onEdit={actions.editTx}/>)}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Row: health + tips */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
            <div className="card soft-shadow p-6 lg:col-span-3 flex flex-col gap-5">
              <div>
                <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Indicador global</div>
                <div className="serif text-[20px] font-medium mt-0.5">¿Cómo va tu mes?</div>
              </div>
              <DS.HealthBar
                income={summary.income}
                expense={summary.expense}
                savingsRate={summary.income>0 ? (summary.income - summary.expense)/summary.income : 0}
              />
              <div className="grid grid-cols-3 gap-3 pt-4 hairline" style={{borderTop: '1px solid var(--border)'}}>
                <MiniStat label="Tasa de ahorro" value={`${Math.round((summary.income>0 ? (summary.income-summary.expense)/summary.income : 0)*100)}%`} tone={summary.balance>=0?'pos':'neg'}/>
                <MiniStat label="Gasto diario medio" value={DS.fmtEUR(summary.expense / Math.max(1, derived.daysElapsed), {decimals: 2})}/>
                <MiniStat label="Transacciones" value={derived.txCountThisMonth}/>
              </div>
            </div>

            <div className="lg:col-span-2">
              <DS.TipsCarousel tips={tips}/>
            </div>
          </div>

          {/* Row: recent tx + budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="card soft-shadow p-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Últimos movimientos</div>
                  <div className="serif text-[20px] font-medium mt-0.5">Transacciones recientes</div>
                </div>
                <button className="btn-ghost text-[12px]" onClick={()=>actions.setView('month')}>
                  Ver todas <DI.chevRight size={12} className="inline ml-1 -mr-0.5"/>
                </button>
              </div>
              <div className="stagger">
                {recent.length === 0 && <div className="ink-3 text-[13px] py-8 text-center">Sin transacciones aún.</div>}
                {recent.map(tx => <DS.TxRow key={tx.id} tx={tx} onDelete={actions.deleteTx} onEdit={actions.editTx}/>)}
              </div>
            </div>

            <div className="card soft-shadow p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Presupuestos</div>
                  <div className="serif text-[20px] font-medium mt-0.5">Límites del mes</div>
                </div>
                <div className="chip"><DI.sliders size={11}/><span>Mensual</span></div>
              </div>
              <BudgetList budgets={budgets} breakdown={derived.breakdownFull}/>
            </div>
          </div>
        </>
      )}

      {/* ── Movimientos (filtrable, con selector de mes / todos) ───────── */}
      <DashTxBrowser transactions={transactions} actions={actions} />
    </div>
  );
}

// ── Movimientos: réplica filtrable del bloque de "Por mes", con selector
//    de mes (incluye "Todos") como dropdown propio. Se monta al final del
//    dashboard tanto en modo mes activo como en modo histórico.
function DashTxBrowser({ transactions, actions }) {
  const [monthSel, setMonthSel]     = useStateD('all');
  const [catFilter, setCatFilter]   = useStateD('all');
  const [query, setQuery]           = useStateD('');
  const [typeFilter, setTypeFilter] = useStateD('all');

  const monthKeys = useMemoD(() => {
    const set = new Set(transactions.map(t => DS.monthKey(t.date)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const scopeTx = useMemoD(() => {
    if (monthSel === 'all') return transactions;
    return transactions.filter(t => DS.monthKey(t.date) === monthSel);
  }, [transactions, monthSel]);

  const filteredTx = useMemoD(() => {
    const q = query.trim().toLowerCase();
    return scopeTx
      .filter(t => {
        if (catFilter !== 'all' && t.category !== catFilter) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (q && !(t.concept || '').toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.date < b.date ? 1 : -1);
  }, [scopeTx, catFilter, query, typeFilter]);

  const filteredTotals = useMemoD(() => {
    const income  = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filteredTx.length };
  }, [filteredTx]);

  const catsInScope = useMemoD(() => Array.from(new Set(scopeTx.map(t => t.category))), [scopeTx]);

  const scopeLabel = monthSel === 'all' ? 'Todos los meses' : DS.labelMonth(monthSel);

  return (
    <div className="card soft-shadow p-6 mt-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Movimientos</div>
          <div className="serif text-[20px] font-medium mt-0.5">
            {filteredTx.length} de {scopeTx.length}
            <span className="ink-3 text-[13px] font-normal ml-2">· {scopeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de mes / todos */}
          <DS.MonthDropdown
            value={monthSel}
            options={monthKeys}
            onChange={setMonthSel}
            includeAll={true} />
          {/* Type segments */}
          <div className="toggle-track" style={{padding:3}}>
            <div className="toggle-pill" style={{padding:'6px 11px', fontSize: 12}} data-active={typeFilter==='all'} onClick={()=>setTypeFilter('all')}>Todos</div>
            <div className="toggle-pill" style={{padding:'6px 11px', fontSize: 12}} data-active={typeFilter==='income'} onClick={()=>setTypeFilter('income')}>Ingresos</div>
            <div className="toggle-pill" style={{padding:'6px 11px', fontSize: 12}} data-active={typeFilter==='expense'} onClick={()=>setTypeFilter('expense')}>Gastos</div>
          </div>
          {/* Search */}
          <div className="relative">
            <DI.search size={13} className="ink-3 absolute left-3 top-1/2 -translate-y-1/2"/>
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
        {catsInScope.map(k => {
          const c = DCATS[k];
          if (!c) return null;
          return (
            <button key={k} className="seg-btn shrink-0 flex items-center gap-1.5"
                    data-active={catFilter===k} onClick={()=>setCatFilter(catFilter===k?'all':k)}>
              <span className="swatch" style={{background: c.color}}/> {c.label}
            </button>
          );
        })}
      </div>

      <div className="stagger">
        {filteredTx.length === 0 && (
          <div className="ink-3 text-[13px] py-10 text-center">
            {scopeTx.length === 0 ? 'No hay movimientos en este periodo.' : 'Ningún movimiento coincide con los filtros.'}
          </div>
        )}
        {filteredTx.map(tx => <DS.TxRow key={tx.id} tx={tx} onDelete={actions.deleteTx} onEdit={actions.editTx}/>)}
      </div>

      {filteredTx.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {filteredTotals.income > 0 && filteredTotals.expense > 0 ? (
            <>
              <div className="flex items-center justify-between py-1">
                <span className="text-[12px] ink-3">Ingresos</span>
                <span className="num font-medium" style={{ color: 'var(--pos-ink)', fontSize: 13 }}>
                  +{DS.fmtEUR(filteredTotals.income, {decimals: 2}).replace('−','')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[12px] ink-3">Gastos</span>
                <span className="num font-medium" style={{ color: 'var(--neg-ink)', fontSize: 13 }}>
                  −{DS.fmtEUR(filteredTotals.expense, {decimals: 2}).replace('−','')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 mt-1"
                   style={{ borderTop: '1px dashed var(--border)' }}>
                <div className="text-[13px] font-medium">
                  Balance
                  <span className="ink-3 text-[11px] num ml-2">({filteredTotals.count} mov.)</span>
                </div>
                <span className="num font-semibold"
                      style={{ fontSize: 16, color: filteredTotals.net >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                  {filteredTotals.net < 0 ? '−' : ''}{DS.fmtEUR(Math.abs(filteredTotals.net), {decimals: 2}).replace('−','')}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-1">
              <div className="text-[13px] font-medium">
                Total {filteredTotals.expense > 0 ? 'gastos' : 'ingresos'}
                <span className="ink-3 text-[11px] num ml-2">({filteredTotals.count} mov.)</span>
              </div>
              <span className="num font-semibold"
                    style={{
                      fontSize: 16,
                      color: filteredTotals.expense > 0 ? 'var(--neg-ink)' : 'var(--pos-ink)'
                    }}>
                {filteredTotals.expense > 0 ? '−' : '+'}{DS.fmtEUR(filteredTotals.expense || filteredTotals.income, {decimals: 2}).replace('−','')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const color = tone === 'pos' ? 'var(--pos-ink)' : tone === 'neg' ? 'var(--neg-ink)' : 'var(--ink)';
  return (
    <div>
      <div className="text-[10px] ink-3 uppercase tracking-wider mb-1">{label}</div>
      <div className="num font-semibold" style={{fontSize: 18, color}}>{value}</div>
    </div>
  );
}

function BudgetList({ budgets, breakdown }) {
  const items = Object.entries(budgets).map(([k, limit]) => {
    const spent = breakdown[k] || 0;
    return { key: k, limit, spent, pct: Math.round((spent/limit)*100) };
  }).sort((a,b) => b.pct - a.pct);
  return (
    <div className="flex flex-col gap-4">
      {items.slice(0,6).map(b => {
        const cat = DCATS[b.key];
        const over = b.pct >= 100;
        const near = b.pct >= 80 && !over;
        const color = over ? 'var(--neg)' : near ? '#f59e0b' : cat.color;
        return (
          <div key={b.key}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="swatch" style={{background: cat.color}}/>
              <span className="text-[12px] font-medium">{cat.label}</span>
              {over && <span className="chip" style={{background:'var(--neg-soft)', color:'var(--neg-ink)', borderColor:'transparent', padding:'2px 8px'}}>
                <DI.alert size={10}/> Superado
              </span>}
              {near && <span className="chip" style={{background:'#fef3c7', color:'#a16207', borderColor:'transparent', padding:'2px 8px'}}>
                Cerca del límite
              </span>}
              <span className="num ml-auto text-[11px] ink-2">
                {DS.fmtEUR(b.spent, {decimals:0})} <span className="ink-3">/ {DS.fmtEUR(b.limit, {decimals:0})}</span>
              </span>
            </div>
            <div className="health-track" style={{height: 6}}>
              <div style={{width: `${Math.min(100, b.pct)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 1s cubic-bezier(.2,.8,.2,1)'}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.FZ_Dashboard = { Dashboard };

function AllMonthsTable({ series, best, worst, onPick }) {
  const rows = [...series].reverse();
  const maxAbs = Math.max(...rows.map(r => Math.max(r.income, r.expense)), 1);
  return (
    <div className="flex flex-col gap-3">
      {rows.map(r => {
        const bal = r.income - r.expense;
        const isBest = best && r.key === best.key;
        const isWorst = worst && r.key === worst.key && worst.bal !== best?.bal;
        return (
          <div key={r.key} className="grid items-center gap-3" style={{gridTemplateColumns: '140px 1fr 120px'}}>
            <div className="flex items-center gap-2">
              <div className="text-[12px] font-medium">{DS.labelMonth(r.key)}</div>
              {isBest && <span className="chip" style={{background:'var(--pos-soft)', color:'var(--pos-ink)', borderColor:'transparent', padding:'2px 6px', fontSize:10}}>Mejor</span>}
              {isWorst && <span className="chip" style={{background:'var(--neg-soft)', color:'var(--neg-ink)', borderColor:'transparent', padding:'2px 6px', fontSize:10}}>Peor</span>}
            </div>
            <div className="flex items-center gap-1" style={{height:24}}>
              <div style={{width: `${(r.income/maxAbs)*50}%`, height:8, background:'#10b981', borderRadius:3, transition:'width .8s'}}/>
              <div style={{width: `${(r.expense/maxAbs)*50}%`, height:8, background:'#ef4444', borderRadius:3, transition:'width .8s'}}/>
            </div>
            <div className="text-right">
              <div className="num font-medium text-[13px]" style={{color: bal>=0?'var(--pos-ink)':'var(--neg-ink)'}}>
                {bal<0?'−':''}{DS.fmtEUR(Math.abs(bal), {decimals:0}).replace('−','')}
              </div>
              <div className="num text-[10px] ink-3">
                {DS.fmtEUR(r.income, {decimals:0, compact:true})} / {DS.fmtEUR(r.expense, {decimals:0, compact:true})}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
