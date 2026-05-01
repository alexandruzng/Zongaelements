// ─── Fianzas: iconos SVG (inspirados en lucide, dibujados a mano, stroke-based)
// stroke currentColor — sizable vía prop size (default 18)

const Icon = ({ children, size = 18, strokeWidth = 1.75, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const I = {
  plus:      (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  minus:     (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  x:         (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  check:     (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  chevDown:  (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  chevLeft:  (p) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  chevRight: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  chevUp:    (p) => <Icon {...p}><path d="m6 15 6-6 6 6"/></Icon>,
  search:    (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  filter:    (p) => <Icon {...p}><path d="M3 6h18M6 12h12M10 18h4"/></Icon>,
  calendar:  (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 10h18M8 2v4M16 2v4"/></Icon>,
  trendUp:   (p) => <Icon {...p}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></Icon>,
  trendDown: (p) => <Icon {...p}><path d="m3 7 6 6 4-4 8 8"/><path d="M14 17h7v-7"/></Icon>,
  arrowUp:   (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  arrowDown: (p) => <Icon {...p}><path d="M12 5v14M5 12l7 7 7-7"/></Icon>,
  wallet:    (p) => <Icon {...p}><path d="M3 8a3 3 0 0 1 3-3h12a2 2 0 0 1 2 2v1"/><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="17" cy="14" r="1.5"/></Icon>,
  piggy:     (p) => <Icon {...p}><path d="M19 11.5c0 3-3.1 5.5-7 5.5s-7-2.5-7-5.5 3.1-5.5 7-5.5c1.5 0 2.9.4 4.1 1L19 6v5.5Z"/><path d="M7 17v2M15 17v2"/><circle cx="15" cy="10" r=".8" fill="currentColor"/></Icon>,
  target:    (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Icon>,
  sparkles:  (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></Icon>,
  lightbulb: (p) => <Icon {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/></Icon>,
  bell:      (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>,
  sun:       (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></Icon>,
  moon:      (p) => <Icon {...p}><path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/></Icon>,
  download:  (p) => <Icon {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></Icon>,
  utensils:  (p) => <Icon {...p}><path d="M4 3v8a3 3 0 0 0 3 3v7M7 3v8M10 3v8M16 3c-2 2-2 6 0 8v10"/></Icon>,
  car:       (p) => <Icon {...p}><path d="M5 11 7 6h10l2 5"/><path d="M3 11h18v6h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-6Z"/></Icon>,
  home:      (p) => <Icon {...p}><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9Z"/></Icon>,
  heart:     (p) => <Icon {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></Icon>,
  bag:       (p) => <Icon {...p}><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 1 1 6 0v2"/></Icon>,
  repeat:    (p) => <Icon {...p}><path d="M17 3l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 21l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></Icon>,
  more:      (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  briefcase: (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></Icon>,
  laptop:    (p) => <Icon {...p}><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/></Icon>,
  gift:      (p) => <Icon {...p}><rect x="3" y="8" width="18" height="4"/><path d="M12 8v14M5 12v10h14V12"/><path d="M12 8s-2-5-5-3 2 5 5 3ZM12 8s2-5 5-3-2 5-5 3Z"/></Icon>,
  logo:      (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||24} height={p.size||24} viewBox="0 0 32 32" fill="none" className={p.className}>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor"/>
      <path d="M10 23V9h12" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M10 16h8" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="22" cy="22" r="2" fill="var(--bg)"/>
    </svg>
  ),
  euro:      (p) => <Icon {...p}><path d="M18 6.5A7 7 0 1 0 18 17.5"/><path d="M4 10h11M4 14h11"/></Icon>,
  ron:       (p) => <Icon {...p}><path d="M6 20V4h7a4 4 0 0 1 0 8H6"/><path d="m11 12 6 8"/></Icon>,
  sliders:   (p) => <Icon {...p}><path d="M4 6h12M4 12h8M4 18h16"/><circle cx="19" cy="6" r="2"/><circle cx="15" cy="12" r="2"/></Icon>,
  alert:     (p) => <Icon {...p}><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5M12 18.5v.01"/></Icon>,
  refresh:   (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></Icon>,
  edit:      (p) => <Icon {...p}><path d="M4 20h4l11-11-4-4L4 16v4Z"/></Icon>,
  trash:     (p) => <Icon {...p}><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13"/></Icon>,
  tag:       (p) => <Icon {...p}><path d="m3 12 9-9h8v8l-9 9-8-8Z"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/></Icon>,
};

window.FZ_Icon = I;
