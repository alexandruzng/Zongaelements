// ─── Fianzas: Goals view ─────────────────────────────────────────────────

const GUI = window.FZ_UI;
const GI  = window.FZ_Icon;
const { useState: useStateG, useEffect: useEffectG } = React;

const ACCENT_OPTIONS = ['#ef4444','#f97316','#eab308','#10b981','#14b8a6','#3b82f6','#6366f1','#8b5cf6','#ec4899','#78716c'];

// ── Modal nueva meta ─────────────────────────────────────────────────────
function NewGoalModal({ open, onClose, onSave }) {
  const [name,    setName]    = useStateG('');
  const [target,  setTarget]  = useStateG('');
  const [current, setCurrent] = useStateG('');
  const [accent,  setAccent]  = useStateG('#10b981');
  const [saving,  setSaving]  = useStateG(false);

  useEffectG(() => {
    if (!open) return;
    setName(''); setTarget(''); setCurrent(''); setAccent('#10b981'); setSaving(false);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const targetNum  = parseFloat(String(target).replace(',','.'));
  const currentNum = parseFloat(String(current).replace(',','.')) || 0;
  const canSave = name.trim().length >= 2 && !isNaN(targetNum) && targetNum > 0;

  const submit = () => {
    if (!canSave) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        id: 'g-' + Date.now(),
        name: name.trim(),
        target: targetNum,
        current: Math.min(currentNum, targetNum),
        accent,
        emojiPlaceholder: name.trim().slice(0,2).toUpperCase(),
      });
      setSaving(false);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop fade-in"
         onClick={onClose}>
      <div className="card scale-in" style={{width: 480, maxWidth:'100%'}}
           onClick={(e)=>e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 pb-5 relative" style={{background:'var(--pos-soft)', borderTopLeftRadius:20, borderTopRightRadius:20, borderBottom:'1px solid #10b98122'}}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider" style={{color:'var(--pos-ink)'}}>Nueva meta</div>
              <div className="serif text-[24px] font-medium mt-1" style={{color:'var(--ink)', lineHeight:1.1}}>Crear objetivo de ahorro</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg)] transition"><GI.x size={16}/></button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Nombre */}
          <div>
            <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Nombre del objetivo</label>
            <input type="text" className="input mt-1.5"
                   placeholder="Ej. Viaje a Japón, Fondo de emergencia…"
                   value={name} onChange={(e)=>setName(e.target.value)}/>
            {name.length > 0 && name.trim().length < 2 && (
              <div className="text-[11px] mt-1" style={{color:'var(--neg-ink)'}}>Mínimo 2 caracteres</div>
            )}
          </div>

          {/* Objetivo y actual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Importe objetivo (€)</label>
              <input type="text" inputMode="decimal" className="input num mt-1.5"
                     style={{fontWeight:600, fontSize:18}}
                     placeholder="0,00"
                     value={target} onChange={(e)=>setTarget(e.target.value.replace(/[^0-9.,]/g,''))}/>
            </div>
            <div>
              <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Ya ahorrado (€)</label>
              <input type="text" inputMode="decimal" className="input num mt-1.5"
                     style={{fontWeight:600, fontSize:18}}
                     placeholder="0,00"
                     value={current} onChange={(e)=>setCurrent(e.target.value.replace(/[^0-9.,]/g,''))}/>
            </div>
          </div>

          {/* Progreso preview */}
          {canSave && (
            <div className="fade-in">
              <div className="flex justify-between text-[11px] ink-3 mb-1.5">
                <span>Progreso actual</span>
                <span className="num">{Math.round((Math.min(currentNum,targetNum)/targetNum)*100)}%</span>
              </div>
              <div className="health-track" style={{height:8}}>
                <div style={{
                  width: `${Math.min(100, Math.round((currentNum/targetNum)*100))}%`,
                  height:'100%', background: accent, borderRadius:999,
                  transition:'width .6s cubic-bezier(.2,.8,.2,1)'
                }}/>
              </div>
            </div>
          )}

          {/* Color acento */}
          <div>
            <label className="text-[11px] ink-3 uppercase tracking-wider font-medium">Color</label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {ACCENT_OPTIONS.map(c => (
                <button key={c} type="button"
                        onClick={()=>setAccent(c)}
                        style={{
                          width:28, height:28, borderRadius:8, background:c, cursor:'pointer',
                          border: accent===c ? `3px solid var(--ink)` : '2px solid transparent',
                          outline: accent===c ? '2px solid var(--bg)' : 'none',
                          outlineOffset: accent===c ? '-4px' : 0,
                          transition:'all .15s ease',
                        }}/>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
            <button type="button"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={!canSave || saving}
                    style={{opacity: (!canSave||saving)?0.4:1, cursor:(!canSave||saving)?'not-allowed':'pointer'}}
                    onClick={submit}>
              {saving
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Guardando…</>
                : <><GI.check size={14}/> Crear meta</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Goals view ───────────────────────────────────────────────────────────
function GoalsView({ state, actions, derived }) {
  const { goals } = state;
  const [modalOpen, setModalOpen] = useStateG(false);

  const totalCurrent = goals.reduce((s,g)=>s+g.current, 0);
  const totalTarget  = goals.reduce((s,g)=>s+g.target,  0);

  return (
    <div className="fade-up">
      <div className="card soft-shadow p-6 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Metas de ahorro</div>
            <div className="serif text-[28px] font-medium mt-0.5" style={{lineHeight:1.1}}>Tus objetivos</div>
            <div className="text-[12px] ink-2 mt-1">
              {goals.length === 0
                ? 'Aún no tienes metas. ¡Crea tu primera!'
                : <>Llevas ahorrado <span className="num" style={{color:'var(--ink)', fontWeight:600}}>{GUI.fmtEUR(totalCurrent, {decimals:0})}</span> de <span className="num">{GUI.fmtEUR(totalTarget, {decimals:0})}</span> objetivo total</>
              }
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost text-[12px]" onClick={()=>actions.exportCSV()}>
              <GI.download size={12} className="inline mr-1.5 -mt-0.5"/> Exportar CSV
            </button>
            <button className="btn-primary flex items-center gap-1.5 text-[13px]"
                    style={{padding:'10px 16px'}}
                    onClick={()=>setModalOpen(true)}>
              <GI.plus size={14}/> Nueva meta
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="card soft-shadow p-12 mb-5 flex flex-col items-center text-center fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
               style={{background:'var(--surface-2)'}}>
            <GI.target size={26} className="ink-3"/>
          </div>
          <div className="serif text-[22px] font-medium mb-2">Sin metas todavía</div>
          <div className="ink-2 text-[13px] max-w-[340px] mb-6">
            Define un objetivo —un viaje, un fondo de emergencia, un gadget— y haz un seguimiento de tu progreso mes a mes.
          </div>
          <button className="btn-primary flex items-center gap-2"
                  onClick={()=>setModalOpen(true)}>
            <GI.plus size={14}/> Crear mi primera meta
          </button>
        </div>
      )}

      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g}
                      onUpdate={actions.updateGoal}
                      onDelete={actions.deleteGoal}/>
          ))}
          {/* Add card */}
          <button
            onClick={()=>setModalOpen(true)}
            className="card p-5 fade-up flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition"
            style={{minHeight:200, border:'2px dashed var(--border)', background:'var(--bg)', borderRadius:20}}
            onMouseEnter={(e)=>{e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.background='var(--surface)';}}
            onMouseLeave={(e)=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg)';}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{background:'var(--surface-2)'}}>
              <GI.plus size={18} className="ink-3"/>
            </div>
            <div className="text-[13px] ink-2 font-medium">Añadir nueva meta</div>
          </button>
        </div>
      )}

      {/* Resumen anual */}
      {derived.fullSeries.length > 0 && (
        <div className="card soft-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] ink-3 uppercase tracking-wider font-medium">Año en curso</div>
              <div className="serif text-[20px] font-medium mt-0.5">Resumen mensual completo</div>
            </div>
          </div>
          <YearSummaryTable series={derived.fullSeries}/>
        </div>
      )}

      <NewGoalModal open={modalOpen} onClose={()=>setModalOpen(false)} onSave={actions.addGoal}/>
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }) {
  const pct = Math.min(100, Math.round((goal.current/goal.target)*100));
  const remaining = Math.max(0, goal.target - goal.current);
  const [editing, setEditing] = useStateG(false);
  const [add,     setAdd]     = useStateG('');

  return (
    <div className="card soft-shadow p-5 fade-up relative overflow-hidden group" style={{minHeight: 200}}>
      {/* Delete button */}
      <button
        onClick={()=>{ if(confirm(`¿Eliminar la meta "${goal.name}"?`)) onDelete(goal.id); }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-md hover:bg-[var(--surface-2)]"
        title="Eliminar meta" aria-label="Eliminar">
        <GI.trash size={13} className="ink-3"/>
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center num font-bold text-[12px]"
             style={{background:`${goal.accent}14`, color:goal.accent, letterSpacing:0}}>
          {goal.emojiPlaceholder}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium truncate pr-6">{goal.name}</div>
          <div className="text-[11px] ink-3 num">
            {GUI.fmtEUR(goal.current, {decimals:0})} / {GUI.fmtEUR(goal.target, {decimals:0})}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <RingProgress pct={pct} color={goal.accent}/>
        <div className="flex-1">
          <div className="text-[10px] ink-3 uppercase tracking-wider">Faltan</div>
          <div className="num font-semibold" style={{fontSize:20}}>
            {remaining <= 0 ? <span style={{color:'var(--pos-ink)'}}>¡Conseguido!</span> : GUI.fmtEUR(remaining, {decimals:0})}
          </div>
          {remaining > 0 && (
            !editing ? (
              <button className="btn-ghost text-[11px] mt-2" style={{padding:'6px 10px'}}
                      onClick={()=>setEditing(true)}>
                Aportar ahorro
              </button>
            ) : (
              <div className="flex items-center gap-1.5 mt-2">
                <input className="input num" style={{height:30, fontSize:12, width:80, padding:'4px 8px'}}
                       placeholder="€" value={add}
                       autoFocus
                       onChange={(e)=>setAdd(e.target.value.replace(/[^0-9.,]/g,''))}
                       onKeyDown={(e)=>{
                         if (e.key==='Enter') {
                           const v=parseFloat(String(add).replace(',','.'));
                           if(!isNaN(v)&&v>0) onUpdate(goal.id, goal.current+v);
                           setEditing(false); setAdd('');
                         } else if (e.key==='Escape') { setEditing(false); setAdd(''); }
                       }}/>
                <button className="btn-primary" style={{height:30, padding:'0 10px', fontSize:12}}
                        onClick={()=>{
                          const v=parseFloat(String(add).replace(',','.'));
                          if(!isNaN(v)&&v>0) onUpdate(goal.id, goal.current+v);
                          setEditing(false); setAdd('');
                        }}>OK</button>
                <button className="btn-ghost" style={{height:30, padding:'0 8px', fontSize:12}}
                        onClick={()=>{setEditing(false); setAdd('');}}>✕</button>
              </div>
            )
          )}
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:goal.accent}}/>
    </div>
  );
}

