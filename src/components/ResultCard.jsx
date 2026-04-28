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

// ─── Parameter effect descriptions ────────────────────────────────────────────
const PARAM_EFFECT = {
  'Privacy Budget (ε)':
    'Decreasing ε (moving left) adds more noise for a stronger formal guarantee. Increasing ε (moving right) reduces noise for more accurate outputs but weakens the bound.',
  'K-Anonymity Level':
    'Increasing k (moving right) requires larger equivalence groups, strengthening re-identification protection at the cost of greater data generalisation.',
  'Client Participation Rate':
    'Higher participation per round improves convergence speed but raises per-round compute and gradient aggregation overhead. Lower rates are more efficient but converge more slowly.',
};

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
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
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

// ─── Static parameter range bar (replaces interactive slider) ─────────────────
function StaticParamBar({ simpleParam }) {
  const { name, value, subvalue, leftLabel, rightLabel, markers, recommendedZone, zoneLabel, description } = simpleParam;
  const effect = PARAM_EFFECT[name];

  return (
    <div className="space-y-5">
      {/* Name + value */}
      <div>
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">{name}</p>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-[#0F1117]">{value}</span>
          {subvalue && <span className="text-sm text-[#9CA3AF]">{subvalue}</span>}
        </div>
        {description && (
          <p className="text-xs text-[#6B7280] mt-2 leading-relaxed max-w-lg">{description}</p>
        )}
      </div>

      {/* Range bar */}
      <div>
        <div className="flex justify-between text-xs text-[#9CA3AF] mb-2">
          <span>← {leftLabel}</span>
          <span>{rightLabel} →</span>
        </div>
        <div className="flex h-7 rounded-sm overflow-hidden border border-[#E2E4E9]">
          {recommendedZone ? (
            <>
              <div
                style={{ width: `${recommendedZone.from}%` }}
                className="bg-[#F0F1F3] flex-shrink-0"
              />
              <div
                style={{ width: `${recommendedZone.to - recommendedZone.from}%` }}
                className="bg-[#DBEAFE] border-x border-[#93C5FD] flex-shrink-0 flex items-center justify-center"
              >
                <span className="text-[10px] font-semibold text-[#2563EB] select-none">
                  Recommended
                </span>
              </div>
              <div
                style={{ width: `${100 - recommendedZone.to}%` }}
                className="bg-[#F0F1F3] flex-shrink-0"
              />
            </>
          ) : (
            <div className="flex-1 bg-[#F0F1F3]" />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1.5">
          {markers.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      {/* Zone label */}
      {zoneLabel && (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-[#DBEAFE] border border-[#93C5FD] flex-shrink-0" />
          <span className="text-[#6B7280]">Recommended range:</span>
          <span className="font-semibold text-[#2563EB]">{zoneLabel}</span>
        </div>
      )}

      {/* Effect description */}
      {effect && (
        <div className="border border-[#E2E4E9] bg-[#F7F8FA] rounded-sm px-4 py-3">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1.5">
            Effect of Adjustment
          </p>
          <p className="text-xs text-[#6B7280] leading-relaxed">{effect}</p>
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
            <StaticParamBar simpleParam={simpleParam} />
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
