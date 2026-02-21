/**
 * TextPanel - Left side of walkthrough with explanation, quiz, and actions
 */

import { MarkdownLines } from '@/components/DocumentPanel/widgets/MarkdownLines';
import type { QuizQuestion } from '@/lib/walkthroughEngine';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="flex flex-col gap-6 p-8 pb-12">
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
                <motion.button
                  key={index}
                  whileHover={!quizResult ? { scale: 1.01 } : {}}
                  whileTap={!quizResult ? { scale: 0.97 } : {}}
                  animate={isWrong ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.3 } } : {}}
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
                </motion.button>
              );
            })}
          </div>

          {/* Quiz result */}
          <AnimatePresence>
            {quizResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ type: "spring", bounce: 0.3, visualDuration: 0.4 }}
                className={`overflow-hidden rounded-lg px-4 ${
                quizResult.correct
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400'
              }`}>
                <div className="py-4">
                  <p className="font-semibold">
                    {quizResult.correct ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  {quizResult.explanation && (
                    <p className="mt-2 text-sm">
                      {quizResult.explanation}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
