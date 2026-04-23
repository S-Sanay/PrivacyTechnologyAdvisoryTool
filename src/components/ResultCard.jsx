import { technologies } from '../data/technologies';

const colorMap = {
  anon:  { bar: 'bg-sky-500',    badge: 'bg-sky-100 text-sky-800',       border: 'border-sky-300',    headerBg: 'bg-sky-600',    text: 'text-sky-700' },
  dp:    { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300', headerBg: 'bg-emerald-600', text: 'text-emerald-700' },
  mpc:   { bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800',  border: 'border-violet-300', headerBg: 'bg-violet-600', text: 'text-violet-700' },
  fl:    { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800',  border: 'border-orange-300', headerBg: 'bg-orange-600', text: 'text-orange-700' },
  legal: { bar: 'bg-amber-600',  badge: 'bg-amber-100 text-amber-800',    border: 'border-amber-300',  headerBg: 'bg-amber-700',  text: 'text-amber-800' },
};

function ScoreBar({ techId, percentage, name, isWinner }) {
  const c = colorMap[techId];
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium w-36 flex-shrink-0 truncate ${isWinner ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
        {name}
      </span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${c.bar} ${isWinner ? 'opacity-100' : 'opacity-35'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-mono w-10 text-right flex-shrink-0 ${isWinner ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
        {percentage}%
      </span>
    </div>
  );
}

// Special callout for the legal category explaining how it differs from technical methods
function LegalNote() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-2">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">⚖️</span>
        <div>
          <p className="font-bold text-amber-900 text-sm mb-1">How Legal Frameworks differ from technical privacy tools</p>
          <p className="text-sm text-amber-800 leading-relaxed">
            Unlike Differential Privacy, MPC, or Anonymization — which protect data <em>mathematically</em> — Legal &amp; Constitutional
            Frameworks protect privacy by <strong>constraining the behavior of actors</strong>: organizations and governments.
            They provide no cryptographic or probabilistic guarantee, but they address threats that technical tools
            cannot solve: institutional misuse, government surveillance, and unauthorized data collection.
          </p>
          <p className="text-sm text-amber-800 leading-relaxed mt-2">
            Legal frameworks are often most powerful when <strong>combined with technical privacy controls</strong> — law
            constrains what actors are <em>allowed</em> to do; technology constrains what they are <em>able</em> to do.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResultCard({ result, onRestart }) {
  const { winner, winnerTech, techScores, params, justification, combinations } = result;
  const c = colorMap[winner];
  const isLegal = winner === 'legal';

  const altTechs = techScores.filter(t => t.tech !== winner).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
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

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Hero card */}
        <div className={`rounded-2xl overflow-hidden shadow-sm border ${c.border}`}>
          <div className={`${c.headerBg} px-8 py-7 text-white`}>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-2">
              Recommended Approach
            </p>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{winnerTech.icon}</span>
              <h1 className="text-3xl font-extrabold">{winnerTech.name}</h1>
            </div>
            <p className="text-lg text-white/80">{winnerTech.category}</p>
            <p className="mt-3 text-white/90 text-base leading-relaxed max-w-xl">
              {winnerTech.tagline}
            </p>
          </div>
          <div className="bg-white px-8 py-6">
            <p className="text-slate-600 leading-relaxed">{winnerTech.description}</p>
          </div>
        </div>

        {/* Legal-specific explainer */}
        {isLegal && <LegalNote />}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parameters */}
            {params.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">
                    {isLegal ? 'Applicable Framework & Key Mechanisms' : 'Implementation Parameters'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {isLegal
                      ? 'Recommended frameworks and mechanisms based on your scenario'
                      : 'Recommended configuration values based on your inputs'}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {params.map((p, i) => (
                    <div key={i} className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{p.label}</p>
                      <p className={`font-bold text-base ${c.text}`}>{p.value}</p>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why this recommendation */}
            {justification.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Why This Approach?</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Key signals from your assessment that drove this recommendation</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {justification.map((reason, i) => (
                    <li key={i} className="px-6 py-4 flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full ${c.headerBg} flex-shrink-0 flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pros and cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                  <h3 className="font-bold text-emerald-800 text-sm">Advantages</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {winnerTech.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                  <h3 className="font-bold text-red-800 text-sm">Limitations</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {winnerTech.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Combination strategies */}
            {combinations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Combination Strategies</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Technologies that can be layered for stronger or more complete privacy protection</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {combinations.map((combo, i) => (
                    <div key={i} className="px-6 py-4 flex items-start gap-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge} flex-shrink-0 mt-0.5 whitespace-nowrap`}>
                        + {combo.tech}
                      </span>
                      <p className="text-sm text-slate-600 leading-relaxed">{combo.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal notes */}
            {winnerTech.legalNotes && winnerTech.legalNotes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {isLegal ? 'Key Legal Authorities & Frameworks' : 'Legal & Compliance Notes'}
                </h3>
                <ul className="space-y-2">
                  {winnerTech.legalNotes.map((note, i) => (
                    <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tools */}
            {winnerTech.tools && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">
                    {isLegal ? 'Compliance Tools & Resources' : 'Implementation Tools & Libraries'}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {winnerTech.tools.map((tool, i) => (
                    <div key={i} className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800 text-sm">{tool.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{tool.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Score breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Match Scores</h2>
                <p className="text-xs text-slate-500 mt-0.5">Relative fit for each privacy approach</p>
              </div>
              <div className="p-5 space-y-3">
                {techScores.map(t => (
                  <ScoreBar
                    key={t.tech}
                    techId={t.tech}
                    percentage={t.percentage}
                    name={technologies[t.tech].name}
                    isWinner={t.tech === winner}
                  />
                ))}
              </div>
            </div>

            {/* Alternative approaches */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Alternatives to Consider</h2>
                <p className="text-xs text-slate-500 mt-0.5">Next-best fits based on your answers</p>
              </div>
              <div className="divide-y divide-slate-100">
                {altTechs.map(t => {
                  const alt = technologies[t.tech];
                  const ac = colorMap[t.tech];
                  return (
                    <div key={t.tech} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{alt.icon}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ac.badge}`}>
                          {alt.category}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{alt.name}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{alt.tagline}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                This tool provides decision-support guidance based on your inputs. All outputs should be reviewed
                by qualified privacy engineers and legal counsel before implementation.
              </p>
            </div>

            <button
              onClick={onRestart}
              className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
