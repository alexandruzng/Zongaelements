// ── Pages: Summary, Statistics, Letters, Multimedia, Objectives ──

// ═══════════════════════════════════════════
// SUMMARY PAGE
// ═══════════════════════════════════════════
function SummaryPage({ entries }) {
  const today = new Date();

  const currentMonthEntries = Object.entries(entries).filter(([k]) => {
    const p = parseKey(k); return p.y === today.getFullYear() && p.m === today.getMonth();
  });
  const monthAvg = currentMonthEntries.length > 0
    ? (currentMonthEntries.reduce((s,[,e]) => s + e.rating, 0) / currentMonthEntries.length).toFixed(1) : '—';
  const currentYearEntries = Object.entries(entries).filter(([k]) => parseKey(k).y === today.getFullYear());
  const yearAvg = currentYearEntries.length > 0
    ? (currentYearEntries.reduce((s,[,e]) => s + e.rating, 0) / currentYearEntries.length).toFixed(1) : '—';

  // Memory from 1 month ago
  const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const memoryKey = dateKey(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), oneMonthAgo.getDate());
  const memory = entries[memoryKey];

  // Recent trend
  const recentEntries = Object.entries(entries)
    .filter(([k]) => { const d = new Date(k); return (today - d) / 86400000 >= 0 && (today - d) / 86400000 <= 30; })
    .sort(([a],[b]) => a.localeCompare(b));
  const last7 = recentEntries.slice(-7);
  const first7 = recentEntries.slice(0, 7);
  let trendMsg = '', trendIcon = '📊';
  if (last7.length >= 3 && first7.length >= 3) {
    const rAvg = last7.reduce((s,[,e]) => s + e.rating, 0) / last7.length;
    const eAvg = first7.reduce((s,[,e]) => s + e.rating, 0) / first7.length;
    if (rAvg > eAvg + 0.5) { trendMsg = '¡Estás mejorando! Tu puntuación media ha subido.'; trendIcon = '📈'; }
    else if (rAvg < eAvg - 0.5) { trendMsg = 'Los últimos días han sido más difíciles. ¡Ánimo!'; trendIcon = '📉'; }
    else { trendMsg = 'Tu estado de ánimo se mantiene estable.'; trendIcon = '📊'; }
  }

  const bestDay = currentMonthEntries.length > 0 ? currentMonthEntries.reduce((b, c) => c[1].rating > b[1].rating ? c : b) : null;
  const worstDay = currentMonthEntries.length > 0 ? currentMonthEntries.reduce((w, c) => c[1].rating < w[1].rating ? c : w) : null;

  // Achievement rate this month
  const achievedDays = currentMonthEntries.filter(([,e]) => e.achieved === true).length;
  const totalTracked = currentMonthEntries.filter(([,e]) => e.achieved !== null && e.achieved !== undefined).length;
  const achieveRate = totalTracked > 0 ? Math.round((achievedDays / totalTracked) * 100) : null;

  // Mini bar chart of last 14 days
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    last14.push({ key: k, entry: entries[k] || null, day: d.getDate() });
  }

  return (
    <div>
      <SectionHeader title="Resumen" icon="📋" subtitle={`${MONTHS_ES[today.getMonth()]} ${today.getFullYear()}`} />

      {/* Stats */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <StatBubble label="Media mensual" value={monthAvg} color={monthAvg !== '—' ? ratingColor(Math.round(parseFloat(monthAvg))) : '#ccc'} sub={MONTHS_ES[today.getMonth()]} icon="📅" />
        <StatBubble label="Media anual" value={yearAvg} color={yearAvg !== '—' ? ratingColor(Math.round(parseFloat(yearAvg))) : '#ccc'} sub={String(today.getFullYear())} icon="🗓️" />
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <StatBubble label="Días escritos" value={currentMonthEntries.length} sub={`de ${new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()}`} icon="✍️" />
        {achieveRate !== null && <StatBubble label="Propósitos cumplidos" value={`${achieveRate}%`} color={achieveRate >= 70 ? '#22c55e' : achieveRate >= 40 ? '#eab308' : '#ef4444'} icon="🎯" />}
      </div>

      {/* Mini chart */}
      <GlassCard style={{ padding:'20px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#aaa', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>Últimos 14 días</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
          {last14.map((d, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <div style={{
                width:'100%', borderRadius:6, background: d.entry ? ratingColor(d.entry.rating) : '#f0f0f0',
                height: d.entry ? `${d.entry.rating * 7}px` : '4px',
                transition:'height .3s ease', minHeight:4, opacity: d.entry ? 0.8 : 0.3
              }} />
              <span style={{ fontSize:8, color:'#ccc' }}>{d.day}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Trend */}
      {trendMsg && (
        <GlassCard style={{ padding:'18px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>{trendIcon}</span>
          <div style={{ fontSize:14, color:'#555', lineHeight:1.5 }}>{trendMsg}</div>
        </GlassCard>
      )}

      {/* Best / Worst */}
      {bestDay && worstDay && bestDay[0] !== worstDay[0] && (
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <GlassCard style={{ flex:'1 1 140px', padding:'16px 20px', background:'linear-gradient(135deg, #d1fae5, #a7f3d020)' }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>🌟 Mejor día</div>
            <div style={{ fontSize:24, fontWeight:700, fontFamily:"'DM Serif Display', serif", color:'#22c55e' }}>{bestDay[1].rating}/10</div>
            <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{formatDateShort(bestDay[0])}</div>
          </GlassCard>
          <GlassCard style={{ flex:'1 1 140px', padding:'16px 20px', background:'linear-gradient(135deg, #fecaca, #fca5a520)' }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>💪 Más difícil</div>
            <div style={{ fontSize:24, fontWeight:700, fontFamily:"'DM Serif Display', serif", color:'#ef4444' }}>{worstDay[1].rating}/10</div>
            <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{formatDateShort(worstDay[0])}</div>
          </GlassCard>
        </div>
      )}

      {/* Memory from 1 month ago */}
      {memory && (
        <GlassCard style={{ padding:'20px', marginBottom:16, background:'linear-gradient(135deg, #ede9fe, #ddd6fe20)' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#7c3aed', marginBottom:10 }}>🕰️ Recuerdo de hace 1 mes</div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <span style={{ fontSize:28 }}>{ratingEmoji(memory.rating)}</span>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#333' }}>{memory.rating}/10</div>
              <div style={{ fontSize:12, color:'#aaa' }}>{formatDateShort(memoryKey)}</div>
            </div>
          </div>
          {memory.photos?.[0] && <img src={memory.photos[0]} style={{ width:'100%', maxHeight:120, objectFit:'cover', borderRadius:12, marginBottom:8 }} />}
          {memory.text && <div style={{ fontSize:13, lineHeight:1.6, color:'#666' }}>{memory.text.slice(0, 200)}{memory.text.length > 200 ? '...' : ''}</div>}
        </GlassCard>
      )}

      {Object.keys(entries).length === 0 && <EmptyState icon="📝" text="Empieza a escribir para ver tu resumen" />}
    </div>
  );
}

// ═══════════════════════════════════════════
// STATISTICS PAGE
// ═══════════════════════════════════════════
function StatisticsPage({ entries }) {
  const today = new Date();
  const allEntries = Object.entries(entries);

  if (allEntries.length === 0) return (
    <div><SectionHeader title="Estadísticas" icon="📊" /><EmptyState icon="📊" text="Necesitas al menos unas entradas para ver estadísticas" /></div>
  );

  // Happiest day of week
  const dayTotals = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);
  allEntries.forEach(([k, e]) => {
    const dow = new Date(k).getDay();
    dayTotals[dow] += e.rating;
    dayCounts[dow]++;
  });
  const dayAvgs = dayTotals.map((t, i) => dayCounts[i] > 0 ? t / dayCounts[i] : 0);
  const happiestDow = dayAvgs.indexOf(Math.max(...dayAvgs));

  // Monthly ranking
  const monthlyData = {};
  allEntries.forEach(([k, e]) => {
    const p = parseKey(k);
    const mk = `${p.y}-${p.m}`;
    if (!monthlyData[mk]) monthlyData[mk] = { total: 0, count: 0, y: p.y, m: p.m };
    monthlyData[mk].total += e.rating;
    monthlyData[mk].count++;
  });
  const monthlyRanking = Object.values(monthlyData)
    .map(m => ({ ...m, avg: m.total / m.count }))
    .sort((a, b) => b.avg - a.avg);

  // Word frequency
  const wordFreq = {};
  const stopWords = new Set(['de','la','el','en','un','una','que','y','a','los','las','del','por','con','no','me','mi','se','al','lo','es','le','ha','su','más','muy','ya','pero','para','fue','como','sin','sobre','este','todo','está','son','eso','era','hay','hoy','bien','ser','día','sido','tiene','tengo','hemos','tener','hacer']);
  allEntries.forEach(([, e]) => {
    if (!e.text) return;
    e.text.toLowerCase().replace(/[^a-záéíóúñü\s]/g, '').split(/\s+/).forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);
  const maxFreq = topWords.length > 0 ? topWords[0][1] : 1;

  // Achievement stats
  const achievedEntries = allEntries.filter(([, e]) => e.achieved !== null && e.achieved !== undefined);
  const achievedYes = achievedEntries.filter(([, e]) => e.achieved === true).length;
  const achievedNo = achievedEntries.filter(([, e]) => e.achieved === false).length;

  // Monthly color mosaic
  const currentMonthEntries = allEntries.filter(([k]) => {
    const p = parseKey(k); return p.y === today.getFullYear() && p.m === today.getMonth();
  }).sort(([a],[b]) => a.localeCompare(b));

  return (
    <div>
      <SectionHeader title="Estadísticas" icon="📊" subtitle="Análisis de tu diario" />

      {/* Happiest day of week */}
      <GlassCard style={{ padding:'20px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#aaa', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Día más feliz de la semana</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100 }}>
          {DAYS_FULL.map((name, i) => {
            // Sunday=0 in JS
            const avg = dayAvgs[i];
            const isHappiest = i === happiestDow && avg > 0;
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:10, fontWeight:600, color: isHappiest ? ratingColor(Math.round(avg)) : '#bbb' }}>
                  {avg > 0 ? avg.toFixed(1) : ''}
                </span>
                <div style={{
                  width:'100%', borderRadius:8, minHeight:6,
                  height: avg > 0 ? `${avg * 8}px` : '6px',
                  background: isHappiest ? `linear-gradient(to top, ${ratingColor(Math.round(avg))}, ${ratingColor(Math.round(avg))}90)` : '#f0f0f0',
                  transition:'height .4s ease'
                }} />
                <span style={{ fontSize:9, color:'#bbb', fontWeight:500 }}>{name.slice(0,3)}</span>
              </div>
            );
          })}
        </div>
        {dayAvgs[happiestDow] > 0 && (
          <div style={{ marginTop:12, fontSize:13, color:'#555', textAlign:'center' }}>
            Los <strong>{DAYS_FULL[happiestDow].toLowerCase()}s</strong> son tu día más feliz con una media de <strong>{dayAvgs[happiestDow].toFixed(1)}</strong>
          </div>
        )}
      </GlassCard>

      {/* Achievement tracking */}
      {achievedEntries.length > 0 && (
        <GlassCard style={{ padding:'20px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#aaa', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Propósitos cumplidos</div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ position:'relative', width:80, height:80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f0f0f0" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#22c55e" strokeWidth="6"
                  strokeDasharray={`${(achievedYes / achievedEntries.length) * 213.6} 213.6`}
                  strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition:'stroke-dasharray .5s ease' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>
                {Math.round((achievedYes / achievedEntries.length) * 100)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize:14, color:'#333', marginBottom:4 }}><span style={{ color:'#22c55e', fontWeight:700 }}>{achievedYes}</span> días cumplidos</div>
              <div style={{ fontSize:14, color:'#333' }}><span style={{ color:'#ef4444', fontWeight:700 }}>{achievedNo}</span> días sin cumplir</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:4 }}>{achievedEntries.length} días registrados</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Word Cloud */}
      {topWords.length > 0 && (
        <GlassCard style={{ padding:'20px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#aaa', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Palabras más usadas</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
            {topWords.map(([word, count]) => {
              const size = 12 + (count / maxFreq) * 18;
              const opacity = 0.4 + (count / maxFreq) * 0.6;
              const hue = Math.floor((count / maxFreq) * 280);
              return (
                <span key={word} style={{
                  fontSize:size, fontWeight: count > maxFreq * 0.5 ? 700 : 500,
                  color:`oklch(0.55 0.12 ${hue})`, opacity, padding:'2px 6px',
                  transition:'transform .2s', cursor:'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                >{word}</span>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Monthly Ranking */}
      {monthlyRanking.length > 1 && (
        <GlassCard style={{ padding:'20px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#aaa', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Ranking de meses</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {monthlyRanking.slice(0, 6).map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:16, fontWeight:700, color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#ddd', width:24 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#333' }}>{MONTHS_ES[m.m]} {m.y}</div>
                  <div style={{ height:6, borderRadius:3, background:'#f0f0f0', marginTop:4 }}>
                    <div style={{ height:6, borderRadius:3, background:ratingColor(Math.round(m.avg)), width:`${m.avg * 10}%`, transition:'width .4s ease' }} />
                  </div>
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:ratingColor(Math.round(m.avg)) }}>{m.avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Color Mosaic */}
      {currentMonthEntries.some(([,e]) => e.dayColors && !e.dayColors.every(c => c === '#e5e5e5')) && (
        <GlassCard style={{ padding:'20px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#aaa', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Mosaico de colores del mes</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(30px, 1fr))', gap:4 }}>
            {currentMonthEntries.map(([k, e]) => {
              if (!e.dayColors || e.dayColors.every(c => c === '#e5e5e5')) return null;
              return (
                <div key={k} style={{ aspectRatio:'1', borderRadius:8, overflow:'hidden', display:'flex' }}>
                  {e.dayColors.map((c, i) => <div key={i} style={{ flex:1, background:c }} />)}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// LETTERS PAGE
// ═══════════════════════════════════════════
function LettersPage({ letters, onCreateLetter }) {
  const [showCreator, setShowCreator] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [unlockDate, setUnlockDate] = React.useState('');

  const handleCreate = () => {
    if (!title.trim() || !content.trim() || !unlockDate) return;
    onCreateLetter({ id: Date.now().toString(), title: title.trim(), content: content.trim(), unlockDate, createdAt: new Date().toISOString().split('T')[0] });
    setTitle(''); setContent(''); setUnlockDate(''); setShowCreator(false);
  };

  const [openLetter, setOpenLetter] = React.useState(null);

  return (
    <div>
      <SectionHeader title="Cartas para mi yo del futuro" icon="💌" subtitle="Escríbete al futuro" action={() => setShowCreator(true)} actionLabel="+ Nueva carta" />

      {letters.length === 0 && <EmptyState icon="✉️" text="Aún no has escrito ninguna carta. ¡Escríbete al futuro!" />}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {letters.map(letter => {
          const days = daysUntil(letter.unlockDate);
          const isUnlocked = days <= 0;
          return (
            <GlassCard key={letter.id} hover onClick={() => isUnlocked ? setOpenLetter(letter) : null}
              style={{
                padding:'20px', position:'relative', overflow:'hidden',
                background: isUnlocked ? 'linear-gradient(135deg, #fef3c7, #fde68a30)' : '#fafafa',
                cursor: isUnlocked ? 'pointer' : 'default',
              }}>
              {!isUnlocked && (
                <div style={{ position:'absolute', inset:0, backdropFilter:'blur(0px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:2, background:'rgba(250,250,250,0.5)' }}>
                  <span style={{ fontSize:36, marginBottom:8 }}>🔒</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#888' }}>Faltan {days} días</span>
                  <span style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{letter.unlockDate}</span>
                </div>
              )}
              <div style={{ opacity: isUnlocked ? 1 : 0.3 }}>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:"'DM Serif Display', serif", marginBottom:4 }}>{letter.title}</div>
                {isUnlocked && <div style={{ fontSize:13, color:'#666', lineHeight:1.6 }}>{letter.content.slice(0, 100)}...</div>}
                <div style={{ fontSize:11, color:'#aaa', marginTop:8 }}>Escrita el {letter.createdAt}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Creator */}
      {showCreator && (
        <Overlay onClose={() => setShowCreator(false)}>
          <div style={{ padding:'28px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <span style={{ fontSize:28 }}>✉️</span>
              <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>Nueva carta</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Título</div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Para mi yo de..."
                style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #eee', borderRadius:14, fontSize:15, outline:'none' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Contenido</div>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Querido yo del futuro..."
                style={{ width:'100%', minHeight:140, border:'1.5px solid #eee', borderRadius:14, padding:'14px 16px', fontSize:15, lineHeight:1.6, resize:'vertical', outline:'none' }} />
            </div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Fecha de desbloqueo</div>
              <input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #eee', borderRadius:14, fontSize:15, outline:'none' }} />
            </div>
            <button onClick={handleCreate} style={{
              width:'100%', padding:'16px', background:'#1a1a1a', color:'#fff', border:'none', borderRadius:16,
              fontSize:15, fontWeight:600, cursor:'pointer', opacity: (title && content && unlockDate) ? 1 : 0.4
            }}>Crear carta</button>
          </div>
        </Overlay>
      )}

      {/* Open letter reader */}
      {openLetter && (
        <Overlay onClose={() => setOpenLetter(null)}>
          <div style={{ padding:'28px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:12, color:'#aaa', marginBottom:4 }}>Escrita el {openLetter.createdAt}</div>
                <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>{openLetter.title}</div>
              </div>
              <button onClick={() => setOpenLetter(null)} style={{ background:'#f5f5f5', border:'none', borderRadius:12, width:36, height:36, cursor:'pointer', fontSize:16, color:'#999', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ fontSize:15, lineHeight:1.8, color:'#444', whiteSpace:'pre-wrap', background:'#fafafa', borderRadius:16, padding:'20px' }}>
              {openLetter.content}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// MULTIMEDIA PAGE
// ═══════════════════════════════════════════
function MultimediaPage({ entries }) {
  const mediaItems = [];
  Object.entries(entries).forEach(([k, e]) => {
    if (e.photos?.length > 0) {
      e.photos.forEach((p, i) => mediaItems.push({ key: k, src: p, idx: i, rating: e.rating }));
    }
  });
  mediaItems.sort((a, b) => b.key.localeCompare(a.key));

  const [selected, setSelected] = React.useState(null);

  return (
    <div>
      <SectionHeader title="Multimedia" icon="📸" subtitle={`${mediaItems.length} archivos`} />

      {mediaItems.length === 0 && <EmptyState icon="📸" text="Añade fotos y vídeos a tus entradas para verlos aquí" />}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:8 }}>
        {mediaItems.map((item, i) => (
          <div key={i} onClick={() => setSelected(item)}
            style={{ position:'relative', aspectRatio:'1', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'transform .2s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          >
            {item.src.startsWith('data:video') ? (
              <video src={item.src} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <img src={item.src} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            )}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px', background:'linear-gradient(transparent, rgba(0,0,0,0.6))', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#fff', fontWeight:600 }}>{formatDateShort(item.key)}</span>
              <span style={{ fontSize:11, color:'#fff' }}>{ratingEmoji(item.rating)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:300,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          animation:'dFadeIn .2s ease'
        }}>
          <div style={{ maxWidth:'90vw', maxHeight:'85vh' }}>
            {selected.src.startsWith('data:video') ? (
              <video src={selected.src} controls autoPlay style={{ maxWidth:'90vw', maxHeight:'85vh', borderRadius:16 }} />
            ) : (
              <img src={selected.src} style={{ maxWidth:'90vw', maxHeight:'85vh', borderRadius:16 }} />
            )}
            <div style={{ textAlign:'center', marginTop:12, color:'#fff', fontSize:14 }}>{formatDateShort(selected.key)}</div>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// OBJECTIVES PAGE
// ═══════════════════════════════════════════
function ObjectivesPage({ objectives, onCreateObjective, onToggleComplete }) {
  const [showCreator, setShowCreator] = React.useState(false);
  const [name, setName] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('medio');
  const [deadline, setDeadline] = React.useState('');

  const diffColors = { facil:'#22c55e', medio:'#eab308', dificil:'#ef4444' };
  const diffLabels = { facil:'Fácil', medio:'Medio', dificil:'Difícil' };

  const handleCreate = () => {
    if (!name.trim() || !deadline) return;
    onCreateObjective({ id: Date.now().toString(), name: name.trim(), difficulty, deadline, completed: false, createdAt: new Date().toISOString().split('T')[0] });
    setName(''); setDifficulty('medio'); setDeadline(''); setShowCreator(false);
  };

  const active = objectives.filter(o => !o.completed);
  const completed = objectives.filter(o => o.completed);

  return (
    <div>
      <SectionHeader title="Objetivos" icon="🎯" subtitle={`${active.length} activos`} action={() => setShowCreator(true)} actionLabel="+ Nuevo objetivo" />

      {objectives.length === 0 && <EmptyState icon="🎯" text="Crea tu primer objetivo y trabaja para conseguirlo" />}

      {/* Active */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {active.map(obj => {
          const days = daysUntil(obj.deadline);
          const isOverdue = days < 0;
          return (
            <GlassCard key={obj.id} style={{ padding:'18px 20px', borderLeft:`4px solid ${diffColors[obj.difficulty]}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#333', marginBottom:4 }}>{obj.name}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, fontWeight:600, color:diffColors[obj.difficulty], background:`${diffColors[obj.difficulty]}15`, padding:'3px 10px', borderRadius:8 }}>{diffLabels[obj.difficulty]}</span>
                    <span style={{ fontSize:11, color: isOverdue ? '#ef4444' : '#aaa' }}>
                      {isOverdue ? `Venció hace ${Math.abs(days)} días` : `Faltan ${days} días`}
                    </span>
                  </div>
                </div>
                <button onClick={() => onToggleComplete(obj.id)} style={{
                  width:32, height:32, borderRadius:10, border:'2px solid #ddd', background:'#fff',
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', flexShrink:0
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#22c55e'; e.currentTarget.style.background='#f0fdf4'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.background='#fff'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#ccc" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <div style={{ fontSize:13, fontWeight:600, color:'#aaa', marginBottom:10 }}>Completados ({completed.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {completed.map(obj => (
              <div key={obj.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#fafafa', borderRadius:14, opacity:0.6 }}>
                <div style={{ width:24, height:24, borderRadius:8, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize:14, color:'#888', textDecoration:'line-through' }}>{obj.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Creator */}
      {showCreator && (
        <Overlay onClose={() => setShowCreator(false)}>
          <div style={{ padding:'28px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <span style={{ fontSize:28 }}>🎯</span>
              <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>Nuevo objetivo</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Nombre</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Leer 10 libros"
                style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #eee', borderRadius:14, fontSize:15, outline:'none' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'#555' }}>Dificultad</div>
              <div style={{ display:'flex', gap:8 }}>
                {['facil','medio','dificil'].map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} style={{
                    flex:1, padding:'12px', borderRadius:14, border:'none', fontSize:14, fontWeight:600,
                    background: difficulty === d ? diffColors[d] : '#f5f5f5',
                    color: difficulty === d ? '#fff' : '#888', cursor:'pointer', transition:'all .2s'
                  }}>{diffLabels[d]}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Fecha límite</div>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #eee', borderRadius:14, fontSize:15, outline:'none' }} />
            </div>
            <button onClick={handleCreate} style={{
              width:'100%', padding:'16px', background:'#1a1a1a', color:'#fff', border:'none', borderRadius:16,
              fontSize:15, fontWeight:600, cursor:'pointer', opacity: (name && deadline) ? 1 : 0.4
            }}>Crear objetivo</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

Object.assign(window, {
  SummaryPage, StatisticsPage, LettersPage, MultimediaPage, ObjectivesPage,
});
