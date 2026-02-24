import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrainstormPrompt } from './TradeoffsCard';

interface BrainstormModeProps {
  scenario: string;
  prompts: BrainstormPrompt[];
  onComplete: (answers: Record<string, string>) => void;
}

const MIN_CHARS = 30;
const HINT_TIMEOUT = 30000; // 30 seconds

export function BrainstormMode({ scenario, prompts, onComplete }: BrainstormModeProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  // Track inactivity for hint display
  useEffect(() => {
    const currentPrompt = prompts[activePromptIndex];
    if (!currentPrompt || answers[currentPrompt.id]?.length >= MIN_CHARS) {
      return;
    }

    const timer = setTimeout(() => {
      setShowHints((prev) => ({ ...prev, [currentPrompt.id]: true }));
    }, HINT_TIMEOUT);

    return () => clearTimeout(timer);
  }, [activePromptIndex, answers, prompts]);

  const updateAnswer = useCallback((promptId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [promptId]: value }));
    // Reset hint when user starts typing
    setShowHints((prev) => ({ ...prev, [promptId]: false }));
  }, []);

  const handleContinue = () => {
    onComplete(answers);
  };

  const allPromptsAnswered = prompts.every(
    (prompt) => answers[prompt.id]?.length >= MIN_CHARS
  );

  const getCharCount = (promptId: string) => {
    const length = answers[promptId]?.length || 0;
    const remaining = MIN_CHARS - length;
    return { length, remaining: Math.max(0, remaining), isMet: length >= MIN_CHARS };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="mb-2 text-xl font-bold">Think It Through</h2>
        <p className="text-sm text-muted-foreground">
          Before we dive into solutions, let's think critically about the problem space.
        </p>
      </div>

      {/* Scenario */}
      <div className="rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
        <div className="mb-1 text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
          📖 Scenario
        </div>
        <div className="text-sm text-blue-900 dark:text-blue-100">{scenario}</div>
      </div>

      {/* Thinking Prompts */}
      <div className="space-y-4">
        <div className="text-sm font-semibold text-muted-foreground">💭 Thinking Prompts</div>

        {prompts.map((prompt, index) => {
          const charInfo = getCharCount(prompt.id);

          return (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Question */}
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{prompt.question}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {prompt.placeholder}
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={answers[prompt.id] || ''}
                onChange={(e) => updateAnswer(prompt.id, e.target.value)}
                onFocus={() => setActivePromptIndex(index)}
                placeholder="Your answer..."
                className="min-h-[80px] w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />

              {/* Character counter */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    charInfo.isMet
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  }
                >
                  {charInfo.isMet ? (
                    <span className="flex items-center gap-1">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      Complete ({charInfo.length} chars)
                    </span>
                  ) : (
                    `${charInfo.remaining} more characters needed`
                  )}
                </span>

                {/* Hint button */}
                {showHints[prompt.id] && prompt.hint && !charInfo.isMet && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
                    onClick={() => {
                      alert(prompt.hint);
                    }}
                  >
                    <Lightbulb className="h-3 w-3" />
                    Hint
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinue}
          disabled={!allPromptsAnswered}
          className="min-w-[160px]"
        >
          Continue to Choices
        </Button>
      </div>

      {!allPromptsAnswered && (
        <p className="text-center text-xs text-muted-foreground">
          Complete all prompts to continue
        </p>
      )}
    </div>
  );
}
