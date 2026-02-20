import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Trash2, ChevronDown, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CanvasShapeNode, ConfigField } from '@/types';
import { componentTypeMap } from '@/registry/componentTypes';
import { useCanvasStore } from '@/stores/canvasStore';
import { getIconByName } from '@/registry/iconRegistry';
import { categoryAccentTokens } from '@/registry/categoryThemes';

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
  compact = true,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
  compact?: boolean;
}) {
  if (field.type === 'text') {
    return (
      <Input
        variant={compact ? 'ghost' : undefined}
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={compact ? 'h-6 w-28 bg-background/35 px-2 text-[11px]' : ''}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <Input
        variant={compact ? 'ghost' : undefined}
        type="number"
        value={Number(value ?? field.defaultValue)}
        onChange={(e) => onChange(Number(e.target.value))}
        className={compact ? 'h-6 w-16 bg-background/35 px-2 text-[11px]' : ''}
      />
    );
  }

  if (compact) {
    return (
      <select
        value={String(value ?? field.defaultValue)}
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

  return (
    <Select value={String(value ?? field.defaultValue)} onValueChange={(val) => onChange(val)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function getShapeTypeLabel(node: CanvasShapeNode): string {
  if (node.type === 'shapeCircle') return 'Circle';
  if (node.type === 'shapeText') return 'Text';
  return 'Rectangle';
}

type ConfigPanelLevel = 1 | 2 | 3;

export function ConfigPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const node = useCanvasStore((s) =>
    s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null
  );
  const updateNodeConfig = useCanvasStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel);
  const updateShapeStyle = useCanvasStore((s) => s.updateShapeStyle);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);

  const [level, setLevel] = useState<ConfigPanelLevel>(1);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const componentNode = node && node.type === 'archComponent' ? node : null;
  const shapeNode = node && (node.type === 'shapeRect' || node.type === 'shapeCircle' || node.type === 'shapeText') ? node : null;
  const typeDef =
    componentNode
      ? componentTypeMap.get(componentNode.data.componentType)
      : null;
  const isComponentOpen = !!componentNode && !!typeDef;
  const isShapeOpen = !!shapeNode;
  const isOpen = isComponentOpen || isShapeOpen;
  const IconComponent = getIconByName(typeDef?.icon ?? '');
  const fields = typeDef?.configFields ?? [];

  // Determine primary fields for Level 1 (with fallback)
  const primaryFields = (typeDef as any)?.primaryFields
    ? fields.filter(f => (typeDef as any).primaryFields.includes(f.key))
    : fields.slice(0, 3); // Fallback: first 3 fields

  const accentVar = typeDef ? categoryAccentTokens[typeDef.category] : '--category-external-accent';
  const shapeTypeLabel = shapeNode ? getShapeTypeLabel(shapeNode) : '';
  const shapeFontSize = shapeNode?.data.fontSize ?? (shapeNode?.type === 'shapeText' ? 14 : 12);

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

  const handleShapeFontSizeChange = useCallback(
    (fontSize: number) => {
      if (!selectedNodeId) return;
      updateShapeStyle(selectedNodeId, { fontSize });
    },
    [selectedNodeId, updateShapeStyle],
  );

  const handleOpenJsonEditor = useCallback(() => {
    if (!componentNode) return;
    setJsonDraft(JSON.stringify(componentNode.data.config, null, 2));
    setJsonError(null);
    setLevel(3);
  }, [componentNode]);

  const handleSaveJson = useCallback(() => {
    if (!selectedNodeId) return;
    try {
      const parsed = JSON.parse(jsonDraft);
      updateNodeConfig(selectedNodeId, parsed);
      setJsonError(null);
      setLevel(1);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [selectedNodeId, jsonDraft, updateNodeConfig]);

  // Reset level when node selection changes
  useEffect(() => {
    setLevel(1);
    setJsonError(null);
  }, [selectedNodeId]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (level === 3) {
          setLevel(1);
        } else {
          setSelectedNode(null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, level, setSelectedNode]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-50 flex justify-center px-3">
      <aside
        className={cn(
          'pointer-events-auto flex w-fit max-w-[calc(100%-1.5rem)] gap-2 overflow-hidden rounded-xl border ui-border-ghost bg-card/95 shadow-(--panel-shadow) backdrop-blur-xl transition-all duration-180 ease-out',
          level === 3 || (level === 2 && componentNode) ? 'h-auto min-h-12 flex-col items-stretch p-2' : 'h-12 items-center px-2',
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-[calc(100%+0.75rem)] opacity-0',
        )}
      >
        {componentNode && typeDef && (
          <>
            {/* Header row - always visible for levels 1 and 2 */}
            {level !== 3 && (
              <div className="flex min-w-0 shrink-0 items-center gap-1.5">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `hsl(var(${accentVar}) / 0.16)` }}
                >
                  <IconComponent size={12} strokeWidth={1.8} className="text-foreground/90" />
                </div>
                <InlineLabel value={componentNode.data.label} onChange={handleLabelChange} />
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
            )}

            {/* Level 1: Primary fields (inline) */}
            {level === 1 && (
              <div className="flex min-w-0 max-w-[min(56vw,48rem)] items-center gap-1.5 overflow-x-auto pr-1 [scrollbar-width:thin]">
                {primaryFields.map((field) => {
                  const currentValue =
                    componentNode.data.config[field.key] ?? field.defaultValue;

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
                        compact={true}
                      />
                    </div>
                  );
                })}

                {primaryFields.length === 0 && (
                  <span className="text-[10px] italic text-muted-foreground">
                    No configurable fields
                  </span>
                )}
              </div>
            )}

            {/* Level 2: All fields */}
            {level === 2 && (
              <div className="flex max-w-[min(56vw,48rem)] flex-col gap-2 overflow-y-auto pr-2">
                {fields.map((field) => {
                  const currentValue =
                    componentNode.data.config[field.key] ?? field.defaultValue;

                  return (
                    <div
                      key={field.key}
                      className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5"
                      style={{ backgroundColor: `hsl(var(${accentVar}) / 0.08)` }}
                    >
                      <span
                        className="min-w-24 text-[10px] font-medium"
                        style={{ color: `hsl(var(${accentVar}) / 0.88)` }}
                      >
                        {field.label}
                      </span>
                      <div className="flex-1">
                        <FieldControl
                          field={field}
                          value={currentValue}
                          onChange={(value) => handleFieldChange(field.key, value)}
                          compact={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Level 3: JSON Editor */}
        {componentNode && typeDef && level === 3 && (
          <div className="flex w-full max-w-[min(64vw,56rem)] flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">
                Edit Configuration as JSON
              </span>
              {jsonError && (
                <span className="text-[9px] text-destructive">{jsonError}</span>
              )}
            </div>
            <Textarea
              value={jsonDraft}
              onChange={(e) => setJsonDraft(e.target.value)}
              className="font-mono text-[11px] min-h-[12rem]"
              placeholder="{}"
            />
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveJson}
                  size="sm"
                  className="h-7 text-[10px]"
                >
                  Save JSON
                </Button>
                <Button
                  onClick={() => setLevel(1)}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                >
                  Cancel
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleDelete}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  title="Delete"
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
            </div>
          </div>
        )}

        {shapeNode && (
          <>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5">
              <div className="flex h-6 items-center rounded-md bg-secondary/55 px-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/82">
                  Shape
                </span>
              </div>
              <InlineLabel value={shapeNode.data.label} onChange={handleLabelChange} />
              <span className="rounded-md bg-accent/65 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-foreground/88">
                {shapeTypeLabel}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-md bg-background/45 px-1.5 py-1">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Text
              </span>
              <Input
                variant="ghost"
                type="number"
                min={10}
                max={96}
                step={1}
                value={shapeFontSize}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  if (Number.isFinite(nextValue)) {
                    handleShapeFontSizeChange(nextValue);
                  }
                }}
                className="h-6 w-16 bg-background/35 px-2 text-[11px]"
              />
            </div>

          </>
        )}

        {/* Action buttons */}
        {isOpen && level === 1 && (
          <>
            <div className="h-6 w-px shrink-0 bg-border/70" />
            <div className="flex shrink-0 items-center gap-1">
              {/* Level switching buttons (only for components) */}
              {componentNode && typeDef && (
                <>
                  {fields.length > primaryFields.length && (
                    <Button
                      onClick={() => setLevel(2)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground"
                      title="Show all fields"
                    >
                      <ChevronDown size={10} strokeWidth={1.7} className="mr-0.5" />
                      Advanced
                    </Button>
                  )}
                  <Button
                    onClick={handleOpenJsonEditor}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground"
                    title="Edit as JSON"
                  >
                    <Code size={10} strokeWidth={1.7} className="mr-0.5" />
                    JSON
                  </Button>
                </>
              )}
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Delete"
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

        {/* Level 2 action buttons - at the bottom */}
        {isOpen && level === 2 && componentNode && typeDef && (
          <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-1">
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setLevel(1)}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground"
                title="Show primary fields only"
              >
                <ChevronDown size={10} strokeWidth={1.7} className="mr-0.5 rotate-180" />
                Quick
              </Button>
              <Button
                onClick={handleOpenJsonEditor}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground"
                title="Edit as JSON"
              >
                <Code size={10} strokeWidth={1.7} className="mr-0.5" />
                JSON
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Delete"
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
          </div>
        )}

        {/* Level 3 is already handled inline with Save/Cancel buttons */}
      </aside>
    </div>
  );
}
