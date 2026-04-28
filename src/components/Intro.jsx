export default function Intro({ onStart }) {
  const techs = [
    { name: 'Anonymization', desc: 'K-Anonymity & L-Diversity for dataset publication' },
    { name: 'Differential Privacy', desc: 'Formal mathematical guarantees on queries and ML training' },
    { name: 'Secure Multi-Party Computation', desc: 'Cryptographic zero-disclosure for multi-party settings' },
    { name: 'Federated Learning', desc: 'Distributed ML training without centralizing data' },
    { name: 'Legal & Constitutional Frameworks', desc: 'Regulatory law and constitutional protections' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E4E9]">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center gap-2.5">
          <div className="w-5 h-5 bg-[#2563EB] rounded-sm flex-shrink-0" />
          <span className="text-sm font-semibold text-[#0F1117] tracking-tight">
            Privacy Architecture Advisor
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full">

          {/* Label */}
          <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">
            Enterprise Decision Support
          </p>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-[#0F1117] leading-tight tracking-tight mb-4">
            Privacy Architecture<br />Assessment
          </h1>

          {/* Subheading */}
          <p className="text-base text-[#6B7280] leading-relaxed mb-8 max-w-xl">
            A structured evaluation framework that analyzes your organization's data infrastructure,
            threat model, and compliance requirements — then recommends the most appropriate
            privacy technology or regulatory approach.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 mb-14">
            <button
              onClick={onStart}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-5 py-2.5 rounded transition-colors duration-150"
            >
              Start Assessment
            </button>
            <button className="text-sm font-medium text-[#6B7280] hover:text-[#0F1117] transition-colors">
              Learn How It Works →
            </button>
          </div>

          {/* Meta strip */}
          <div className="flex items-start gap-8 pb-12 mb-12 border-b border-[#E2E4E9]">
            {[
              ['14', 'Assessment questions'],
              ['~5 min', 'Estimated time'],
              ['5', 'Approaches evaluated'],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-lg font-bold text-[#0F1117]">{val}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Approaches table */}
          <div>
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">
              Approaches Evaluated
            </p>
            <div className="border border-[#E2E4E9] rounded bg-white divide-y divide-[#E2E4E9]">
              {techs.map(t => (
                <div key={t.name} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-[#0F1117]">{t.name}</span>
                  <span className="text-xs text-[#9CA3AF] text-right max-w-xs hidden sm:block">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-xs text-[#9CA3AF] leading-relaxed max-w-lg">
            Outputs are decision-support guidance only. All recommendations should be reviewed by
            qualified privacy engineers and legal counsel before implementation.
          </p>
        </div>
      </main>
    </div>
  );
}
