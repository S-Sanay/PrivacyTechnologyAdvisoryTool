export default function Intro({ onStart }) {
  const techs = [
    { icon: '🔵', name: 'Anonymization', short: 'K-Anonymity and L-Diversity for dataset publication' },
    { icon: '🟢', name: 'Differential Privacy', short: 'Formal mathematical guarantees on queries and ML' },
    { icon: '🟣', name: 'Cryptographic Methods', short: 'Secure MPC for multi-party computation' },
    { icon: '🟠', name: 'Federated Learning', short: 'Distributed ML training without centralizing data' },
    { icon: '⚖️', name: 'Legal & Constitutional Frameworks', short: 'Regulatory law and constitutional protections' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="font-semibold text-slate-800">Privacy Technology Advisor</span>
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-blue-200">
            <span>14 questions</span>
            <span className="text-blue-300">·</span>
            <span>~5 minutes</span>
            <span className="text-blue-300">·</span>
            <span>5 privacy approaches</span>
          </div>

          <h1 className="text-5xl font-extrabold text-slate-900 mb-5 leading-tight tracking-tight">
            Find the right privacy<br />approach for your organization
          </h1>

          <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            Answer questions about your use case, data, trust model, threat actors, and regulatory requirements.
            We'll recommend the most appropriate privacy technology or framework — with implementation
            parameters and a full justification.
          </p>

          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors duration-150 shadow-sm"
          >
            Start Assessment
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Technology grid */}
        <div className="max-w-3xl w-full mt-16">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-5">
            The five approaches covered
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {techs.map(t => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">{t.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-snug">{t.short}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-xs text-slate-400 max-w-xl text-center">
          This tool provides decision-support guidance. All outputs should be reviewed by qualified privacy
          engineers and legal counsel before implementation.
        </p>
      </div>
    </div>
  );
}
