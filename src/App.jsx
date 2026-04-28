import { useState, useEffect } from 'react';
import { questions } from './data/questions';
import { computeRecommendation } from './logic/advisor';
import Intro from './components/Intro';
import QuestionCard from './components/QuestionCard';
import ResultCard from './components/ResultCard';

const LOADING_STEPS = [
  'Scoring your responses…',
  'Evaluating privacy mechanisms…',
  'Weighing regulatory constraints…',
  'Comparing threat models…',
  'Generating your recommendation…',
];

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000;
    const stepInterval = duration / LOADING_STEPS.length;

    const stepTimer = setInterval(() => {
      setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, stepInterval);

    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(p + 1, 100));
    }, duration / 100);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-[#2563EB] rounded-sm flex-shrink-0" />
          <span className="text-sm font-semibold text-[#0F1117]">Privacy Architecture Advisor</span>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
            Analyzing your assessment
          </p>
          <p className="text-base font-semibold text-[#0F1117] transition-all duration-300">
            {LOADING_STEPS[step]}
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-[#E2E4E9] h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-[#9CA3AF] text-right">{progress}%</p>
        </div>

        <div className="space-y-2 pt-2">
          {LOADING_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
                i < step ? 'bg-[#2563EB]' : i === step ? 'bg-[#93C5FD]' : 'bg-[#E2E4E9]'
              }`} />
              <span className={`text-xs transition-colors duration-300 ${
                i < step ? 'text-[#2563EB] font-medium' : i === step ? 'text-[#0F1117]' : 'text-[#C5C8D0]'
              }`}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | loading | result
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null));
  const [result, setResult] = useState(null);

  const handleStart = () => {
    setPhase('quiz');
    setCurrentQ(0);
  };

  const handleSelect = (idx) => {
    const updated = [...answers];
    updated[currentQ] = idx;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      const rec = computeRecommendation(answers, questions);
      setResult(rec);
      setPhase('loading');
      setTimeout(() => setPhase('result'), 5000);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ(q => q - 1);
  };

  const handleRestart = () => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers(new Array(questions.length).fill(null));
    setResult(null);
  };

  if (phase === 'intro') return <Intro onStart={handleStart} />;
  if (phase === 'loading') return <LoadingScreen />;
  if (phase === 'result') return <ResultCard result={result} onRestart={handleRestart} />;

  return (
    <QuestionCard
      question={questions[currentQ]}
      questionNumber={currentQ + 1}
      totalQuestions={questions.length}
      selectedOption={answers[currentQ]}
      onSelect={handleSelect}
      onNext={handleNext}
      onBack={handleBack}
      canGoBack={currentQ > 0}
      isLast={currentQ === questions.length - 1}
    />
  );
}
