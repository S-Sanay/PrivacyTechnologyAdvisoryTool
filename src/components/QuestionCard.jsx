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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-slate-800 hidden sm:block">Privacy Technology Advisor</span>
          </div>
          <span className="text-sm text-slate-500 font-medium">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-full bg-slate-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-snug">
              {question.question}
            </h2>
            {question.subtitle && (
              <p className="text-slate-500 text-base">{question.subtitle}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => onSelect(idx)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio indicator */}
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-white bg-white' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold text-base leading-snug ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {opt.text}
                      </p>
                      {opt.detail && (
                        <p className={`text-sm mt-1 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
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
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                canGoBack
                  ? 'text-slate-600 hover:bg-slate-200'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              onClick={onNext}
              disabled={selectedOption === null || selectedOption === undefined}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                selectedOption !== null && selectedOption !== undefined
                  ? 'bg-slate-900 hover:bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLast ? 'Get Recommendation' : 'Next'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
