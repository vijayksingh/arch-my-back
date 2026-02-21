import { useState, useEffect } from 'react';
import { Type, ListChecks, Database, Globe, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NotebookBlockType } from '@/types';
import { cn } from '@/lib/utils';

interface CommandEntry {
  type: NotebookBlockType;
  command: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const COMMANDS: CommandEntry[] = [
  {
    type: 'text',
    command: 'text',
    label: 'Text',
    icon: Type,
    description: 'Free-form markdown notes',
  },
  {
    type: 'requirements',
    command: 'requirements',
    label: 'Requirements',
    icon: ListChecks,
    description: 'Functional & non-functional',
  },
  {
    type: 'schema',
    command: 'schema',
    label: 'Schema',
    icon: Database,
    description: 'Database tables and fields',
  },
  {
    type: 'api',
    command: 'api',
    label: 'API Design',
    icon: Globe,
    description: 'REST endpoints',
  },
  {
    type: 'lld',
    command: 'lld',
    label: 'Low-Level Design',
    icon: FileText,
    description: 'Component deep-dive',
  },
];

interface SlashCommandPickerProps {
  filter: string;
  onSelect: (type: NotebookBlockType) => void;
  onDismiss: () => void;
}

export function SlashCommandPicker({
  filter,
  onSelect,
  onDismiss,
}: SlashCommandPickerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = COMMANDS.filter(
    (c) =>
      filter === '' ||
      c.command.startsWith(filter) ||
      c.label.toLowerCase().startsWith(filter),
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const cmd = filtered[activeIndex];
        if (cmd) onSelect(cmd.type);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }
    }

    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [activeIndex, filtered, onSelect, onDismiss]);

  if (filtered.length === 0) return null;

  return (
    <div className="z-50 w-full overflow-hidden rounded-lg border ui-border-ghost bg-popover shadow-lg origin-top-left animate-picker-enter motion-reduce:animate-none">
      {filtered.map((cmd, index) => (
        <button
          key={cmd.type}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd.type);
          }}
          onMouseEnter={() => setActiveIndex(index)}
          className={cn(
            'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
            index === activeIndex
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground hover:bg-accent/50',
          )}
        >
          <cmd.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-[13px] font-medium">{cmd.label}</div>
            <div className="text-[11px] text-muted-foreground">
              /{cmd.command}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
