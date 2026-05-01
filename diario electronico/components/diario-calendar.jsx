// ── Calendar Page + Entry Editor/Viewer (v3 — visual upgrade) ──
const { useState, useRef, useEffect, useCallback } = React;

// ── Rating Slider ──
function RatingSlider({ value, onChange, disabled }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, color:'#bbb' }}>
        <span>Terrible</span><span>Increíble</span>
      </div>
      <div style={{ position:'relative', height:44, display:'flex', alignItems:'center' }}>
        <input type="range" min="1" max="10" value={value} onChange={e => onChange(+e.target.value)}
          disabled={disabled} className="diario-slider" />
      </div>
      <div style={{ textAlign:'center', marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
        <span style={{ fontSize:40 }}>{ratingEmoji(value)}</span>
        <div>
          <span style={{ fontSize:36, fontWeight:700, fontFamily:"'DM Serif Display', serif", color:ratingColor(value), transition:'color .2s' }}>{value}</span>
          <span style={{ fontSize:14, color:'#ccc' }}>/10</span>
        </div>
      </div>
    </div>
  );
}

// ── Color Palette Picker ──
function ColorPalettePicker({ colors, onChange }) {
  const PALETTE = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#6366f1','#f43f5e','#84cc16','#06b6d4','#a855f7','#fb923c','#64748b'];
  return (
    <div>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'#555' }}>Paleta de colores del día</div>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ width:40, height:40, borderRadius:12, background:c, border:'2px solid #fff', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', transition:'transform .2s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1) rotate(5deg)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
        ))}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {PALETTE.map(c => (
          <div key={c} onClick={() => {
            const next = [...colors];
            const idx = next.findIndex(x => x === '#e5e5e5');
            if (idx >= 0) { next[idx] = c; onChange(next); } else { next.shift(); next.push(c); onChange(next); }
          }}
            style={{ width:28, height:28, borderRadius:8, background:c, cursor:'pointer', transition:'transform .15s', border:'2px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
        ))}
      </div>
    </div>
  );
}

