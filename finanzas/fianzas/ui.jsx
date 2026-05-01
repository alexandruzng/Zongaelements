// ─── Fianzas: UI primitives, helpers, hooks, KPI cards, charts, tips ─────

const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { FIANZAS_DATA } = window;
const { EUR_TO_RON, CATEGORIES } = FIANZAS_DATA;
const I = window.FZ_Icon;

// ── Utils ───────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_NAMES   = ['L','M','X','J','V','S','D'];

function parseISO(s) {
  const [y,m,d] = s.split('-').map(Number);
  return { y, m, d };
}
function monthKey(s) { const {y,m} = parseISO(s); return `${y}-${String(m).padStart(2,'0')}`; }
function prevMonthKey(k) {
  const [y,m] = k.split('-').map(Number);
  if (m === 1) return `${y-1}-12`;
  return `${y}-${String(m-1).padStart(2,'0')}`;
}
function labelMonth(k) {
  const [y,m] = k.split('-').map(Number);
  return `${MONTH_NAMES[m-1]} ${y}`;
}
function labelMonthShort(k) {
  const [y,m] = k.split('-').map(Number);
  return `${MONTH_SHORT[m-1]} ${String(y).slice(2)}`;
}
function fmtEUR(n, opts={}) {
  const {showSign=false, compact=false, decimals=2} = opts;
  const abs = Math.abs(n);
  if (compact && abs >= 1000) {
    return (showSign && n>0 ? '+' : '') + new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(n/1000) + 'k €';
  }
  const s = new Intl.NumberFormat('es-ES',{minimumFractionDigits:decimals, maximumFractionDigits:decimals}).format(abs);
  const sign = n < 0 ? '−' : (showSign && n>0 ? '+' : '');
  return `${sign}${s} €`;
}
function fmtRON(n) {
  return new Intl.NumberFormat('es-ES',{minimumFractionDigits:2, maximumFractionDigits:2}).format(n) + ' RON';
}
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function pct(a, b) { if (!b) return 0; return Math.round((a/b)*100); }

// ── Hook: count-up ───────────────────────────────────────────────────────
function useCountUp(target, duration = 900, deps = []) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now(); const start = 0; const end = target;
    const tick = (now) => {
      const t = Math.min(1, (now - t0)/duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setV(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [target, ...deps]);
  return v;
}

// ── KPI card ─────────────────────────────────────────────────────────────
function KpiCard({ label, amount, kind, trend, icon, subtle, sparkline, animateKey, altFootnote }) {
  const value = useCountUp(amount, 900, [animateKey]);
  const positive = kind === 'pos';
  const negative = kind === 'neg';
  const balanceNeg = kind === 'balance' && amount < 0;
  const balancePos = kind === 'balance' && amount >= 0;

  const mainColor = positive || balancePos ? 'var(--pos)' : (negative || balanceNeg ? 'var(--neg)' : 'var(--ink)');
  const softBg = positive ? 'var(--pos-soft)' : (negative || balanceNeg ? 'var(--neg-soft)' : 'var(--surface)');
  const softInk = positive || balancePos ? 'var(--pos-ink)' : (negative || balanceNeg ? 'var(--neg-ink)' : 'var(--ink-2)');

  // trend formatted
  const trendPct = trend?.pct;
  const trendUp = trendPct != null && trendPct >= 0;
  // For expenses, a decrease is good (green)
  const trendGood = kind === 'neg' ? !trendUp : trendUp;

  const displayAmount = kind === 'balance'
    ? (amount < 0 ? '−' : '') + fmtEUR(Math.abs(value), {decimals: 2}).replace('−','')
    : fmtEUR(value, {decimals: 2});

  return (
    <div className="card soft-shadow p-6 flex flex-col gap-5 relative overflow-hidden fade-up" style={{minHeight: 190}}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{background: softBg, color: softInk}}>
            {icon}
          </div>
          <div>
            <div className="text-[13px] ink-2 font-medium">{label}</div>
            <div className="text-[11px] ink-3 mt-0.5">{subtle}</div>
          </div>
        </div>
        {trendPct != null && (
          <div className="chip" style={{
            background: trendGood ? 'var(--pos-soft)' : 'var(--neg-soft)',
            color: trendGood ? 'var(--pos-ink)' : 'var(--neg-ink)',
            borderColor: 'transparent'
          }}>
            {trendUp ? <I.arrowUp size={11}/> : <I.arrowDown size={11}/>}
            <span className="num">{Math.abs(trendPct).toFixed(1)}%</span>
          </div>
        )}
        {trend == null && altFootnote && (
          <div className="chip" style={{padding:'4px 10px'}}>
            <span className="num text-[11px]">{altFootnote.replace(/^Media: /, '⌀ ')}</span>
          </div>
        )}
      </div>

      <div>
        <div className="num font-semibold tracking-tight" style={{fontSize: 38, lineHeight: 1, color: mainColor}}>
          {displayAmount}
        </div>
        <div className="text-[11px] ink-3 mt-2">
          {trend == null
            ? (altFootnote || '\u00a0')
            : <>vs. mes anterior <span className="num">{trend?.prev != null ? fmtEUR(trend.prev, {decimals:0, compact:true}) : '—'}</span></>
          }
        </div>
      </div>

      {sparkline && <SparkLine data={sparkline} color={mainColor}/>}
    </div>
  );
}

