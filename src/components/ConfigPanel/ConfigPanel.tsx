import { useState, useRef, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Scale,
  Router,
  Globe,
  Server,
  Cog,
  Zap,
  Database,
  HardDrive,
  MemoryStick,
  ArrowRightLeft,
  Plug,
  ExternalLink,
  X,
  Trash2,
  Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ConfigField, ComponentCategory } from '@/types';
import { componentTypeMap } from '@/registry/componentTypes';
import { useCanvasStore } from '@/stores/canvasStore';

const iconMap: Record<string, LucideIcon> = {
  Scale,
  Router,
  Globe,
  Server,
  Cog,
  Zap,
  Database,
  HardDrive,
  MemoryStick,
  ArrowRightLeft,
  Plug,
  ExternalLink,
};

const categoryAccentVarMap: Record<ComponentCategory, string> = {
  Traffic: '--category-traffic-accent',
  Compute: '--category-compute-accent',
  Storage: '--category-storage-accent',
  Messaging: '--category-messaging-accent',
  Caching: '--category-caching-accent',
  External: '--category-external-accent',
};

function InlineLabel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        variant="ghost"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-6 w-36 bg-background/35 px-2 text-[11px] font-medium"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="truncate text-left text-[11px] font-medium text-foreground transition-colors hover:text-foreground/80"
      title="Click to rename"
    >
      {value}
    </button>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === 'text') {
    return (
      <Input
        variant="ghost"
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-28 bg-background/35 px-2 text-[11px]"
      />
    );
  }

  if (field.type === 'number') {
    return (
      <Input
        variant="ghost"
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-16 bg-background/35 px-2 text-[11px]"
      />
    );
  }

  return (
    <select
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      className="h-6 w-28 appearance-none rounded-md border border-transparent bg-background/35 px-2 text-[11px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-ring/70 focus:ring-1 focus:ring-ring/30"
    >
      {field.options?.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function ConfigPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNodeConfig = useCanvasStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const typeDef = node ? componentTypeMap.get(node.data.componentType) : null;
  const isOpen = !!node && !!typeDef;
  const IconComponent = typeDef ? (iconMap[typeDef.icon] ?? Box) : Box;
  const fields = typeDef?.configFields ?? [];
  const accentVar = typeDef ? categoryAccentVarMap[typeDef.category] : '--category-external-accent';

  const handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      if (!selectedNodeId) return;
      updateNodeConfig(selectedNodeId, { [fieldKey]: value });
    },
    [selectedNodeId, updateNodeConfig],
  );

  const handleDelete = useCallback(() => {
    if (!selectedNodeId) return;
    removeNode(selectedNodeId);
  }, [selectedNodeId, removeNode]);

  const handleClose = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleLabelChange = useCallback(
    (label: string) => {
      if (!selectedNodeId) return;
      updateNodeLabel(selectedNodeId, label);
    },
    [selectedNodeId, updateNodeLabel],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setSelectedNode]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-50 flex justify-center px-3">
      <aside
        className={cn(
          'pointer-events-auto flex h-12 w-fit max-w-[calc(100vw-1.5rem)] items-center gap-2 overflow-hidden rounded-xl border ui-border-ghost bg-card/95 px-2 shadow-(--panel-shadow) backdrop-blur-xl transition-all duration-180 ease-out',
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-[calc(100%+0.75rem)] opacity-0',
        )}
      >
        {node && typeDef && (
          <>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `hsl(var(${accentVar}) / 0.16)` }}
              >
                <IconComponent size={12} strokeWidth={1.8} className="text-foreground/90" />
              </div>
              <InlineLabel value={node.data.label} onChange={handleLabelChange} />
              <span
                className="rounded-md px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: `hsl(var(${accentVar}) / 0.14)`,
                  color: `hsl(var(${accentVar}) / 0.92)`,
                }}
              >
                {typeDef.label}
              </span>
            </div>

            <div className="flex min-w-0 max-w-[min(56vw,48rem)] items-center gap-1.5 overflow-x-auto pr-1 [scrollbar-width:thin]">
              {fields.map((field) => {
                const currentValue = node.data.config[field.key] ?? field.defaultValue;

                return (
                  <div
                    key={field.key}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-background/45 px-1.5 py-1"
                    style={{ backgroundColor: `hsl(var(${accentVar}) / 0.12)` }}
                  >
                    <span
                      className="whitespace-nowrap text-[9px] font-medium uppercase tracking-widest"
                      style={{ color: `hsl(var(${accentVar}) / 0.86)` }}
                    >
                      {field.label}
                    </span>
                    <FieldControl
                      field={field}
                      value={currentValue}
                      onChange={(value) => handleFieldChange(field.key, value)}
                    />
                  </div>
                );
              })}

              {fields.length === 0 && (
                <span className="text-[10px] italic text-muted-foreground">
                  No configurable fields
                </span>
              )}
            </div>

            <div className="h-6 w-px shrink-0 bg-border/70" />

            <div className="flex shrink-0 items-center gap-1">
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Delete node"
              >
                <Trash2 size={12} strokeWidth={1.7} />
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Close panel"
              >
                <X size={12} strokeWidth={1.7} />
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
