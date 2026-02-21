/**
 * TextPanel - Left side of walkthrough with explanation, quiz, and actions
 */

import { MarkdownLines } from '@/components/DocumentPanel/widgets/MarkdownLines';
import type { QuizQuestion } from '@/lib/walkthroughEngine';

interface TextPanelProps {
  title: string;
  content: string;
  quiz?: QuizQuestion;
  quizAnswer?: number;
  onQuizAnswer?: (selectedIndex: number) => void;
  quizResult?: { correct: boolean; explanation?: string };
}

export function TextPanel({
  title,
  content,
  quiz,
  quizAnswer,
  onQuizAnswer,
  quizResult
}: TextPanelProps) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-8">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground">
        {title}
      </h1>

      {/* Content */}
      <div className="flex-1">
        <MarkdownLines content={content} />
      </div>

      {/* Quiz */}
      {quiz && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">
            {quiz.question}
          </h3>

          <div className="flex flex-col gap-2">
            {quiz.options.map((option, index) => {
              const isSelected = quizAnswer === index;
              const isCorrect = quizResult && index === quiz.correctIndex;
              const isWrong = quizResult && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => onQuizAnswer?.(index)}
                  disabled={quizResult !== undefined}
                  className={`
                    rounded-lg border px-4 py-3 text-left text-sm transition-colors
                    ${isSelected && !quizResult ? 'border-primary bg-primary/10' : 'border-border'}
                    ${isCorrect ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' : ''}
                    ${isWrong ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' : ''}
                    ${!quizResult ? 'hover:border-primary/50 hover:bg-accent' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quiz result */}
          {quizResult && (
            <div className={`mt-4 rounded-lg p-4 ${
              quizResult.correct
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              <p className="font-semibold">
                {quizResult.correct ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {quizResult.explanation && (
                <p className="mt-2 text-sm">
                  {quizResult.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
