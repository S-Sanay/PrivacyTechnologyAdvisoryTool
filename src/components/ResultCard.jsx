import { useState } from 'react';
import { technologies } from '../data/technologies';

// ─── Static tradeoff content ───────────────────────────────────────────────────
const TRADEOFF_BULLETS = {
  anon: {
    gains: [
      'Publishable dataset anyone can freely query',
      'No compute overhead — runs on standard hardware',
      'HIPAA Safe Harbor & GDPR-recognised de-identification',
    ],
    costs: [
      'No formal mathematical guarantee — vulnerable to background-knowledge attacks',
      'Large k forces generalisation that reduces data detail',
      'Static — does not suit live or frequently updated data',
    ],
  },
  dp: {
    gains: [
      'Provable, auditable privacy guarantee (ε is quantifiable)',
      'Works with repeated queries, ML training, and streaming data',
      'Privacy budget is trackable across all uses of the dataset',
    ],
    costs: [
      'Every result includes calibrated noise — no exact outputs',
      'Requires careful budget management across queries',
      'Harder to explain to non-technical stakeholders',
    ],
  },
  mpc: {
    gains: [
      'No raw data ever leaves any party — zero disclosure',
      'Results are exact with no noise or distortion',
      'Cryptographic proof of privacy for all participants',
    ],
    costs: [
      'High compute and network bandwidth requirements',
      'All parties must be online simultaneously',
      'Complex to implement, test, and audit correctly',
    ],
  },
  fl: {
    gains: [
      'Raw data stays on each device or organisation',
      'Scales to millions of distributed participants',
      'Produces a shared model without centralising any data',
    ],
    costs: [
      'Convergence requires many communication rounds',
      'Gradient updates can leak partial information about local data',
      'Requires reliable connectivity across all participating clients',
    ],
  },
  legal: {
    gains: [
      'Zero technical overhead or infrastructure investment',
      'Directly constrains what organisations are permitted to do',
      'Enforceable with financial penalties, audits, and private rights of action',
    ],
    costs: [
      'Relies on compliance and enforcement, not cryptography',
      'Does not prevent a determined technical breach',
      'Enforcement can be delayed or geographically inconsistent',
    ],
  },
};

// ─── Slider parameter helpers ──────────────────────────────────────────────────

function computeParamValue(winner, pct, simpleParam) {
  if (winner === 'dp') {
    const eps = Math.pow(10, (pct / 100) * 3 - 2);
    const f = eps < 0.1 ? eps.toFixed(3) : eps < 1 ? eps.toFixed(2) : eps.toFixed(1);
    const strength =
      eps < 0.5  ? 'Strong privacy'
      : eps < 1  ? 'Moderate–strong'
      : eps < 3  ? 'Moderate privacy'
                 : 'Weak privacy';
    return { primary: `ε = ${f}`, badge: strength, mode: simpleParam.subvalue };
  }
  if (winner === 'anon') {
    const k = Math.round(2 + (pct / 100) * 48);
    const range =
      k < 5   ? 'Below recommended minimum'
      : k <= 10 ? 'Standard (conservative)'
      : k <= 25 ? 'Standard'
                : 'High protection';
    return { primary: `k = ${k}`, badge: range };
  }
  if (winner === 'fl') {
    const rate = Math.round(1 + (pct / 100) * 49);
    return { primary: `${rate}%`, badge: 'of clients per round' };
  }
  return { primary: '—', badge: null };
}

function computeAspects(winner, pct) {
  if (winner === 'dp') {
    const eps = Math.pow(10, (pct / 100) * 3 - 2);
    return [
      {
        label: 'Privacy Guarantee Strength',
        value: Math.round(100 - pct),
      },
      {
        label: 'Output Accuracy',
        value: Math.round(pct),
      },
      {
        label: 'Noise per Query',
        value: Math.round(Math.pow((100 - pct) / 100, 0.65) * 95),
      },
      {
        label: 'Regulatory / HIPAA Fit',
        value: eps < 0.5 ? 93 : eps < 1 ? 80 : eps < 3 ? 52 : eps < 6 ? 28 : 12,
      },
    ];
  }
  if (winner === 'anon') {
    const k = Math.round(2 + (pct / 100) * 48);
    return [
      {
        label: 'Re-identification Protection',
        value: Math.round(Math.min(95, pct * 0.9 + 5)),
      },
      {
        label: 'Data Utility Retained',
        value: Math.round(Math.max(15, 100 - pct * 0.75)),
      },
      {
        label: 'Record Retention Rate',
        value: Math.round(Math.max(20, 100 - pct * 0.65)),
      },
      {
        label: 'Regulatory Compliance Fit',
        value: k >= 10 ? 90 : k >= 5 ? 72 : k >= 3 ? 48 : 22,
      },
    ];
  }
  if (winner === 'fl') {
    return [
      {
        label: 'Convergence Speed',
        value: Math.round(Math.min(93, pct * 0.87 + 6)),
      },
      {
        label: 'Gradient Representation Quality',
        value: Math.round(Math.min(90, pct * 0.82 + 9)),
      },
      {
        label: 'Dropout Resilience',
        value: Math.round(Math.max(12, 100 - pct * 0.86)),
      },
      {
        label: 'Round Efficiency',
        value: Math.round(Math.max(12, 100 - pct * 0.82)),
      },
    ];
  }
  return [];
}