// ── Mini sparkline (SVG) ─────────────────────────────────────────────────
function SparkLine({ data, color='var(--ink)', height=36 }) {
  if (!data || data.length < 2) return null;
  const w = 220, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = (max - min) || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v,i)=>`${(i*step).toFixed(2)},${(h - ((v-min)/range)*h*.9 - h*.05).toFixed(2)}`);
  const d = 'M' + pts.join(' L');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="absolute left-0 right-0 bottom-0 opacity-70 pointer-events-none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sparkpath"/>
    </svg>
  );
}

// ── Custom tooltip for recharts ─────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 soft-shadow" style={{borderRadius: 12}}>
      <div className="text-[11px] ink-3 mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="swatch" style={{background: p.color}}/>
          <span className="ink-2">{p.name}</span>
          <span className="num ml-auto font-medium">{fmtEUR(p.value, {decimals: 0})}</span>
        </div>
      ))}
    </div>
  );
}

// ── Line chart: ingresos vs gastos ──────────────────────────────────────
function MonthlyLine({ data }) {
  const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } = window.Recharts;
  return (
    <div style={{height: 260}} className="fade-in">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{top: 10, right: 16, left: -10, bottom: 0}}>
          <defs>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#10b981" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#ef4444" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3"/>
          <XAxis dataKey="label" axisLine={false} tickLine={false} dy={6}/>
          <YAxis axisLine={false} tickLine={false} width={52}
                 tickFormatter={(v)=> v>=1000 ? `${(v/1000).toFixed(1)}k` : v}/>
          <Tooltip content={<ChartTooltip/>} cursor={{stroke: 'var(--border)', strokeDasharray: '3 3'}}/>
          <Area type="monotone" dataKey="income"  name="Ingresos" stroke="#10b981" strokeWidth={2.2} fill="url(#incGrad)"
                dot={{r:3, fill:'var(--bg)', stroke:'#10b981', strokeWidth:1.6}}
                activeDot={{r:5, fill:'#10b981', stroke:'var(--bg)', strokeWidth:2}}/>
          <Area type="monotone" dataKey="expense" name="Gastos"   stroke="#ef4444" strokeWidth={2.2} fill="url(#expGrad)"
                dot={{r:3, fill:'var(--bg)', stroke:'#ef4444', strokeWidth:1.6}}
                activeDot={{r:5, fill:'#ef4444', stroke:'var(--bg)', strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Donut: distribución de gastos ────────────────────────────────────────
function ExpenseDonut({ breakdown, total }) {
  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = window.Recharts;
  const [active, setActive] = useState(null);
  const data = breakdown.map(b => ({ name: b.label, value: b.total, color: b.color, key: b.key }));
  return (
    <div className="flex items-center gap-6 fade-in">
      <div style={{width: 180, height: 180, position: 'relative'}}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}
                 onMouseEnter={(_,i)=>setActive(i)} onMouseLeave={()=>setActive(null)}>
              {data.map((d,i)=>(
                <Cell key={i} fill={d.color} opacity={active===null || active===i ? 1 : 0.35}/>
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] ink-3 uppercase tracking-wider">
            {active!=null ? data[active].name : 'Total'}
          </div>
          <div className="num font-semibold" style={{fontSize: 18, color: 'var(--ink)'}}>
            {active!=null ? fmtEUR(data[active].value, {decimals:0, compact:true}) : fmtEUR(total, {decimals:0, compact:true})}
          </div>
          <div className="text-[10px] ink-3 mt-0.5 num">
            {active!=null ? `${pct(data[active].value, total)}%` : `${breakdown.length} cats.`}
          </div>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-2 text-[12px]">
        {breakdown.map((b, i) => (
          <div key={b.key}
               className="flex items-center gap-2 py-1 rounded-md cursor-default transition"
               style={{opacity: active===null || active===i ? 1 : 0.4}}
               onMouseEnter={()=>setActive(i)}
               onMouseLeave={()=>setActive(null)}>
            <span className="swatch" style={{background: b.color}}/>
            <span className="ink-2 truncate">{b.label}</span>
            <span className="num ml-auto" style={{color: 'var(--ink)'}}>{pct(b.total, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Health bar ──────────────────────────────────────────────────────────
function HealthBar({ income, expense, savingsRate }) {
  // score: 0-100, basado en savings rate (>=25% = 100; <=-10% = 0)
  const score = Math.max(0, Math.min(100, Math.round(((savingsRate + 0.10) / 0.35) * 100)));
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 80);
    return () => clearTimeout(t);
  }, [score]);
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Saludable' : score >= 40 ? 'Estable' : score >= 20 ? 'En alerta' : 'Crítica';
  const labelColor = score >= 60 ? 'var(--pos-ink)' : score >= 40 ? '#a16207' : 'var(--neg-ink)';
  return (
    <div className="flex items-center gap-5">
      <div className="flex-1">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[11px] ink-3 uppercase tracking-wider">Salud financiera</div>
          <div className="text-[11px]" style={{color: labelColor, fontWeight: 600}}>{label}</div>
        </div>
        <div className="health-track">
          <div className="health-fill" style={{width: `${displayed}%`}}/>
        </div>
        <div className="flex justify-between mt-2 text-[10px] ink-3 num">
          <span>Crítica</span><span>En alerta</span><span>Estable</span><span>Saludable</span><span>Excelente</span>
        </div>
      </div>
      <div className="text-right" style={{minWidth: 68}}>
        <div className="num font-semibold tracking-tight" style={{fontSize: 34, lineHeight: 1}}>{displayed}</div>
        <div className="text-[10px] ink-3 uppercase tracking-wider mt-1">/ 100</div>
      </div>
    </div>
  );
}

// ── Category badge ──────────────────────────────────────────────────────
function CatBadge({ catKey, size = 'md' }) {
  const c = CATEGORIES[catKey];
  if (!c) return null;
  const Icn = I[c.icon] || I.more;
  const s = size === 'sm' ? 28 : 34;
  return (
    <div className="rounded-xl flex items-center justify-center shrink-0"
         style={{width: s, height: s, background: `${c.color}14`, color: c.color}}>
      <Icn size={size==='sm'?14:16}/>
    </div>
  );
}

// ── Transaction row ─────────────────────────────────────────────────────
function TxRow({ tx, onDelete }) {
  const isIncome = tx.type === 'income';
  const cat = CATEGORIES[tx.category];
  const { y, m, d } = parseISO(tx.date);
  const dateLabel = `${String(d).padStart(2,'0')} ${MONTH_SHORT[m-1]}`;
  return (
    <div className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg transition hover:bg-[var(--surface)] group">
      <CatBadge catKey={tx.category} size="sm"/>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium truncate" style={{color: 'var(--ink)'}}>{tx.concept}</div>
        <div className="text-[11px] ink-3 mt-0.5 flex items-center">
          <span>{cat?.label || 'Otros'}</span>
          <span className="dot-sep"/>
          <span className="num">{dateLabel}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="num font-medium" style={{color: isIncome ? 'var(--pos-ink)' : 'var(--ink)', fontSize: 13}}>
          {isIncome ? '+' : '−'}{fmtEUR(tx.amount, {decimals: 2}).replace('−','')}
        </div>
        <div className="num text-[10px] ink-3 mt-0.5">
          {fmtRON(tx.amount * EUR_TO_RON)}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={()=>onDelete(tx.id)}
          className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-md hover:bg-[var(--surface-2)]"
          title="Eliminar"
          aria-label="Eliminar">
          <I.trash size={14} className="ink-3"/>
        </button>
      )}
    </div>
  );
}

// ── Tips carousel ───────────────────────────────────────────────────────
function TipsCarousel({ tips }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (tips.length <= 1) return;
    const t = setInterval(()=>setIdx(i => (i+1) % tips.length), 6500);
    return () => clearInterval(t);
  }, [tips.length]);
  const tip = tips[idx] || {};
  return (
    <div className="card p-6 relative overflow-hidden fade-up" style={{minHeight: 180}}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background: 'var(--surface-2)'}}>
            <I.lightbulb size={15}/>
          </div>
          <div className="text-[12px] font-medium ink-2 uppercase tracking-wider">Tip financiero</div>
        </div>
        <div className="text-[10px] ink-3 num">{idx+1} / {tips.length}</div>
      </div>
      <div key={idx} className="fade-in">
        <div className="serif text-[22px] leading-[1.25] font-medium mb-2" style={{color: 'var(--ink)'}}>
          {tip.title}
        </div>
        <div className="text-[13px] ink-2 leading-relaxed">{tip.body}</div>
      </div>
      <div className="flex items-center justify-between mt-5">
        <div className="flex gap-1.5">
          {tips.map((_,i)=>(
            <div key={i} className="tip-dot" data-active={i===idx} onClick={()=>setIdx(i)} style={{cursor:'pointer'}}/>
          ))}
        </div>
        <button className="btn-ghost text-[12px] flex items-center gap-1.5"
                onClick={()=>setIdx((idx+1)%tips.length)}>
          Siguiente <I.chevRight size={12}/>
        </button>
      </div>
    </div>
  );
}

// ── Month dropdown ──────────────────────────────────────────────────────
function MonthDropdown({ value, options, onChange, includeAll=false, allLabel='Todos los meses registrados' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const isAll = value === 'all';
  const labelFor = (k) => k === 'all' ? allLabel : labelMonth(k);
  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost flex items-center gap-2 min-w-[220px] justify-between"
              onClick={()=>setOpen(!open)}>
        <span className="flex items-center gap-2">
          {isAll ? <I.sparkles size={14} className="ink-3"/> : <I.calendar size={14} className="ink-3"/>}
          <span className="font-medium" style={{color: 'var(--ink)'}}>{labelFor(value)}</span>
        </span>
        <I.chevDown size={14} className="ink-3" style={{transform: open?'rotate(180deg)':'none', transition:'transform .2s'}}/>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 card soft-shadow z-30 scale-in" style={{minWidth: 240, maxHeight: 320, overflowY: 'auto', padding: 6}}>
          {includeAll && (
            <>
              <button
                onClick={()=>{onChange('all'); setOpen(false);}}
                className="w-full text-left px-3 py-2 text-[13px] rounded-md transition hover:bg-[var(--surface)] flex items-center gap-2"
                style={{color: isAll ? 'var(--ink)' : 'var(--ink-2)', fontWeight: isAll?600:500}}>
                <I.sparkles size={13} className="ink-3"/>
                {allLabel}
              </button>
              <div style={{height:1, background:'var(--border)', margin:'6px 8px'}}/>
            </>
          )}
          {options.map(k => (
            <button key={k}
                    onClick={()=>{onChange(k); setOpen(false);}}
                    className="w-full text-left px-3 py-2 text-[13px] rounded-md transition hover:bg-[var(--surface)]"
                    style={{color: k===value ? 'var(--ink)' : 'var(--ink-2)', fontWeight: k===value?600:400}}>
              {labelMonth(k)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  FZ_UI: {
    MONTH_NAMES, MONTH_SHORT, DAY_NAMES,
    parseISO, monthKey, prevMonthKey, labelMonth, labelMonthShort,
    fmtEUR, fmtRON, daysInMonth, pct,
    useCountUp,
    KpiCard, SparkLine, ChartTooltip,
    MonthlyLine, ExpenseDonut, HealthBar,
    CatBadge, TxRow, TipsCarousel, MonthDropdown,
  }
});
