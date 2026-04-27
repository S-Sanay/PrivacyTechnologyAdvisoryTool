import { useState, useRef, useCallback } from 'react';
import { technologies } from '../data/technologies';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  anon:  { bg: 'bg-sky-600',     light: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700',    badge: 'bg-sky-100 text-sky-800',        bar: 'bg-sky-500',     hex: '#0284c7' },
  dp:    { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700',badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500', hex: '#059669' },
  mpc:   { bg: 'bg-violet-600',  light: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800',  bar: 'bg-violet-500',  hex: '#7c3aed' },
  fl:    { bg: 'bg-orange-500',  light: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800',  bar: 'bg-orange-500',  hex: '#ea580c' },
  legal: { bg: 'bg-amber-600',   light: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800',   bar: 'bg-amber-500',   hex: '#b45309' },
};

// Outcomes shown on the right side of the flowchart
const OUTCOMES = {
  anon:  [{ icon: '📊', text: 'Shareable, de-identified dataset' }, { icon: '✅', text: 'HIPAA / GDPR compliant release' }, { icon: '🔍', text: 'No individual is re-identifiable' }],
  dp:    [{ icon: '🔐', text: 'Formal mathematical privacy proof' }, { icon: '📊', text: 'Provably private statistics & models' }, { icon: '🧮', text: 'Quantifiable, auditable privacy budget' }],
  mpc:   [{ icon: '🤝', text: 'Zero raw data shared between parties' }, { icon: '🎯', text: 'Exact joint results — no noise' }, { icon: '🔒', text: 'Cryptographic privacy guarantee' }],
  fl:    [{ icon: '📱', text: 'Data never leaves its source' }, { icon: '🤖', text: 'Collaborative AI model, no data sharing' }, { icon: '📈', text: 'Scales to millions of participants' }],
  legal: [{ icon: '⚖️', text: 'Regulatory compliance framework' }, { icon: '🏢', text: 'Organizational behavior legally constrained' }, { icon: '📋', text: 'Auditable data governance program' }],
};

// ─── Visual 4 data: Impact curves per tech ────────────────────────────────────
// Each curve: fn(pct 0-100) → metric value 0-100. higherBetter=false means lower score is good.
const IMPACT_CURVES = {
  dp: {
    pctToLabel: p => `ε = ${Math.pow(10, p / 100 * 3 - 2).toFixed(p < 45 ? 2 : 1)}`,
    curves: [
      { label: 'Privacy Strength',      icon: '🛡️', fn: p => Math.round(98 - p * 0.70), higherBetter: true },
      { label: 'Utility / Accuracy',    icon: '📊', fn: p => Math.round(28 + p * 0.67), higherBetter: true },
      { label: 'Compliance Confidence', icon: '⚖️', fn: p => Math.round(96 - p * 0.48), higherBetter: true },
      { label: 'Leakage Risk',          icon: '🔓', fn: p => Math.round(3  + p * 0.65), higherBetter: false, note: 'lower is better' },
    ],
    inZone:  'Balances a formal privacy guarantee (ε < 1) with practical accuracy for most analytics workloads.',
    tooLow:  'Very low ε adds heavy noise — results may be too inaccurate for practical business decisions.',
    tooHigh: 'High ε weakens the formal guarantee — individual records can meaningfully influence outputs.',
  },
  anon: {
    pctToLabel: p => `k = ${Math.round(p / 100 * 48 + 2)}`,
    curves: [
      { label: 'Re-ID Protection',      icon: '🛡️', fn: p => Math.round(32 + p * 0.60), higherBetter: true },
      { label: 'Utility / Accuracy',    icon: '📊', fn: p => Math.round(96 - p * 0.57), higherBetter: true },
      { label: 'Compliance Confidence', icon: '⚖️', fn: p => Math.round(42 + p * 0.52), higherBetter: true },
      { label: 'Re-ID Leakage Risk',    icon: '🔓', fn: p => Math.round(80 - p * 0.68), higherBetter: false, note: 'lower is better' },
    ],
    inZone:  'Groups of 5–25 records provide meaningful re-identification protection while keeping most data values usable for analysis.',
    tooLow:  'Very small k (2–4) gives minimal protection — an adversary can easily narrow down to 2–3 candidates for any record.',
    tooHigh: 'Very large k forces heavy generalization, causing significant data utility loss and suppression of rare-but-important records.',
  },
  fl: {
    pctToLabel: p => `${Math.round(p / 100 * 49 + 1)}%`,
    curves: [
      { label: 'Model Accuracy',     icon: '📊', fn: p => Math.round(38 + p * 0.52), higherBetter: true },
      { label: 'Gradient Privacy',   icon: '🛡️', fn: p => Math.round(88 - p * 0.30), higherBetter: true },
      { label: 'Compute Efficiency', icon: '⚡', fn: p => Math.round(96 - p * 0.52), higherBetter: true },
      { label: 'Gradient Leakage',   icon: '🔓', fn: p => Math.round(5  + p * 0.50), higherBetter: false, note: 'lower is better' },
    ],
    inZone:  'Sampling 5–10% of clients per round achieves good model convergence while keeping per-round compute manageable and gradient leakage low.',
    tooLow:  'Too few clients per round slows convergence significantly and can introduce sampling bias in the global model.',
    tooHigh: 'High participation rates sharply increase per-round compute costs and gradient aggregation leakage risk.',
  },
};

// ─── Visual 1: Flowchart ──────────────────────────────────────────────────────
function FlowChart({ requirements, stack, winner }) {
  const outcomes = OUTCOMES[winner] || OUTCOMES.dp;
  const reqSlice = requirements.slice(0, 3);
  const outSlice = outcomes.slice(0, 3);

  // Heights for connecting SVG (approximate, matches gap-5 spacing of items)
  const ITEM_H = 60; // px per item
  const REQ_TOTAL = reqSlice.length * ITEM_H;
  const OUT_TOTAL = outSlice.length * ITEM_H;
  const TECH_TOTAL = stack.length * 80;
  const SVG_H = Math.max(REQ_TOTAL, OUT_TOTAL, TECH_TOTAL) + 20;

  // Y centers for each group
  const reqCenters = reqSlice.map((_, i) => ((i + 0.5) / reqSlice.length) * REQ_TOTAL);
  const techCenters = stack.map((_, i) => ((i + 0.5) / stack.length) * TECH_TOTAL);
  const outCenters = outSlice.map((_, i) => ((i + 0.5) / outSlice.length) * OUT_TOTAL);

  const midY = SVG_H / 2;
  const reqOffset = midY - REQ_TOTAL / 2;
  const techOffset = midY - TECH_TOTAL / 2;
  const outOffset = midY - OUT_TOTAL / 2;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10">
      <div className="flex items-start gap-2 mb-8">
        <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">How It All Connects</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your requirements mapped to the recommended technology and the privacy outcomes you get</p>
        </div>
      </div>

      {/* Mobile: vertical stack */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your requirements</p>
          {reqSlice.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-lg">{r.icon}</span>
              <span className="text-sm text-slate-700 font-medium">{r.text}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pl-4 text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-lg">↓</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recommended stack</p>
          {stack.map((item) => {
            const tech = technologies[item.techId];
            const c = C[item.techId];
            return (
              <div key={item.techId} className={`${c.bg} text-white rounded-2xl px-5 py-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{tech.icon}</span>
                  <span className="font-bold text-base">{tech.name}</span>
                </div>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">{item.role}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pl-4 text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-lg">↓</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">What you get</p>
          {outSlice.map((o, i) => (
            <div key={i} className={`flex items-center gap-2 ${C[winner].light} border ${C[winner].border} rounded-xl px-4 py-3`}>
              <span className="text-lg">{o.icon}</span>
              <span className={`text-sm font-semibold ${C[winner].text}`}>{o.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 5-column SVG flow */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr 80px 180px 80px 1fr', alignItems: 'start' }}>
        {/* Requirements */}
        <div className="space-y-3 pt-1" style={{ paddingTop: `${reqOffset}px` }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Your requirements</p>
          {reqSlice.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-lg flex-shrink-0">{r.icon}</span>
              <span className="text-sm text-slate-700 font-medium leading-snug">{r.text}</span>
            </div>
          ))}
        </div>

        {/* Left connector SVG */}
        <svg viewBox={`0 0 80 ${SVG_H}`} className="w-full" style={{ height: `${SVG_H}px` }}>
          {reqSlice.map((_, i) => {
            const sy = reqOffset + reqCenters[i];
            const ey = techOffset + (TECH_TOTAL / 2);
            return (
              <path
                key={i}
                d={`M 0 ${sy} C 40 ${sy}, 40 ${ey}, 80 ${ey}`}
                stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeDasharray={i > 0 ? '4 2' : 'none'}
              />
            );
          })}
          <polygon points={`72,${techOffset + TECH_TOTAL / 2 - 5} 80,${techOffset + TECH_TOTAL / 2} 72,${techOffset + TECH_TOTAL / 2 + 5}`} fill="#94a3b8" />
        </svg>

        {/* Tech cards */}
        <div className="space-y-3" style={{ paddingTop: `${techOffset}px` }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recommended</p>
          {stack.map((item) => {
            const tech = technologies[item.techId];
            const c = C[item.techId];
            return (
              <div key={item.techId} className={`${c.bg} text-white rounded-2xl px-4 py-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{tech.icon}</span>
                  <span className="font-bold text-sm leading-tight">{tech.name}</span>
                </div>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">{item.role}</span>
              </div>
            );
          })}
        </div>

        {/* Right connector SVG */}
        <svg viewBox={`0 0 80 ${SVG_H}`} className="w-full" style={{ height: `${SVG_H}px` }}>
          {outSlice.map((_, i) => {
            const sy = techOffset + (TECH_TOTAL / 2);
            const ey = outOffset + outCenters[i];
            return (
              <path
                key={i}
                d={`M 0 ${sy} C 40 ${sy}, 40 ${ey}, 80 ${ey}`}
                stroke={C[winner].hex} strokeWidth="1.5" fill="none" opacity="0.6"
              />
            );
          })}
          {outSlice.map((_, i) => {
            const ey = outOffset + outCenters[i];
            return (
              <polygon key={i}
                points={`72,${ey - 5} 80,${ey} 72,${ey + 5}`}
                fill={C[winner].hex} opacity="0.7"
              />
            );
          })}
        </svg>

        {/* Outcomes */}
        <div className="space-y-3" style={{ paddingTop: `${outOffset}px` }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">What you get</p>
          {outSlice.map((o, i) => (
            <div key={i} className={`flex items-center gap-2 ${C[winner].light} border ${C[winner].border} rounded-xl px-4 py-3`}>
              <span className="text-lg flex-shrink-0">{o.icon}</span>
              <span className={`text-sm font-semibold ${C[winner].text} leading-snug`}>{o.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Visual 2: Radar Chart ────────────────────────────────────────────────────
const RADAR_AXES = [
  { key: 'privacy',    label: 'Privacy' },
  { key: 'utility',   label: 'Accuracy' },
  { key: 'compute',   label: 'Cost Eff.' },
  { key: 'scalability',label: 'Scalability' },
  { key: 'adoption',  label: 'Ease' },
  { key: 'compliance',label: 'Compliance' },
];

function RadarChart({ scores, idealProfile, hex }) {
  const cx = 150, cy = 150, r = 100;
  const N = RADAR_AXES.length;
  const angle = (i) => (i * 2 * Math.PI / N) - Math.PI / 2;
  const pt = (i, score) => [
    cx + r * (score / 100) * Math.cos(angle(i)),
    cy + r * (score / 100) * Math.sin(angle(i)),
  ];
  const labelPt = (i) => [
    cx + (r + 28) * Math.cos(angle(i)),
    cy + (r + 28) * Math.sin(angle(i)),
  ];

  const recPts = RADAR_AXES.map((a, i) => pt(i, (scores || {})[a.key] || 0).join(','));
  const idealPts = RADAR_AXES.map((a, i) => pt(i, (idealProfile || {})[a.key] || 0).join(','));

  // Parse hex to rgba
  const hexToRgba = (h, a) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-sm mx-auto">
      {/* Grid rings */}
      {[25, 50, 75, 100].map(lvl => (
        <polygon
          key={lvl}
          points={RADAR_AXES.map((_, i) => pt(i, lvl).join(',')).join(' ')}
          fill="none" stroke="#e2e8f0" strokeWidth="1"
        />
      ))}

      {/* Grid spokes */}
      {RADAR_AXES.map((_, i) => {
        const [ex, ey] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e2e8f0" strokeWidth="1" />;
      })}

      {/* User ideal polygon */}
      <polygon
        points={idealPts.join(' ')}
        fill="rgba(148,163,184,0.12)"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />

      {/* Recommended polygon */}
      <polygon
        points={recPts.join(' ')}
        fill={hexToRgba(hex, 0.18)}
        stroke={hex}
        strokeWidth="2.5"
      />

      {/* Dots on recommended polygon */}
      {RADAR_AXES.map((a, i) => {
        const [px, py] = pt(i, (scores || {})[a.key] || 0);
        return <circle key={i} cx={px} cy={py} r="4" fill={hex} />;
      })}

      {/* Axis labels */}
      {RADAR_AXES.map((a, i) => {
        const [lx, ly] = labelPt(i);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#64748b" fontWeight="700">
            {a.label}
          </text>
        );
      })}

      {/* Score ticks at 50% ring */}
      <text x={cx} y={cy - r * 0.5 - 4} textAnchor="middle" fontSize="8" fill="#94a3b8">50</text>
      <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize="8" fill="#94a3b8">100</text>
    </svg>
  );
}

// ─── Visual 3: Parameter Slider ───────────────────────────────────────────────
function ParamSlider({ simpleParam, winner }) {
  if (!simpleParam) return null;
  const c = C[winner];
  const { name, leftLabel, rightLabel, value, subvalue, pct, markers, context } = simpleParam;
  const clampedPct = Math.min(Math.max(pct, 4), 96);

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{name}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold ${c.text}`}>{value}</span>
          {subvalue && <span className="text-sm text-slate-400 font-medium">{subvalue}</span>}
        </div>
      </div>

      {/* Slider track */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1">← {leftLabel}</span>
          <span className="flex items-center gap-1">{rightLabel} →</span>
        </div>
        <div className="relative h-4 rounded-full bg-gradient-to-r from-emerald-100 via-yellow-100 to-red-100 border border-slate-200">
          {/* Filled portion */}
          <div
            className={`absolute left-0 top-0 bottom-0 rounded-full opacity-50 ${c.bar}`}
            style={{ width: `${clampedPct}%` }}
          />
          {/* Thumb */}
          <div
            className={`absolute top-1/2 w-6 h-6 rounded-full ${c.bg} shadow-lg border-2 border-white`}
            style={{ left: `${clampedPct}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        {/* Marker labels */}
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          {markers.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      {/* Context */}
      <p className={`text-sm ${c.text} font-medium bg-white rounded-lg px-3 py-2 border ${c.border}`}>
        {context}
      </p>
    </div>
  );
}

// ─── Visual 4: Parameter Impact Spectrum ─────────────────────────────────────
function ImpactBar({ curve, value }) {
  const barColor = curve.higherBetter
    ? (value >= 70 ? 'bg-emerald-500' : value >= 45 ? 'bg-amber-400' : 'bg-red-400')
    : (value <= 30 ? 'bg-emerald-500' : value <= 55 ? 'bg-amber-400' : 'bg-red-400');
  const textColor = curve.higherBetter
    ? (value >= 70 ? 'text-emerald-700' : value >= 45 ? 'text-amber-700' : 'text-red-600')
    : (value <= 30 ? 'text-emerald-700' : value <= 55 ? 'text-amber-700' : 'text-red-600');
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base w-6 flex-shrink-0">{curve.icon}</span>
        <span className="text-sm font-semibold text-slate-700 flex-1">{curve.label}</span>
        {curve.note && <span className="text-xs text-slate-400 italic">{curve.note}</span>}
        <span className={`text-sm font-extrabold w-8 text-right flex-shrink-0 ${textColor}`}>{value}</span>
      </div>
      <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className={`h-3 rounded-full transition-all duration-200 ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Visual4_ParameterImpact({ simpleParam, winner }) {
  const config = IMPACT_CURVES[winner];
  if (!simpleParam || !config || !simpleParam.recommendedZone) return null;

  const [pct, setPct] = useState(simpleParam.pct);
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const c = C[winner];

  const updateFromClient = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const newPct = Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
    setPct(newPct);
  }, []);

  const onMouseDown = (e) => {
    dragging.current = true;
    updateFromClient(e.clientX);
    const onMove = (e) => { if (dragging.current) updateFromClient(e.clientX); };
    const onUp   = () => { dragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const onTouchStart = (e) => {
    updateFromClient(e.touches[0].clientX);
    const onMove = (e) => updateFromClient(e.touches[0].clientX);
    const onEnd  = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  };

  const zone = simpleParam.recommendedZone;
  const inZone    = pct >= zone.from && pct <= zone.to;
  const belowZone = pct < zone.from;
  const thumbPct  = Math.min(96, Math.max(4, pct));

  const reason = inZone ? config.inZone : belowZone ? config.tooLow : config.tooHigh;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10">
      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">4</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Parameter Impact Spectrum</h2>
          <p className="text-sm text-slate-500 mt-0.5">Drag the slider to explore how your parameter choice affects privacy, accuracy, and risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Left: interactive slider ── */}
        <div>
          {/* Live value + zone badge */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-4xl font-extrabold tracking-tight ${c.text}`}>
              {config.pctToLabel(pct)}
            </span>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
              inZone
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {inZone ? '✓ Recommended zone' : '⚠ Outside recommended zone'}
            </span>
          </div>

          {/* Axis labels */}
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>← {simpleParam.leftLabel}</span>
            <span>{simpleParam.rightLabel} →</span>
          </div>

          {/* Track */}
          <div
            ref={trackRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="relative h-14 cursor-grab active:cursor-grabbing select-none rounded-2xl"
            style={{ touchAction: 'none' }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-100 via-yellow-100 to-red-100 border border-slate-200 overflow-hidden">
              {/* Recommended zone fill */}
              <div
                className={`absolute top-0 bottom-0 ${c.bar} opacity-30`}
                style={{ left: `${zone.from}%`, width: `${zone.to - zone.from}%` }}
              />
            </div>

            {/* Zone bracket lines */}
            <div className="absolute top-2 bottom-2 w-px border-l-2 border-dashed border-slate-400 opacity-70 z-10"
              style={{ left: `${zone.from}%` }} />
            <div className="absolute top-2 bottom-2 w-px border-r-2 border-dashed border-slate-400 opacity-70 z-10"
              style={{ right: `${100 - zone.to}%` }} />

            {/* Thumb */}
            <div
              className={`absolute top-1/2 w-9 h-9 rounded-full ${c.bg} shadow-xl border-4 border-white z-20`}
              style={{ left: `${thumbPct}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* Marker labels */}
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            {simpleParam.markers.map((m, i) => <span key={i}>{m}</span>)}
          </div>

          {/* Context explanation */}
          <div className={`mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3 border text-sm leading-relaxed ${
            inZone
              ? `${c.light} ${c.border} ${c.text}`
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span className="mt-0.5 flex-shrink-0 font-bold">{inZone ? '✓' : '⚠'}</span>
            <span>{reason}</span>
          </div>

          {/* Recommended zone info card */}
          <div className="mt-4 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-sm ${c.bar} opacity-70 flex-shrink-0`} />
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recommended range: </span>
              <span className={`text-sm font-extrabold ${c.text}`}>{simpleParam.zoneLabel}</span>
            </div>
          </div>
        </div>

        {/* ── Right: impact bars ── */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
            Impact at current setting
          </p>
          <div className="space-y-6">
            {config.curves.map((curve) => {
              const val = Math.min(100, Math.max(0, curve.fn(pct)));
              return <ImpactBar key={curve.label} curve={curve} value={val} />;
            })}
          </div>

          {/* Comparison: recommended vs. extremes */}
          <div className="mt-8 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tradeoff snapshot</p>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: 'At recommended zone', targetPct: (zone.from + zone.to) / 2, highlight: true },
                { label: 'At your current setting', targetPct: pct, highlight: false },
              ].map(({ label, targetPct, highlight }) => (
                <div key={label} className={`px-4 py-3 flex items-center gap-4 ${highlight ? `${c.light}` : ''}`}>
                  <span className={`text-xs font-semibold flex-1 ${highlight ? c.text : 'text-slate-500'}`}>{label}</span>
                  <div className="flex gap-3">
                    {config.curves.slice(0, 2).map((curve) => {
                      const v = Math.min(100, Math.max(0, curve.fn(targetPct)));
                      return (
                        <div key={curve.label} className="text-center">
                          <p className="text-xs text-slate-400">{curve.icon}</p>
                          <p className={`text-xs font-bold ${highlight ? c.text : 'text-slate-500'}`}>{v}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Alternatives (compact) ───────────────────────────────────────────────────
function AlternativeCard({ rejection }) {
  const tech = technologies[rejection.techId];
  const c = C[rejection.techId];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{tech.icon}</span>
        <p className="font-bold text-slate-800 text-sm">{tech.name}</p>
        <span className="ml-auto text-xs text-slate-400 font-medium">{rejection.percentage}% match</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-slate-600 leading-snug">{rejection.pros[0]}</p>
        </div>
        <div className="flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-xs text-slate-600 leading-snug">{rejection.cons[0]}</p>
        </div>
      </div>
      <div className={`text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-100`}>
        {rejection.reason}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResultCard({ result, onRestart }) {
  const {
    winner, winnerTech, techScores,
    requirements, tradeoffs, rejections,
    stack, simpleParam, idealProfile,
  } = result;

  const c = C[winner];
  const safeStack = stack || [{ techId: winner, role: 'Primary', requirement: winnerTech.tagline, why: '' }];
  const safeReqs = (requirements || []).filter(r => r.fit !== 'weak');

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-slate-800">Privacy Technology Advisor</span>
          </div>
          <button onClick={onRestart} className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start Over
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* ── Hero ── */}
        <div className={`rounded-3xl overflow-hidden shadow-md border ${c.border}`}>
          <div className={`${c.bg} px-8 py-10 text-white`}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Your Recommendation</p>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {safeStack.map((item, i) => {
                const tech = technologies[item.techId];
                return (
                  <div key={item.techId} className="flex items-center gap-2">
                    {i > 0 && <span className="text-white/40 font-bold text-xl">+</span>}
                    <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2">
                      <span className="text-2xl">{tech.icon}</span>
                      <div>
                        <p className="font-extrabold text-base leading-tight">{tech.name}</p>
                        <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">{item.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-white/80 text-lg max-w-2xl leading-relaxed font-light">{winnerTech.tagline}</p>
          </div>

          {/* Quick summary row */}
          <div className="bg-white px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
            {[
              { label: 'Privacy Strength',    value: `${(tradeoffs || {}).privacy || '—'}`,    suffix: '/100' },
              { label: 'Utility / Accuracy',  value: `${(tradeoffs || {}).utility || '—'}`,    suffix: '/100' },
              { label: 'Compliance Ready',    value: `${(tradeoffs || {}).compliance || '—'}`, suffix: '/100' },
              { label: 'Ease of Adoption',    value: `${(tradeoffs || {}).adoption || '—'}`,   suffix: '/100' },
            ].map((stat, i) => (
              <div key={i} className="pl-4 first:pl-0">
                <p className="text-xs text-slate-400 font-medium mb-0.5">{stat.label}</p>
                <p className={`text-2xl font-extrabold ${c.text}`}>
                  {stat.value}<span className="text-sm font-normal text-slate-300">{stat.suffix}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Visual 1: Flowchart ── */}
        <FlowChart requirements={safeReqs} stack={safeStack} winner={winner} />

        {/* ── Visuals 2 + 3: Radar + Slider ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Radar chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-start gap-2 mb-6">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Performance Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">Recommended solution vs. your ideal target</p>
              </div>
            </div>
            <RadarChart scores={tradeoffs} idealProfile={idealProfile} hex={c.hex} />
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded" style={{ background: c.hex }} />
                <span>Recommended</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded border-t-2 border-dashed border-slate-400" />
                <span>Your target</span>
              </div>
            </div>
          </div>

          {/* Parameter slider */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-start gap-2 mb-6">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recommended Setting</h2>
                <p className="text-xs text-slate-500 mt-0.5">Key tunable parameter for your scenario</p>
              </div>
            </div>

            {simpleParam ? (
              <div className="flex-1 flex flex-col justify-center">
                <ParamSlider simpleParam={simpleParam} winner={winner} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center gap-3 py-8">
                <span className="text-5xl">{winnerTech.icon}</span>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                  {winner === 'mpc'
                    ? 'Parameter selection for MPC should be determined in collaboration with a cryptography specialist based on your party count and threat model.'
                    : 'Configuration for this approach is primarily organizational and policy-based — consult your legal and privacy team.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Visual 4: Parameter Impact ── */}
        <Visual4_ParameterImpact simpleParam={simpleParam} winner={winner} />

        {/* ── Alternatives ── */}
        {rejections && rejections.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-bold text-slate-900">Why Other Options Were Not Selected</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rejections.map(r => <AlternativeCard key={r.techId} rejection={r} />)}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
            Decision-support guidance based on your 14-question assessment. Review all outputs with qualified privacy engineers and legal counsel before implementation.
          </p>
          <button
            onClick={onRestart}
            className="flex-shrink-0 py-2.5 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-400 hover:text-slate-900 transition-colors"
          >
            Retake Assessment
          </button>
        </div>

      </div>
    </div>
  );
}