const ZONE_TEXT = {
  dp: {
    low: {
      title: 'Too restrictive — excessive noise',
      text: 'At very small ε, the formal guarantee is extremely strong but calibrated noise dominates query outputs. For most dataset sizes and statistical queries, results will be too inaccurate to be actionable. Appropriate only when maximum privacy is the absolute priority and significant utility loss is accepted.',
    },
    recommended: {
      title: 'Recommended — balanced privacy and utility',
      text: "This range delivers a strong, auditable (ε, δ) guarantee while keeping noise small relative to most statistical signals. It is the operational range used by the US Census Bureau's 2020 Census, Apple's privacy-preserving analytics, and most HIPAA Expert Determination submissions.",
    },
    high: {
      title: 'Too permissive — privacy guarantee weakens',
      text: 'At large ε, output noise is minimal but the formal privacy guarantee degrades significantly. At ε > 3, individual-level inference becomes increasingly feasible for a well-resourced adversary. Most regulatory frameworks and privacy engineering standards consider ε > 3 insufficient for sensitive or regulated data.',
    },
  },
  anon: {
    low: {
      title: 'Too small — limited re-identification protection',
      text: 'Small equivalence groups provide minimal protection. With auxiliary knowledge from public records, linked databases, or background information, an adversary can often single out individuals within groups of 2–4. HIPAA Safe Harbor guidance and most academic and regulatory standards recommend k ≥ 5 as a practical minimum.',
    },
    recommended: {
      title: 'Recommended — balanced protection and utility',
      text: 'Provides meaningful re-identification protection while preserving dataset utility. Most records can be generalized without suppression, group sizes resist typical re-identification attacks, and the dataset remains analytically useful. This range aligns with HIPAA Safe Harbor evidence and GDPR de-identification requirements.',
    },
    high: {
      title: 'Too large — significant utility loss',
      text: 'Very high k delivers strong protection, but at substantial cost. Heavy generalization collapses granular fields (ages → decades, ZIP codes → regions) and forces suppression of records that cannot form groups of k — often removing minority subgroups entirely. Dataset utility for downstream analysis degrades substantially.',
    },
  },
  fl: {
    low: {
      title: 'Too few clients — slow convergence',
      text: "Very low participation means each round's gradient update is a poor statistical approximation of the true global gradient. Estimates are high-variance and biased toward whichever clients happen to be selected. Many more training rounds are required to reach equivalent convergence, dramatically increasing total training time.",
    },
    recommended: {
      title: 'Recommended — balanced convergence and efficiency',
      text: 'At 5–10%, gradient estimates are statistically representative of the full federation while per-round coordination overhead remains tractable. Rounds complete reliably even with participant dropouts. This is the standard participation range in production Federated Learning deployments at Google and Apple.',
    },
    high: {
      title: 'Too many clients — coordination overhead',
      text: 'Coordinating a large fraction of participants per round increases per-round latency, makes rounds more vulnerable to stragglers and dropouts, and delivers diminishing accuracy returns. Practical FL deployments rarely exceed 10–15% participation per round — the marginal gain from additional clients drops off quickly.',
    },
  },
};

function getZoneInfo(winner, pct, recommendedZone) {
  const zone =
    pct < recommendedZone.from ? 'low'
    : pct <= recommendedZone.to ? 'recommended'
    : 'high';
  return { zone, ...(ZONE_TEXT[winner]?.[zone] || { title: '', text: '' }) };
}

