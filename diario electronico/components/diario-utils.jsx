// ── Shared Utils + Components (v3 — visual upgrade) ──
const STORAGE_KEY = 'diario_entries_v2';
const STREAKS_KEY = 'diario_streaks_v2';
const LETTERS_KEY = 'diario_letters_v2';
const OBJECTIVES_KEY = 'diario_objectives_v2';

function loadData(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function saveData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function parseKey(k) { const [y,m,d] = k.split('-').map(Number); return { y, m: m-1, d }; }
function todayKey() { const t = new Date(); return dateKey(t.getFullYear(), t.getMonth(), t.getDate()); }

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const METAPHORS = [
  { min:1, max:2, texts:['Tu día fue como una tormenta sin paraguas','Como caminar descalzo sobre piedras','Hoy fue un túnel largo y oscuro'] },
  { min:3, max:4, texts:['Tu día fue como nubes grises que no terminan de llover','Como una canción en tono menor','Hoy fue un café que se enfrió demasiado rápido'] },
  { min:5, max:6, texts:['Tu día fue como una brisa suave de primavera','Como un atardecer entre nubes','Hoy fue un libro que apenas empiezas a leer'] },
  { min:7, max:8, texts:['Tu día fue como un rayo de sol entre las nubes','Como encontrar una canción que te encanta','Hoy fue una ola perfecta para surfear'] },
  { min:9, max:10, texts:['Tu día fue como una tormenta que aclara y deja un arcoíris','Como el primer día de vacaciones','Hoy fue una estrella fugaz que sí viste'] },
];

function getMetaphor(rating) {
  const group = METAPHORS.find(m => rating >= m.min && rating <= m.max) || METAPHORS[2];
  return group.texts[Math.floor(Math.random() * group.texts.length)];
}

function randomColor() {
  const hues = [15, 45, 80, 120, 170, 200, 260, 300, 340];
  return `oklch(0.72 0.16 ${hues[Math.floor(Math.random() * hues.length)]})`;
}

function ratingColor(r) {
  if (r <= 2) return '#ef4444'; if (r <= 4) return '#f97316';
  if (r <= 6) return '#eab308'; if (r <= 8) return '#22c55e'; return '#10b981';
}
function ratingEmoji(r) {
  if (r <= 2) return '😢'; if (r <= 4) return '😕'; if (r <= 6) return '😊'; if (r <= 8) return '😄'; return '🤩';
}
function ratingGradient(r) {
  if (r <= 3) return 'linear-gradient(135deg, #fecaca, #fca5a5)';
  if (r <= 5) return 'linear-gradient(135deg, #fef3c7, #fde68a)';
  if (r <= 7) return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
  return 'linear-gradient(135deg, #a7f3d0, #6ee7b7)';
}
function getFireColor(days) {
  if (days >= 100) return '#22c55e'; if (days >= 60) return '#3b82f6';
  if (days >= 40) return '#8b5cf6'; if (days >= 20) return '#ef4444'; return '#f97316';
}
function getStreakDays(streak, entries) {
  let count = 0;
  Object.keys(entries).sort().forEach(k => { if (k >= streak.startDate && entries[k]?.streaks?.[streak.id]) count++; });
  return count;
}
function daysUntil(dateStr) {
  const t = new Date(dateStr); t.setHours(0,0,0,0);
  const n = new Date(); n.setHours(0,0,0,0);
  return Math.ceil((t - n) / 86400000);
}
function formatDateShort(dk) { const p = parseKey(dk); return `${p.d} ${MONTHS_SHORT[p.m]}`; }
function formatDateFull(dk) {
  const p = parseKey(dk);
  const dayName = new Date(p.y, p.m, p.d).toLocaleDateString('es-ES', { weekday:'long' });
  return { dayName, display: `${p.d} de ${MONTHS_ES[p.m]}, ${p.y}` };
}

// ── Confetti System ──
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const particles = [];
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#10b981'];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
      rot: Math.random() * 360, vr: (Math.random() - 0.5) * 12,
      color: colors[Math.floor(Math.random() * colors.length)], opacity: 1,
    });
  }
  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rot += p.vr;
      if (frame > 40) p.opacity -= 0.015;
      if (p.opacity <= 0) return;
      alive = true;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (alive && frame < 150) requestAnimationFrame(animate);
    else canvas.remove();
  }
  requestAnimationFrame(animate);
}