function RingProgress({ pct, color, size=72 }) {
  const r = (size-8)/2;
  const c = 2*Math.PI*r;
  const offset = c - (pct/100)*c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{transition:'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)'}}/>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
            fontFamily="JetBrains Mono" fontWeight="600" fontSize="14" fill="var(--ink)">
        {pct}%
      </text>
    </svg>
  );
}

function YearSummaryTable({ series }) {
  const rows = [...series].reverse().slice(0,12).reverse();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{borderBottom:'1px solid var(--border)'}}>
            <th className="text-left py-2 text-[10px] ink-3 uppercase tracking-wider font-medium">Mes</th>
            <th className="text-right py-2 text-[10px] ink-3 uppercase tracking-wider font-medium">Ingresos</th>
            <th className="text-right py-2 text-[10px] ink-3 uppercase tracking-wider font-medium">Gastos</th>
            <th className="text-right py-2 text-[10px] ink-3 uppercase tracking-wider font-medium">Balance</th>
            <th className="text-right py-2 text-[10px] ink-3 uppercase tracking-wider font-medium">Tasa ahorro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const bal = r.income-r.expense;
            const rate = r.income>0 ? (bal/r.income) : 0;
            return (
              <tr key={r.key} className="transition hover:bg-[var(--surface)]"
                  style={{borderBottom:'1px solid var(--border)'}}>
                <td className="py-3 font-medium">{GUI.labelMonth(r.key)}</td>
                <td className="py-3 text-right num" style={{color:'var(--pos-ink)'}}>{GUI.fmtEUR(r.income, {decimals:0})}</td>
                <td className="py-3 text-right num" style={{color:'var(--neg-ink)'}}>{GUI.fmtEUR(r.expense, {decimals:0})}</td>
                <td className="py-3 text-right num font-medium" style={{color:bal>=0?'var(--pos)':'var(--neg)'}}>
                  {bal<0?'−':''}{GUI.fmtEUR(Math.abs(bal),{decimals:0}).replace('−','')}
                </td>
                <td className="py-3 text-right num ink-2">{Math.round(rate*100)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

window.FZ_Goals = { GoalsView };