// ─── Shared icon ──────────────────────────────────────────────────────────────
function Chevron({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value }) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor = pct >= 70 ? '#059669' : pct >= 45 ? '#D97706' : '#DC2626';
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-[#6B7280] w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-[#F0F1F3] h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-xs font-semibold text-[#0F1117] w-8 text-right flex-shrink-0">{pct}</span>
    </div>
  );
}

// ─── Collapsible (inside a card — no own outer border) ────────────────────────
function InnerCollapsible({ title, badge, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F7F8FA] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#0F1117]">{title}</span>
          {badge && (
            <span className="text-xs text-[#9CA3AF] border border-[#E2E4E9] px-2 py-0.5 rounded-sm font-medium">
              {badge}
            </span>
          )}
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-[#E2E4E9]">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Expandable factor row (Section 5) ────────────────────────────────────────
function FactorRow({ req, winnerName }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E2E4E9] last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 text-left hover:bg-[#F7F8FA] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm flex-shrink-0 w-5 text-center">{req.icon}</span>
          <span className="text-sm text-[#0F1117] leading-snug">{req.text}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <span
            className={`text-xs font-semibold px-2 py-0.5 border rounded-sm ${
              req.fit === 'strong'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {req.fit === 'strong' ? 'Strong fit' : 'Good fit'}
          </span>
          <Chevron open={open} />
        </div>
      </button>
      {open && (
        <div className="pb-4 pl-8 pr-1">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#2563EB] text-xs font-bold mt-0.5 flex-shrink-0">→</span>
              <span className="text-xs text-[#6B7280] leading-relaxed">{req.how}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C5C8D0] text-xs font-bold mt-0.5 flex-shrink-0">→</span>
              <span className="text-xs text-[#9CA3AF] leading-relaxed">
                {req.fit === 'strong'
                  ? `${winnerName} is a strong match for this requirement.`
                  : `${winnerName} addresses this requirement with some inherent tradeoffs.`}
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Interactive Parameter Slider ─────────────────────────────────────────────
function InteractiveParamSlider({ simpleParam, winner }) {
  const { name, leftLabel, rightLabel, markers, recommendedZone, zoneLabel, description } = simpleParam;
  const [sliderPct, setSliderPct] = useState(simpleParam.pct);

  const paramVal  = computeParamValue(winner, sliderPct, simpleParam);
  const aspects   = computeAspects(winner, sliderPct);
  const zoneInfo  = getZoneInfo(winner, sliderPct, recommendedZone);

  const zoneColors = {
    low:         { bg: 'bg-amber-50',   border: 'border-amber-200',   title: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700 border-amber-200'   },
    recommended: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    high:        { bg: 'bg-red-50',     border: 'border-red-200',     title: 'text-red-700',     badge: 'bg-red-100 text-red-700 border-red-200'           },
  };
  const zc = zoneColors[zoneInfo.zone];

  return (
    <div className="space-y-6">

      {/* Name + current value */}
      <div>
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">{name}</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl font-bold text-[#0F1117]">{paramVal.primary}</span>
          {paramVal.mode && (
            <span className="text-sm text-[#9CA3AF]">{paramVal.mode}</span>
          )}
          {paramVal.badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 border rounded-sm ${zc.badge}`}>
              {paramVal.badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-[#6B7280] mt-2 leading-relaxed max-w-lg">{description}</p>
        )}
      </div>

      {/* Slider */}
      <div>
        <div className="flex justify-between text-xs text-[#9CA3AF] mb-2">
          <span>← {leftLabel}</span>
          <span>{rightLabel} →</span>
        </div>

        <div className="relative h-8 select-none">
          {/* Track with zone coloring */}
          <div className="absolute inset-0 flex rounded-sm overflow-hidden border border-[#E2E4E9]">
            <div style={{ width: `${recommendedZone.from}%` }} className="bg-[#F0F1F3]" />
            <div
              style={{ width: `${recommendedZone.to - recommendedZone.from}%` }}
              className="bg-[#DBEAFE] border-x border-[#93C5FD] flex items-center justify-center"
            >
              <span className="text-[10px] font-semibold text-[#2563EB] select-none">Recommended</span>
            </div>
            <div style={{ width: `${100 - recommendedZone.to}%` }} className="bg-[#F0F1F3]" />
          </div>

          {/* Thumb vertical line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#111827] pointer-events-none z-10"
            style={{ left: `${sliderPct}%` }}
          />

          {/* Thumb circle */}
          <div
            className="absolute w-5 h-5 bg-white border-2 border-[#111827] rounded-full shadow-md pointer-events-none z-10"
            style={{ left: `${sliderPct}%`, top: '50%', transform: 'translateX(-50%) translateY(-50%)' }}
          />

          {/* Invisible range input overlay — handles all interaction */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderPct}
            onChange={e => setSliderPct(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            style={{ margin: 0, padding: 0 }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1.5">
          {markers.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      {/* Zone description — updates as slider moves */}
      <div className={`border rounded-sm px-4 py-3 transition-colors duration-150 ${zc.bg} ${zc.border}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${zc.title}`}>
          {zoneInfo.title}
        </p>
        <p className="text-xs text-[#6B7280] leading-relaxed">{zoneInfo.text}</p>
      </div>

      {/* Dynamic aspects — 4 bars that update as slider moves */}
      <div>
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">
          Impact at Current Setting
        </p>
        <div className="space-y-3.5">
          {aspects.map((a, i) => (
            <MetricRow key={i} label={a.label} value={a.value} />
          ))}
        </div>
      </div>

      {/* Recommended zone legend */}
      {zoneLabel && (
        <div className="flex items-center gap-2 text-xs pt-2 border-t border-[#E2E4E9]">
          <div className="w-3 h-3 bg-[#DBEAFE] border border-[#93C5FD] flex-shrink-0" />
          <span className="text-[#6B7280]">Recommended range:</span>
          <span className="font-semibold text-[#2563EB]">{zoneLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResultCard({ result, onRestart }) {
  const { winner, winnerTech, requirements, tradeoffs, rejections, stack, simpleParam } = result;

  const safeStack = stack || [{ techId: winner, role: 'Primary' }];
  const safeReqs  = (requirements || []).filter(r => r.fit !== 'weak');
  const bullets   = TRADEOFF_BULLETS[winner] || { gains: [], costs: [] };

  const METRICS = [
    { label: 'Privacy Strength',   key: 'privacy'     },
    { label: 'Utility / Accuracy', key: 'utility'     },
    { label: 'Scalability',        key: 'scalability' },
    { label: 'Compliance Fit',     key: 'compliance'  },
    { label: 'Cost Efficiency',    key: 'compute'     },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Nav ── */}
      <div className="bg-white border-b border-[#E2E4E9] px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[#2563EB] rounded-sm flex-shrink-0" />
            <span className="text-sm font-semibold text-[#0F1117]">Privacy Architecture Advisor</span>
          </div>
          <button
            onClick={onRestart}
            className="text-sm font-medium text-[#6B7280] hover:text-[#0F1117] transition-colors"
          >
            ← New Assessment
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">

        {/* ── 1. Primary Recommendation ── */}
        <div className="bg-white border border-[#E2E4E9] overflow-hidden">
          <div className="h-1 bg-[#2563EB]" />
          <div className="px-7 py-7">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-5">
              Recommended Privacy Strategy
            </p>

            {/* Tech stack */}
            <div className="flex flex-wrap items-start gap-8 mb-6">
              {safeStack.map((item, i) => {
                const tech = technologies[item.techId];
                return (
                  <div key={item.techId} className={i > 0 ? 'pl-8 border-l border-[#E2E4E9]' : ''}>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                      {item.role}
                    </p>
                    <p className={`font-bold text-[#0F1117] leading-tight ${i === 0 ? 'text-2xl' : 'text-base'}`}>
                      {tech.name}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-[#6B7280] leading-relaxed border-t border-[#E2E4E9] pt-5">
              {winnerTech.tagline}
            </p>
          </div>

          {/* Stats strip */}
          <div className="border-t border-[#E2E4E9] bg-[#F7F8FA] px-7 py-4 grid grid-cols-2 sm:grid-cols-4 sm:divide-x divide-[#E2E4E9] gap-y-4">
            {[
              { label: 'Privacy',          key: 'privacy'    },
              { label: 'Accuracy',         key: 'utility'    },
              { label: 'Compliance',       key: 'compliance' },
              { label: 'Ease of Adoption', key: 'adoption'   },
            ].map(stat => (
              <div key={stat.key} className="sm:px-4 sm:first:pl-0">
                <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-0.5">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-[#0F1117]">
                  {(tradeoffs || {})[stat.key] || '—'}
                  <span className="text-xs font-normal text-[#C5C8D0] ml-0.5">/100</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Performance Profile ── */}
        <div className="bg-white border border-[#E2E4E9] px-6 py-6">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-5">
            Performance Profile
          </p>
          <div className="space-y-3.5">
            {METRICS.map(m => (
              <MetricRow
                key={m.key}
                label={m.label}
                value={(tradeoffs || {})[m.key] || 0}
              />
            ))}
          </div>
        </div>

        {/* ── 3. Analysis ── */}
        <div className="bg-white border border-[#E2E4E9]">
          <div className="px-6 py-4 border-b border-[#E2E4E9]">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Analysis</p>
          </div>
          <div className="divide-y divide-[#E2E4E9]">

            {/* 3a. Why this recommendation */}
            <InnerCollapsible
              title="Why this recommendation"
              badge={`${safeReqs.length} factors`}
            >
              <div className="pt-4 space-y-0.5">
                {safeReqs.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5 border-b border-[#F0F1F3] last:border-0"
                  >
                    <span className="flex-shrink-0 mt-0.5 text-sm">{req.icon}</span>
                    <span className="text-sm text-[#0F1117] flex-1 leading-snug">{req.text}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 border rounded-sm flex-shrink-0 ${
                        req.fit === 'strong'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {req.fit === 'strong' ? 'Strong' : 'Fits'}
                    </span>
                  </div>
                ))}
              </div>
            </InnerCollapsible>

            {/* 3b. Tradeoffs */}
            <InnerCollapsible title="Tradeoffs">
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">
                    Advantages
                  </p>
                  <ul className="space-y-2">
                    {bullets.gains.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold text-sm mt-0.5 flex-shrink-0">+</span>
                        <span className="text-sm text-[#0F1117]">{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">
                    Limitations
                  </p>
                  <ul className="space-y-2">
                    {bullets.costs.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#C5C8D0] font-bold text-sm mt-0.5 flex-shrink-0">−</span>
                        <span className="text-sm text-[#6B7280]">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </InnerCollapsible>

            {/* 3c. Alternatives considered */}
            {rejections && rejections.length > 0 && (
              <InnerCollapsible
                title="Alternatives considered"
                badge={`${rejections.length} evaluated`}
              >
                <div className="pt-4 space-y-0.5">
                  {rejections.map(r => {
                    const tech = technologies[r.techId];
                    return (
                      <div
                        key={r.techId}
                        className="py-3 border-b border-[#F0F1F3] last:border-0"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-[#0F1117]">{tech.name}</span>
                          <span className="text-xs text-[#9CA3AF]">{r.percentage}% match score</span>
                        </div>
                        <p className="text-xs text-[#6B7280] leading-relaxed">{r.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </InnerCollapsible>
            )}
          </div>
        </div>

        {/* ── 4. Configuration Guidance ── */}
        <div className="bg-white border border-[#E2E4E9] px-6 py-6">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-5">
            Configuration Guidance
          </p>
          {simpleParam ? (
            <InteractiveParamSlider simpleParam={simpleParam} winner={winner} />
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#F0F1F3] border border-[#E2E4E9] flex items-center justify-center flex-shrink-0 text-base rounded-sm">
                {winnerTech.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1117] mb-1.5">
                  {winner === 'mpc' ? 'No single tunable parameter' : 'Policy-based configuration'}
                </p>
                <p className="text-sm text-[#6B7280] leading-relaxed max-w-xl">
                  {winner === 'mpc'
                    ? 'Key decisions are structural: number of parties, corruption threshold, and protocol choice. Work with a cryptography specialist to finalise these before implementation.'
                    : 'Configuration is policy-based: consent requirements, retention limits, access restrictions, breach notification obligations, and audit procedures.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Key Decision Factors ── */}
        {safeReqs.length > 0 && (
          <div className="bg-white border border-[#E2E4E9] px-6 py-6">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">
              Key Factors Influencing This Decision
            </p>
            <div>
              {safeReqs.slice(0, 5).map((req, i) => (
                <FactorRow key={i} req={req} winnerName={winnerTech.name} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 pb-8 border-t border-[#E2E4E9]">
          <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-lg">
            This assessment provides decision-support guidance only. All recommendations should be
            reviewed by qualified privacy engineers and legal counsel before implementation.
          </p>
          <button
            onClick={onRestart}
            className="flex-shrink-0 text-sm font-semibold text-[#6B7280] hover:text-[#0F1117] border border-[#E2E4E9] hover:border-[#C5C8D0] px-4 py-2 rounded transition-colors"
          >
            Retake Assessment
          </button>
        </div>

      </div>
    </div>
  );
}