// ── Stars System (for streak milestones) ──
function launchStars() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const stars = [];
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 300,
      size: 8 + Math.random() * 14, vy: 1.5 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 2, rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 6, opacity: 1,
    });
  }
  let frame = 0;
  function drawStar(cx, cy, size, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * Math.PI / 180);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      const r = size / 2;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
      const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
      ctx.lineTo(Math.cos(a2) * r * 0.4, Math.sin(a2) * r * 0.4);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    stars.forEach(s => {
      s.y += s.vy; s.x += s.vx; s.vy += 0.06; s.rot += s.vr;
      if (frame > 50) s.opacity -= 0.02;
      if (s.opacity <= 0) return;
      alive = true;
      ctx.globalAlpha = Math.max(0, s.opacity);
      ctx.fillStyle = '#eab308';
      drawStar(s.x, s.y, s.size, s.rot);
      ctx.fillStyle = '#fde68a';
      drawStar(s.x, s.y, s.size * 0.5, s.rot);
    });
    frame++;
    if (alive && frame < 150) requestAnimationFrame(animate);
    else canvas.remove();
  }
  requestAnimationFrame(animate);
}

// ── Shared Components ──
function FireIcon({ days, size = 16 }) {
  const color = getFireColor(days);
  const sc = Math.min(1.4, 1 + days * 0.003);
  return (
    <svg width={size * sc} height={size * sc} viewBox="0 0 24 24" fill={color} style={{ filter:`drop-shadow(0 0 ${Math.min(6, days/10)}px ${color}40)` }}>
      <path d="M12 23c-4.97 0-8-3.03-8-7 0-2.45 1.17-4.35 2.68-5.88C8.19 8.61 9 6.62 9 4.5c0-.5.05-1 .14-1.48C9.2 2.63 9.53 2.25 10 2.5c.47.25.75.75 1 1.25.5 1 1.25 2.25 2.5 2.75.3.12.56-.13.43-.42C13.35 4.68 13 3.1 13.5 1.5c.13-.42.63-.55.88-.22C16.08 3.58 20 7.58 20 16c0 3.97-3.03 7-8 7z"/>
    </svg>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(12px)',
      WebkitBackdropFilter:'blur(12px)', zIndex:200, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16, animation:'dFadeIn .2s ease'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#fff', borderRadius:24, width:'100%', maxWidth:560,
        maxHeight:'90vh', overflow:'auto',
        boxShadow:'0 25px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
        animation:'dSlideUp .3s cubic-bezier(.2,.8,.3,1)'
      }}>{children}</div>
    </div>
  );
}

function GlassCard({ children, style = {}, onClick, hover = false }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background:'#fff', borderRadius:20, border:'1px solid #f0f0f0',
        boxShadow: hovered && hover ? '0 8px 30px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.04)',
        transition:'all .25s ease', cursor: onClick ? 'pointer' : 'default',
        transform: hovered && hover ? 'translateY(-2px)' : 'none', ...style
      }}>{children}</div>
  );
}

function StatBubble({ label, value, sub, color, icon }) {
  return (
    <GlassCard style={{ padding:'20px', flex:'1 1 140px', minWidth:130 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        {icon && <span style={{ fontSize:20 }}>{icon}</span>}
        <span style={{ fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize:30, fontWeight:700, fontFamily:"'DM Serif Display', serif", color: color || '#1a1a1a', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'#bbb', marginTop:4 }}>{sub}</div>}
    </GlassCard>
  );
}

function SectionHeader({ title, subtitle, action, actionLabel, icon }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {icon && <span style={{ fontSize:22 }}>{icon}</span>}
          <h2 style={{ fontSize:20, fontWeight:700, fontFamily:"'DM Serif Display', serif", margin:0 }}>{title}</h2>
        </div>
        {subtitle && <p style={{ fontSize:13, color:'#aaa', margin:'4px 0 0' }}>{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action} style={{
          background:'#f5f5f5', border:'none', borderRadius:12, padding:'8px 16px',
          fontSize:12, fontWeight:600, color:'#666', cursor:'pointer', transition:'background .2s'
        }} onMouseEnter={e => e.currentTarget.style.background='#eee'} onMouseLeave={e => e.currentTarget.style.background='#f5f5f5'}>{actionLabel}</button>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px', color:'#ccc' }}>
      <div style={{ fontSize:40, marginBottom:12, animation:'dFloat 3s ease-in-out infinite' }}>{icon}</div>
      <div style={{ fontSize:14 }}>{text}</div>
    </div>
  );
}

Object.assign(window, {
  STORAGE_KEY, STREAKS_KEY, LETTERS_KEY, OBJECTIVES_KEY,
  loadData, saveData, dateKey, parseKey, todayKey,
  MONTHS_ES, MONTHS_SHORT, DAYS_ES, DAYS_FULL,
  getMetaphor, randomColor, ratingColor, ratingEmoji, ratingGradient,
  getFireColor, getStreakDays, daysUntil, formatDateShort, formatDateFull,
  launchConfetti, launchStars,
  FireIcon, Overlay, GlassCard, StatBubble, SectionHeader, EmptyState,
});
