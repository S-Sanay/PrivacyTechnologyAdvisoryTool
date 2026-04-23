import { useState } from 'react';
import { questions } from './data/questions';
import { computeRecommendation } from './logic/advisor';
import Intro from './components/Intro';
import QuestionCard from './components/QuestionCard';
import ResultCard from './components/ResultCard';

export default function App() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
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
      setPhase('result');
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
