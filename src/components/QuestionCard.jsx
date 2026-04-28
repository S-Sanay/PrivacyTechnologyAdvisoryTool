function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelect,
  onNext,
  onBack,
  canGoBack,
  isLast,
}) {
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E4E9]">
        <div className="max-w-2xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[#2563EB] rounded-sm flex-shrink-0" />
            <span className="text-sm font-semibold text-[#0F1117] hidden sm:block">
              Privacy Architecture Advisor
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
            Step {questionNumber} of {totalQuestions}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-[#E2E4E9]">
          <div
            className="h-full bg-[#2563EB] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* Question header */}
          <div className="mb-7">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">
              Question {questionNumber}
            </p>
            <h2 className="text-xl font-semibold text-[#0F1117] leading-snug mb-2">
              {question.question}
            </h2>
            {question.subtitle && (
              <p className="text-sm text-[#6B7280] leading-relaxed">{question.subtitle}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2 mb-10">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => onSelect(idx)}
                  className={`w-full text-left border px-4 py-3.5 rounded transition-all duration-100 ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-[#E2E4E9] bg-white hover:border-[#C5C8D0] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio indicator */}
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-[#2563EB]' : 'border-[#C5C8D0]'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium leading-snug ${
                          isSelected ? 'text-[#1D4ED8]' : 'text-[#0F1117]'
                        }`}
                      >
                        {opt.text}
                      </p>
                      {opt.detail && (
                        <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                          {opt.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E4E9]">
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className={`text-sm font-medium transition-colors ${
                canGoBack
                  ? 'text-[#6B7280] hover:text-[#0F1117]'
                  : 'text-[#C5C8D0] cursor-not-allowed'
              }`}
            >
              ← Back
            </button>

            <button
              onClick={onNext}
              disabled={selectedOption === null || selectedOption === undefined}
              className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded transition-colors duration-150 ${
                selectedOption !== null && selectedOption !== undefined
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                  : 'bg-[#E2E4E9] text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              {isLast ? 'Generate Report' : 'Continue'}
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