// ── Media Section in Editor ──
function MediaEditor({ photos, onPhotosChange, audioBlob, onAudioChange }) {
  const fileRef = useRef();
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const addPhotos = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => onPhotosChange(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => onAudioChange(e.target.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch { alert('No se pudo acceder al micrófono'); }
  };

  const stopRecording = () => { if (mediaRecorder.current && recording) { mediaRecorder.current.stop(); setRecording(false); } };

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'#555' }}>Multimedia</div>
      {photos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:8, marginBottom:12 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position:'relative', aspectRatio:'1', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
              {p.startsWith('data:video') ? <video src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              <button onClick={() => onPhotosChange(prev => prev.filter((_,j) => j !== i))} style={{
                position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.5)', color:'#fff',
                border:'none', borderRadius:6, width:22, height:22, cursor:'pointer', fontSize:12,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button onClick={() => fileRef.current.click()} style={{
          flex:'1 1 100px', padding:'14px', border:'2px dashed #e0e0e0', borderRadius:14,
          background:'#fafafa', cursor:'pointer', color:'#aaa', fontSize:13,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'border-color .2s'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
          </svg> Fotos / Vídeos
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={addPhotos} style={{ display:'none' }} />
        <button onClick={recording ? stopRecording : startRecording} style={{
          flex:'1 1 100px', padding:'14px', border: recording ? '2px solid #ef4444' : '2px dashed #e0e0e0',
          borderRadius:14, background: recording ? '#fef2f2' : '#fafafa', cursor:'pointer',
          color: recording ? '#ef4444' : '#aaa', fontSize:13,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .2s'
        }}>
          {recording ? <><div style={{ width:10, height:10, borderRadius:2, background:'#ef4444', animation:'dPulse 1s infinite' }} /> Grabando...</>
            : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
            </svg> Nota de voz</>}
        </button>
      </div>
      {audioBlob && (
        <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
          <audio controls src={audioBlob} style={{ flex:1, height:36 }} />
          <button onClick={() => onAudioChange(null)} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:28, height:28, cursor:'pointer', fontSize:12, color:'#999', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Entry Editor Modal ──
function EntryEditor({ dk, entry, onSave, onClose, streaks, objectives }) {
  const [rating, setRating] = useState(entry?.rating || 5);
  const [text, setText] = useState(entry?.text || '');
  const [bookmark, setBookmark] = useState(entry?.bookmark || false);
  const [bookmarkColor] = useState(entry?.bookmarkColor || randomColor());
  const [photos, setPhotos] = useState(entry?.photos || []);
  const [audio, setAudio] = useState(entry?.audio || null);
  const [streakStatus, setStreakStatus] = useState(entry?.streaks || {});
  const [achieved, setAchieved] = useState(entry?.achieved ?? null);
  const [dayColors, setDayColors] = useState(entry?.dayColors || ['#e5e5e5','#e5e5e5','#e5e5e5']);
  const [metaphor] = useState(entry?.metaphor || getMetaphor(entry?.rating || 5));

  const { dayName, display } = formatDateFull(dk);

  const handleSave = () => {
    const finalMetaphor = entry?.metaphor || getMetaphor(rating);
    onSave(dk, { rating, text, bookmark, bookmarkColor, photos, audio, streaks: streakStatus, achieved, dayColors, metaphor: finalMetaphor, date: dk });

    // Check if any streak just hit 7 days
    streaks.forEach(s => {
      if (streakStatus[s.id]) {
        const tempEntries = { ...window.__diarioEntries, [dk]: { streaks: streakStatus } };
        const days = getStreakDays(s, tempEntries);
        if (days === 7 || days === 30 || days === 100) launchStars();
      }
    });

    launchConfetti();
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'28px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:12, color:'#aaa', textTransform:'capitalize', fontWeight:500 }}>{dayName}</div>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>{display}</div>
          </div>
          <button onClick={onClose} style={{ background:'#f5f5f5', border:'none', borderRadius:12, width:36, height:36, cursor:'pointer', fontSize:16, color:'#999', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:'#555' }}>¿Cómo ha ido tu día?</div>
          <RatingSlider value={rating} onChange={setRating} />
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'#555' }}>Escribe sobre tu día</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Hoy ha sido un día..."
            style={{ width:'100%', minHeight:110, border:'1.5px solid #eee', borderRadius:16, padding:'14px 16px', fontSize:15, lineHeight:1.6, resize:'vertical', outline:'none', transition:'border-color .2s', color:'#333' }}
            onFocus={e => e.target.style.borderColor='#ccc'} onBlur={e => e.target.style.borderColor='#eee'} />
          <div style={{ fontSize:11, color:'#ccc', marginTop:4, fontStyle:'italic' }}>Tip: usa **texto** para resaltar palabras importantes</div>
        </div>

        <div style={{ marginBottom:20 }}><MediaEditor photos={photos} onPhotosChange={setPhotos} audioBlob={audio} onAudioChange={setAudio} /></div>
        <div style={{ marginBottom:20 }}><ColorPalettePicker colors={dayColors} onChange={setDayColors} /></div>

        {/* Bookmark */}
        <div style={{ marginBottom:16 }}>
          <label style={{
            display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'14px 16px',
            background: bookmark ? 'oklch(0.97 0.01 200)' : '#fafafa', borderRadius:16,
            border: bookmark ? '1.5px solid oklch(0.88 0.06 200)' : '1.5px solid #f0f0f0', transition:'all .2s'
          }}>
            <div style={{ width:24, height:24, borderRadius:8, border:'2px solid #ccc', background: bookmark ? bookmarkColor : '#fff', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {bookmark && <svg width="12" height="12" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <input type="checkbox" checked={bookmark} onChange={e => setBookmark(e.target.checked)} style={{ display:'none' }} />
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'#333' }}>Añadir marcador</div>
              <div style={{ fontSize:12, color:'#aaa' }}>Círculo de color en el calendario</div>
            </div>
          </label>
        </div>

        {/* Achieved */}
        <div style={{ marginBottom:16, padding:'14px 16px', background:'#fafafa', borderRadius:16, border:'1.5px solid #f0f0f0' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#333', marginBottom:10 }}>¿Has cumplido con lo propuesto hoy?</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setAchieved(true)} style={{
              flex:1, padding:'10px', borderRadius:12, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
              background: achieved === true ? '#22c55e' : '#f0f0f0', color: achieved === true ? '#fff' : '#888', transition:'all .2s'
            }}>✓ Sí</button>
            <button onClick={() => setAchieved(false)} style={{
              flex:1, padding:'10px', borderRadius:12, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
              background: achieved === false ? '#ef4444' : '#f0f0f0', color: achieved === false ? '#fff' : '#888', transition:'all .2s'
            }}>✗ No</button>
          </div>
        </div>

        {/* Streaks */}
        {streaks.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'#555' }}>Rachas activas</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {streaks.map(s => {
                const active = streakStatus[s.id] || false;
                return (
                  <label key={s.id} style={{
                    display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'12px 16px',
                    background: active ? 'oklch(0.97 0.02 80)' : '#fafafa', borderRadius:14,
                    border: active ? '1.5px solid oklch(0.88 0.08 80)' : '1.5px solid #f0f0f0', transition:'all .2s'
                  }}>
                    <div style={{ width:22, height:22, borderRadius:6, border:'2px solid #ccc', background: active ? '#f97316' : '#fff', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {active && <svg width="12" height="12" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <input type="checkbox" checked={active} onChange={e => setStreakStatus({ ...streakStatus, [s.id]: e.target.checked })} style={{ display:'none' }} />
                    <div style={{ fontSize:14, fontWeight:600, color:'#333' }}>¿Has logrado "{s.name}"?</div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={handleSave} style={{
          width:'100%', padding:'16px', background:'#1a1a1a', color:'#fff', border:'none', borderRadius:16,
          fontSize:15, fontWeight:600, cursor:'pointer', transition:'transform .15s, box-shadow .2s',
          boxShadow:'0 4px 20px rgba(0,0,0,0.15)'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 25px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.15)'; }}
        >Guardar ✨</button>
      </div>
    </Overlay>
  );
}

// ── Render text with **bold** highlights ──
function RichText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return <span key={i} style={{
        background:'linear-gradient(to top, #fde68a 40%, transparent 40%)',
        fontWeight:600, padding:'0 2px'
      }}>{inner}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ── Entry Viewer ──
function EntryViewer({ dk, entry, onClose, onEdit }) {
  const { dayName, display } = formatDateFull(dk);
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'28px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, color:'#aaa', textTransform:'capitalize', fontWeight:500 }}>{dayName}</div>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>{display}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onEdit} style={{ background:'#1a1a1a', border:'none', borderRadius:12, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600, color:'#fff' }}>Editar</button>
            <button onClick={onClose} style={{ background:'#f5f5f5', border:'none', borderRadius:12, width:36, height:36, cursor:'pointer', fontSize:16, color:'#999', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>

        {/* Rating card */}
        <div style={{ background:ratingGradient(entry.rating), borderRadius:18, padding:'20px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:44 }}>{ratingEmoji(entry.rating)}</span>
          <div>
            <div style={{ fontSize:32, fontWeight:700, fontFamily:"'DM Serif Display', serif", color:'rgba(0,0,0,0.7)' }}>{entry.rating}<span style={{ fontSize:16, fontWeight:400 }}>/10</span></div>
            <div style={{ fontSize:13, color:'rgba(0,0,0,0.4)', fontStyle:'italic' }}>{entry.metaphor}</div>
          </div>
        </div>

        {/* Color strip */}
        {entry.dayColors && !entry.dayColors.every(c => c === '#e5e5e5') && (
          <div style={{ display:'flex', gap:0, marginBottom:16, borderRadius:12, overflow:'hidden', height:8 }}>
            {entry.dayColors.map((c,i) => <div key={i} style={{ flex:1, background:c }} />)}
          </div>
        )}

        {/* Photos */}
        {entry.photos?.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns: entry.photos.length === 1 ? '1fr' : 'repeat(2,1fr)', gap:8, marginBottom:16 }}>
            {entry.photos.map((p, i) => (
              <div key={i} style={{ borderRadius:16, overflow:'hidden', aspectRatio: entry.photos.length === 1 ? '16/9' : '1' }}>
                {p.startsWith('data:video') ? <video src={p} controls style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Audio */}
        {entry.audio && (
          <div style={{ marginBottom:16, background:'#fafafa', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            <audio controls src={entry.audio} style={{ flex:1, height:32 }} />
          </div>
        )}

        {/* Text with highlights */}
        {entry.text && (
          <div style={{ padding:'20px', background:'#fafafa', borderRadius:16, fontSize:15, lineHeight:1.8, color:'#444', whiteSpace:'pre-wrap', marginBottom:16 }}>
            <RichText text={entry.text} />
          </div>
        )}

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {entry.bookmark && (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#aaa', background:'#fafafa', padding:'6px 12px', borderRadius:10 }}>
              <div style={{ width:8, height:8, borderRadius:4, background:entry.bookmarkColor }} /> Marcado
            </div>
          )}
          {entry.achieved !== null && entry.achieved !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: entry.achieved ? '#22c55e' : '#ef4444', background:'#fafafa', padding:'6px 12px', borderRadius:10 }}>
              {entry.achieved ? '✓ Cumplí mis propósitos' : '✗ No cumplí mis propósitos'}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ── Streak Creator ──
function StreakCreator({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding:'28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <span style={{ fontSize:28 }}>🔥</span>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>Nueva racha</div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Nombre de la racha</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Hacer ejercicio"
            style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #eee', borderRadius:14, fontSize:15, outline:'none' }} />
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Fecha de inicio</div>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #eee', borderRadius:14, fontSize:15, outline:'none' }} />
        </div>
        <button onClick={() => { if (name.trim()) { onCreate({ id: Date.now().toString(), name: name.trim(), startDate }); onClose(); }}} style={{
          width:'100%', padding:'16px', background:'#1a1a1a', color:'#fff', border:'none', borderRadius:16,
          fontSize:15, fontWeight:600, cursor:'pointer', opacity: name.trim() ? 1 : 0.4
        }}>Crear racha</button>
      </div>
    </Overlay>
  );
}

// ── 3D Calendar ──
function CalendarGrid({ year, month, entries, streaks, onDayClick }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={'e'+i} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = dateKey(year, month, d);
    const entry = entries[dk];
    const hasEntry = !!entry;
    const td = isToday(d);

    // 3D effect: higher rating = more elevation
    const elevation = hasEntry ? -2 + (entry.rating / 10) * 8 : 0; // -2px to +6px
    const shadowBlur = hasEntry ? 4 + (entry.rating / 10) * 16 : 0;
    const zScale = hasEntry ? 0.98 + (entry.rating / 10) * 0.06 : 1;

    const dayStreaks = [];
    if (entry?.streaks) {
      streaks.forEach(s => { if (entry.streaks[s.id]) dayStreaks.push({ ...s, days: getStreakDays(s, entries) }); });
    }

    cells.push(
      <div key={d} onClick={() => onDayClick(dk)} className="cal-cell"
        style={{
          position:'relative', aspectRatio:'1', borderRadius:14, cursor:'pointer',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
          background: td ? '#1a1a1a' : hasEntry ? ratingGradient(entry.rating) : '#fafafa',
          color: td ? '#fff' : '#1a1a1a',
          transform: `translateY(${-elevation}px) scale(${zScale})`,
          boxShadow: hasEntry ? `0 ${2 + elevation}px ${shadowBlur}px rgba(0,0,0,${0.04 + entry.rating * 0.008})` : 'none',
          border:'1px solid transparent',
          transition:'all .3s cubic-bezier(.2,.8,.3,1)',
        }}
      >
        <span style={{ fontSize:13, fontWeight: td ? 700 : hasEntry ? 600 : 400, lineHeight:1 }}>{d}</span>
        {hasEntry && (
          <span style={{ fontSize:9, fontWeight:700, color: td ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', lineHeight:1 }}>{entry.rating}</span>
        )}
        <div style={{ display:'flex', gap:2, position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)' }}>
          {entry?.bookmark && <div style={{ width:5, height:5, borderRadius:3, background:entry.bookmarkColor }} />}
          {entry?.photos?.length > 0 && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill={td ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.25)'}><rect x="2" y="4" width="20" height="16" rx="3"/></svg>
          )}
          {entry?.audio && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill={td ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.25)'}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>
          )}
        </div>
        {dayStreaks.length > 0 && (
          <div style={{ position:'absolute', top:1, right:2 }}><FireIcon days={dayStreaks[0].days} size={9} /></div>
        )}
        {entry?.dayColors && !entry.dayColors.every(c => c === '#e5e5e5') && (
          <div style={{ position:'absolute', bottom:0, left:4, right:4, display:'flex', height:3, borderRadius:2, overflow:'hidden' }}>
            {entry.dayColors.map((c,i) => <div key={i} style={{ flex:1, background:c }} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ perspective:'800px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
        {DAYS_ES.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#ccc', padding:'4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, transformStyle:'preserve-3d' }}>{cells}</div>
    </div>
  );
}

// ── "This Day in History" ──
function ThisDayInHistory({ entries }) {
  const today = new Date();
  const m = today.getMonth(), d = today.getDate();
  const matches = [];
  Object.entries(entries).forEach(([k, e]) => {
    const p = parseKey(k);
    if (p.m === m && p.d === d && p.y !== today.getFullYear()) matches.push({ key: k, entry: e, year: p.y });
  });
  if (matches.length === 0) return null;
  return (
    <GlassCard style={{ padding:'16px 20px', marginBottom:16, background:'linear-gradient(135deg, #fef3c7, #fde68a20)' }}>
      <div style={{ fontSize:12, fontWeight:600, color:'#b45309', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
        <span>📅</span> Este día en la historia
      </div>
      {matches.map(m => (
        <div key={m.key} style={{ marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#333' }}>{m.year} — {ratingEmoji(m.entry.rating)} {m.entry.rating}/10</div>
          {m.entry.text && <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{m.entry.text.slice(0,80)}{m.entry.text.length > 80 ? '...' : ''}</div>}
        </div>
      ))}
    </GlassCard>
  );
}

// ── Flashback ──
function FlashbackButton({ entries, onOpenDay }) {
  const keys = Object.keys(entries);
  if (keys.length === 0) return null;
  return (
    <button onClick={() => onOpenDay(keys[Math.floor(Math.random() * keys.length)])} style={{
      background:'linear-gradient(135deg, #c4b5fd, #a78bfa)', border:'none', borderRadius:16,
      padding:'14px 20px', cursor:'pointer', color:'#fff', fontSize:13, fontWeight:600,
      display:'flex', alignItems:'center', gap:8, width:'100%', transition:'transform .15s',
      boxShadow:'0 4px 15px rgba(167,139,250,0.3)'
    }}
      onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform='none'}
    ><span style={{ fontSize:18 }}>✨</span> Flashback aleatorio</button>
  );
}

// ── Calendar Page ──
function CalendarPage({ entries, streaks, objectives, onDayClick, onOpenDay, onCreateStreak }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showStreakCreator, setShowStreakCreator] = useState(false);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const activeStreaks = streaks.map(s => ({ ...s, days: getStreakDays(s, entries) }));

  return (
    <div>
      <ThisDayInHistory entries={entries} />

      {activeStreaks.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {activeStreaks.map(s => (
            <GlassCard key={s.id} style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
              <FireIcon days={s.days} size={18} />
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{s.name}</div>
                <div style={{ fontSize:11, color:'#aaa' }}>{s.days} días</div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'0 4px' }}>
        <button onClick={prevMonth} style={{ background:'#f5f5f5', border:'none', borderRadius:12, width:40, height:40, cursor:'pointer', fontSize:18, color:'#888', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background='#eee'} onMouseLeave={e => e.currentTarget.style.background='#f5f5f5'}>‹</button>
        <div style={{ fontSize:18, fontWeight:700, fontFamily:"'DM Serif Display', serif" }}>{MONTHS_ES[viewMonth]} {viewYear}</div>
        <button onClick={nextMonth} style={{ background:'#f5f5f5', border:'none', borderRadius:12, width:40, height:40, cursor:'pointer', fontSize:18, color:'#888', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background='#eee'} onMouseLeave={e => e.currentTarget.style.background='#f5f5f5'}>›</button>
      </div>

      <CalendarGrid year={viewYear} month={viewMonth} entries={entries} streaks={streaks} onDayClick={onDayClick} />

      <div style={{ marginTop:20, display:'flex', gap:10 }}>
        <FlashbackButton entries={entries} onOpenDay={onOpenDay} />
        <button onClick={() => setShowStreakCreator(true)} style={{
          background:'linear-gradient(135deg, #fed7aa, #fdba74)', border:'none', borderRadius:16,
          padding:'14px 20px', cursor:'pointer', color:'#9a3412', fontSize:13, fontWeight:600,
          display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', transition:'transform .15s',
          boxShadow:'0 4px 15px rgba(251,146,60,0.25)'
        }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >🔥 Racha</button>
      </div>

      {showStreakCreator && <StreakCreator onClose={() => setShowStreakCreator(false)} onCreate={onCreateStreak} />}
    </div>
  );
}

Object.assign(window, {
  RatingSlider, ColorPalettePicker, MediaEditor, EntryEditor, EntryViewer, RichText,
  StreakCreator, CalendarGrid, CalendarPage, ThisDayInHistory, FlashbackButton,
});
