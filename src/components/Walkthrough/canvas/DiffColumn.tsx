/**
 * DiffColumn - Displays a column in the 3-column diff view
 * Shows items to Remove, Keep, or Add with contextual explanations
 */

import type { DiffItem, DiffItemToAdd } from '@/lib/solutionDiff';
import { cn } from '@/lib/utils';

interface DiffColumnProps {
  title: string;
  items: (DiffItem | DiffItemToAdd)[];
  colorScheme: 'red' | 'green' | 'yellow';
  explanation: string;
}

const colorClasses = {
  red: {
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    muted: 'text-red-700 dark:text-red-300',
  },
  green: {
    bg: 'bg-green-50/50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    muted: 'text-green-700 dark:text-green-300',
  },
  yellow: {
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100',
    muted: 'text-yellow-700 dark:text-yellow-300',
  },
};

export function DiffColumn({ title, items, colorScheme, explanation }: DiffColumnProps) {
  const colors = colorClasses[colorScheme];

  return (
    <div className="flex flex-col">
      <div className={cn('font-semibold text-sm mb-2 px-2', colors.text)}>
        {title}
      </div>
      <div className={cn('rounded-lg border p-3 min-h-[120px]', colors.bg, colors.border)}>
        {items.length === 0 ? (
          <div className={cn('text-xs italic', colors.muted)}>
            {colorScheme === 'red' && 'Nothing to remove'}
            {colorScheme === 'green' && 'No components to keep'}
            {colorScheme === 'yellow' && 'Nothing to add'}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="text-sm">
                <div className={cn('font-medium', colors.text)}>
                  {item.type === 'node' ? '□' : '→'} {item.label || item.id}
                </div>
                {item.reason && (
                  <div className={cn('text-xs mt-1 ml-4', colors.muted)}>
                    {item.reason}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={cn('text-xs mt-2 px-2 italic', colors.muted)}>
        {explanation}
      </div>
    </div>
  );
}
