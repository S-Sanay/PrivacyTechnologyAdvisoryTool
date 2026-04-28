import { useState, useEffect, useRef, useCallback } from 'react';
import { technologies } from '../data/technologies';

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  anon:  { bg: 'bg-sky-600',     light: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700',    bar: 'bg-sky-500' },
  dp:    { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700',bar: 'bg-emerald-500' },
  mpc:   { bg: 'bg-violet-600',  light: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500' },
  fl:    { bg: 'bg-orange-500',  light: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' },
  legal: { bg: 'bg-amber-600',   light: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  bar: 'bg-amber-500' },
};

// ─── Per-tech tradeoff bullets ────────────────────────────────────────────────
const TRADEOFF_BULLETS = {
  anon: {
    gains: ['Publishable dataset anyone can freely query', 'No compute overhead — runs on standard hardware', 'HIPAA Safe Harbor & GDPR-recognised de-identification'],
    costs: ['No formal mathematical guarantee — vulnerable to background-knowledge attacks', 'Large k forces generalisation that reduces data detail', 'Static — does not suit live or frequently updated data'],
  },
  dp: {
    gains: ['Provable, auditable privacy guarantee (ε is quantifiable)', 'Works with repeated queries, ML training, and streaming data', 'Privacy budget is trackable across all uses of the dataset'],
    costs: ['Every result includes calibrated noise — no exact outputs', 'Requires careful budget management across queries', 'Harder to explain to non-technical stakeholders'],
  },
  mpc: {
    gains: ['No raw data ever leaves any party — zero disclosure', 'Results are exact with no noise or distortion', 'Cryptographic proof of privacy for all participants'],
    costs: ['High compute and network bandwidth requirements', 'All parties must be online simultaneously', 'Complex to implement, test, and audit correctly'],
  },
  fl: {
    gains: ['Raw data stays on each device or organisation', 'Scales to millions of distributed participants', 'Produces a shared model without centralising any data'],
    costs: ['Convergence requires many communication rounds', 'Gradient updates can leak partial information about local data', 'Requires reliable connectivity across all participating clients'],
  },
  legal: {
    gains: ['Zero technical overhead or infrastructure investment', 'Directly constrains what organisations are permitted to do', 'Enforceable with financial penalties, audits, and private rights of action'],
    costs: ['Relies on compliance and enforcement, not cryptography', 'Does not prevent a determined technical breach', 'Enforcement can be delayed or geographically inconsistent'],
  },
};

// ─── Collapsible section ──────────────────────────────────────────────────────
function CollapsibleSection({ title, badge, isOpen, onToggle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          {badge && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{badge}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Simple horizontal metric bar ────────────────────────────────────────────
function MetricBar({ label, value, barClass, icon }) {
  const pct = Math.min(100, Math.max(0, value));
  const levelText = pct >= 75 ? 'High' : pct >= 45 ? 'Medium' : 'Low';
  const levelColor = pct >= 75 ? 'text-emerald-600' : pct >= 45 ? 'text-amber-600' : 'text-red-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${levelColor}`}>{levelText}</span>
          <span className="text-xs text-slate-300 font-medium">{pct}/100</span>
        </div>
      </div>
      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Impact curves per technology ────────────────────────────────────────────
const IMPACT_CURVES = {
  dp: {
    pctToLabel: p => `ε = ${Math.pow(10, p / 100 * 3 - 2).toFixed(p < 45 ? 2 : 1)}`,
    curves: [
      { label: 'Privacy Strength',      icon: '🛡️', fn: p => Math.round(98 - p * 0.70), higherBetter: true },
      { label: 'Utility / Accuracy',    icon: '📊', fn: p => Math.round(28 + p * 0.67), higherBetter: true },
      { label: 'Compliance Confidence', icon: '⚖️', fn: p => Math.round(96 - p * 0.48), higherBetter: true },
      { label: 'Leakage Risk',          icon: '🔓', fn: p => Math.round(3  + p * 0.65), higherBetter: false },
    ],
    inZone:  'Balances a formal privacy guarantee with practical accuracy for most analytics workloads.',
    tooLow:  'Very low ε adds heavy noise — results may be too inaccurate for practical decisions.',
    tooHigh: 'High ε weakens the formal guarantee — individual records can meaningfully influence outputs.',
  },
  anon: {
    pctToLabel: p => `k = ${Math.round(p / 100 * 48 + 2)}`,
    curves: [
      { label: 'Re-ID Protection',   icon: '🛡️', fn: p => Math.round(32 + p * 0.60), higherBetter: true },
      { label: 'Data Utility',       icon: '📊', fn: p => Math.round(96 - p * 0.57), higherBetter: true },
      { label: 'Compliance Fit',     icon: '⚖️', fn: p => Math.round(42 + p * 0.52), higherBetter: true },
      { label: 'Re-ID Leakage Risk', icon: '🔓', fn: p => Math.round(80 - p * 0.68), higherBetter: false },
    ],
    inZone:  'Groups of 5–25 provide meaningful re-identification protection while keeping most values usable.',
    tooLow:  'Very small k (2–4) gives minimal protection — easy to narrow records down to a handful of candidates.',
    tooHigh: 'Very large k forces heavy generalisation, causing significant utility loss and suppression of rare records.',
  },
  fl: {
    pctToLabel: p => `${Math.round(p / 100 * 49 + 1)}%`,
    curves: [
      { label: 'Model Accuracy',     icon: '📊', fn: p => Math.round(38 + p * 0.52), higherBetter: true },
      { label: 'Gradient Privacy',   icon: '🛡️', fn: p => Math.round(88 - p * 0.30), higherBetter: true },
      { label: 'Compute Efficiency', icon: '⚡', fn: p => Math.round(96 - p * 0.52), higherBetter: true },
      { label: 'Gradient Leakage',   icon: '🔓', fn: p => Math.round(5  + p * 0.50), higherBetter: false },
    ],
    inZone:  'Sampling 5–10% of clients per round achieves good convergence while keeping compute and leakage risk low.',
    tooLow:  'Too few clients per round slows convergence and can introduce sampling bias in the global model.',
    tooHigh: 'High participation sharply increases per-round compute costs and gradient aggregation leakage.',
  },
};

// ─── Interactive parameter slider ─────────────────────────────────────────────
function ParamSlider({ simpleParam, winner }) {
  if (!simpleParam) return null;
  const c = C[winner];
  const config = IMPACT_CURVES[winner];
  const { name, subvalue, markers, recommendedZone, zoneLabel, leftLabel, rightLabel, description } = simpleParam;

  const [pct, setPct] = useState(simpleParam.pct);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const updateFromClient = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    setPct(Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))));
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

  const zone       = recommendedZone;
  const inZone     = zone && pct >= zone.from && pct <= zone.to;
  const belowZone  = zone && pct < zone.from;
  const thumbPct   = Math.min(96, Math.max(4, pct));
  const liveLabel  = config ? config.pctToLabel(pct) : simpleParam.value;
  const reason     = config ? (inZone ? config.inZone : belowZone ? config.tooLow : config.tooHigh) : null;

  return (
    <div className="space-y-5">
      {/* Name + description */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{name}</p>
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
      </div>

      {/* Live value + zone badge */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-3xl font-extrabold ${c.text}`}>{liveLabel}</span>
        {subvalue && <span className="text-sm text-slate-400">{subvalue}</span>}
        {zone && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            inZone
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {inZone ? '✓ Recommended zone' : '⚠ Outside recommended zone'}
          </span>
        )}
      </div>

      {/* Draggable track */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>← {leftLabel}</span>
          <span>{rightLabel} →</span>
        </div>
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="relative h-11 cursor-grab active:cursor-grabbing select-none rounded-xl"
          style={{ touchAction: 'none' }}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-100 via-yellow-100 to-red-100 border border-slate-200 overflow-hidden">
            {zone && (
              <div
                className={`absolute top-0 bottom-0 ${c.bar} opacity-25`}
                style={{ left: `${zone.from}%`, width: `${zone.to - zone.from}%` }}
              />
            )}
          </div>
          {/* Zone bracket lines */}
          {zone && (
            <>
              <div className="absolute top-2 bottom-2 w-px border-l-2 border-dashed border-slate-400 opacity-60 z-10" style={{ left: `${zone.from}%` }} />
              <div className="absolute top-2 bottom-2 w-px border-r-2 border-dashed border-slate-400 opacity-60 z-10" style={{ right: `${100 - zone.to}%` }} />
            </>
          )}
          {/* Thumb */}
          <div
            className={`absolute top-1/2 w-8 h-8 rounded-full ${c.bg} shadow-lg border-4 border-white z-20`}
            style={{ left: `${thumbPct}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          {markers.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      {/* Recommended range pill */}
      {zoneLabel && (
        <div className={`inline-flex items-center gap-2 text-xs ${c.light} ${c.border} border rounded-lg px-3 py-2`}>
          <div className={`w-2 h-2 rounded-sm ${c.bar} opacity-70 flex-shrink-0`} />
          <span className="text-slate-500">Recommended range:</span>
          <span className={`font-bold ${c.text}`}>{zoneLabel}</span>
        </div>
      )}

      {/* Context explanation */}
      {reason && (
        <p className={`text-sm rounded-lg px-3 py-2.5 border leading-relaxed ${
          inZone
            ? `${c.light} ${c.border} ${c.text}`
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {inZone ? '✓ ' : '⚠ '}{reason}
        </p>
      )}

      {/* Impact bars */}
      {config && (
        <div className="pt-1 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impact at current setting</p>
          {config.curves.map(curve => {
            const val = Math.min(100, Math.max(0, curve.fn(pct)));
            const good = curve.higherBetter ? val >= 65 : val <= 35;
            const warn = curve.higherBetter ? val < 35  : val > 65;
            const barColor = good ? 'bg-emerald-500' : warn ? 'bg-red-400' : 'bg-amber-400';
            const textColor = good ? 'text-emerald-700' : warn ? 'text-red-600' : 'text-amber-700';
            return (
              <div key={curve.label}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm w-5 flex-shrink-0">{curve.icon}</span>
                  <span className="text-xs font-medium text-slate-600 flex-1">{curve.label}</span>
                  {!curve.higherBetter && <span className="text-xs text-slate-400 italic">lower is better</span>}
                  <span className={`text-xs font-bold w-7 text-right flex-shrink-0 ${textColor}`}>{val}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all duration-150 ${barColor}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResultCard({ result, onRestart }) {
  const {
    winner, winnerTech,
    requirements, tradeoffs, rejections,
    stack, simpleParam,
  } = result;

  const c = C[winner];
  const safeStack = stack || [{ techId: winner, role: 'Primary' }];
  const safeReqs  = (requirements || []).filter(r => r.fit !== 'weak');

  // Chip interaction
  const [activeChip,  setActiveChip]  = useState(null);
  const [hoveredChip, setHoveredChip] = useState(null);
  const highlightedChip = activeChip ?? hoveredChip;

  // Collapsible sections — all closed by default
  const [open, setOpen] = useState({ match: false, tradeoffs: false, others: false });
  const toggle = key => setOpen(s => ({ ...s, [key]: !s[key] }));

  // Auto-open "Requirement Match" when a chip is highlighted
  useEffect(() => {
    if (highlightedChip !== null) setOpen(s => ({ ...s, match: true }));
  }, [highlightedChip]);

  const bullets = TRADEOFF_BULLETS[winner] || { gains: [], costs: [] };

  const METRICS = [
    { label: 'Privacy Strength',   key: 'privacy',     icon: '🛡️', barClass: 'bg-emerald-500' },
    { label: 'Utility / Accuracy', key: 'utility',     icon: '📊', barClass: 'bg-blue-500'    },
    { label: 'Cost Efficiency',    key: 'compute',     icon: '⚡', barClass: 'bg-amber-500'   },
    { label: 'Scalability',        key: 'scalability', icon: '📈', barClass: 'bg-purple-500'  },
    { label: 'Compliance Fit',     key: 'compliance',  icon: '⚖️', barClass: 'bg-teal-500'    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-slate-800">Privacy Technology Advisor</span>
          </div>
          <button
            onClick={onRestart}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start Over
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">

        {/* ── 1. Hero ── */}
        <div className={`rounded-2xl overflow-hidden shadow-sm border ${c.border}`}>
          <div className={`${c.bg} px-7 py-8 text-white`}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Recommended Approach</p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {safeStack.map((item, i) => {
                const tech = technologies[item.techId];
                return (
                  <div key={item.techId} className="flex items-center gap-2">
                    {i > 0 && <span className="text-white/40 font-bold text-xl">+</span>}
                    <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
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
            <p className="text-white/80 text-base max-w-xl leading-relaxed">{winnerTech.tagline}</p>
          </div>

          {/* Quick stats strip */}
          <div className="bg-white px-7 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
            {[
              { label: 'Privacy',    key: 'privacy'    },
              { label: 'Accuracy',   key: 'utility'    },
              { label: 'Compliance', key: 'compliance' },
              { label: 'Ease',       key: 'adoption'   },
            ].map(stat => (
              <div key={stat.key} className="pl-4 first:pl-0">
                <p className="text-xs text-slate-400 font-medium mb-0.5">{stat.label}</p>
                <p className={`text-2xl font-extrabold ${c.text}`}>
                  {(tradeoffs || {})[stat.key] || '—'}
                  <span className="text-sm font-normal text-slate-300">/100</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Key Requirements Considered (chips) ── */}
        {safeReqs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Requirements Considered</p>
            <div className="flex flex-wrap gap-2">
              {safeReqs.map((req, i) => {
                const isHighlighted = highlightedChip === i;
                const isPinned     = activeChip === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveChip(activeChip === i ? null : i)}
                    onMouseEnter={() => setHoveredChip(i)}
                    onMouseLeave={() => setHoveredChip(null)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer ${
                      isHighlighted
                        ? `${c.light} ${c.border} ${c.text} shadow-sm`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{req.icon}</span>
                    <span className="max-w-[180px] truncate">{req.text}</span>
                    {isPinned && <span className="text-xs opacity-70">✓</span>}
                  </button>
                );
              })}
            </div>
            {highlightedChip !== null && (
              <p className="mt-3 text-xs text-slate-400 italic">
                {activeChip !== null
                  ? 'Pinned — see highlighted item in Requirement Match below'
                  : 'Click to pin · see matching item in Requirement Match below'}
              </p>
            )}
          </div>
        )}

        {/* ── 3. Why this was chosen (3 collapsibles) ── */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Why This Was Chosen</p>
          <div className="space-y-2">

            {/* 3a. Requirement Match */}
            <CollapsibleSection
              title="Requirement Match"
              badge={`${safeReqs.length} matched`}
              isOpen={open.match}
              onToggle={() => toggle('match')}
            >
              <div className="pt-4 space-y-1.5">
                {safeReqs.map((req, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      highlightedChip === i
                        ? `${c.light} border ${c.border}`
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{req.icon}</span>
                    <span className={`text-sm flex-1 ${
                      highlightedChip === i ? `font-bold ${c.text}` : 'text-slate-700'
                    }`}>
                      {req.text}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      req.fit === 'strong'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.fit === 'strong' ? 'Strong' : 'Fits'}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* 3b. Tradeoffs */}
            <CollapsibleSection
              title="Tradeoffs"
              isOpen={open.tradeoffs}
              onToggle={() => toggle('tradeoffs')}
            >
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2.5">You gain</p>
                  <ul className="space-y-2">
                    {bullets.gains.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">+</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">You give up</p>
                  <ul className="space-y-2">
                    {bullets.costs.map((cost, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-slate-400 font-bold mt-0.5 flex-shrink-0">−</span>
                        {cost}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CollapsibleSection>

            {/* 3c. Why not others */}
            {rejections && rejections.length > 0 && (
              <CollapsibleSection
                title="Why not other technologies"
                badge={`${rejections.length} considered`}
                isOpen={open.others}
                onToggle={() => toggle('others')}
              >
                <div className="pt-4 space-y-2.5">
                  {rejections.map(r => {
                    const tech = technologies[r.techId];
                    return (
                      <div key={r.techId} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xl flex-shrink-0">{tech.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 mb-0.5">{tech.name}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{r.reason}</p>
                        </div>
                        <span className="text-xs text-slate-400 font-medium flex-shrink-0">{r.percentage}% match</span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>

        {/* ── 4. Performance Metrics (simple bars) ── */}
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Performance Profile</p>
          <div className="space-y-4">
            {METRICS.map(m => (
              <MetricBar
                key={m.key}
                label={m.label}
                value={(tradeoffs || {})[m.key] || 0}
                barClass={m.barClass}
                icon={m.icon}
              />
            ))}
          </div>
        </div>

        {/* ── 5. Parameter Guidance ── */}
        {simpleParam ? (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Recommended Settings</p>
            <ParamSlider simpleParam={simpleParam} winner={winner} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recommended Settings</p>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{winnerTech.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {winner === 'mpc' ? 'No single tunable parameter' : 'No technical parameter'}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {winner === 'mpc'
                    ? 'Key decisions are structural: number of parties, corruption threshold, and protocol choice. Work with a cryptography specialist to finalise these before implementation.'
                    : 'Configuration is policy-based: consent requirements, retention limits, access restrictions, breach notification obligations, and audit procedures.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
            Decision-support guidance based on your assessment. Review all outputs with qualified privacy engineers and legal counsel before implementation.
          </p>
          <button
            onClick={onRestart}
            className="flex-shrink-0 py-2 px-5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-400 hover:text-slate-900 transition-colors"
          >
            Retake Assessment
          </button>
        </div>

      </div>
    </div>
  );
}
