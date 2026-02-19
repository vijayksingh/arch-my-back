import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, Minus, Plus } from 'lucide-react';
import type { NotebookBlock, SchemaField, SchemaTable } from '@/types';
import { useDocumentStore } from '@/stores/documentStore';
import { WidgetPreviewCard } from './WidgetPreviewCard';
import { useDoubleEnterExit } from './useDoubleEnterExit';

interface SchemaWidgetProps {
  block: Extract<NotebookBlock, { type: 'schema' }>;
  isPreview: boolean;
  autoFocus?: boolean;
  onExitWidget?: () => void;
}

const FIELD_TYPES = [
  'uuid', 'varchar', 'text', 'char',
  'integer', 'bigint', 'smallint', 'serial', 'bigserial',
  'boolean',
  'float', 'double precision', 'decimal', 'numeric',
  'timestamp', 'timestamptz', 'date', 'time',
  'json', 'jsonb',
  'bytea', 'array',
];

function genId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

interface TypeInputProps {
  value: string;
  onChange: (v: string) => void;
}

function TypeInput({ value, onChange }: TypeInputProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value === ''
    ? FIELD_TYPES
    : FIELD_TYPES.filter((t) => t.startsWith(value.toLowerCase()));

  const showPicker = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 2, left: r.left, width: r.width });
      setOpen(true);
    }
  };

  const hidePicker = () => {
    // Small delay to allow click on option to register before blur closes the picker
    setTimeout(() => setOpen(false), 120);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={showPicker}
        onBlur={hidePicker}
        placeholder="type"
        className="rounded border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-[12px] text-foreground outline-none transition-colors hover:border-border/50 focus:border-ring/40 focus:bg-card/30 placeholder:text-muted-foreground/40"
      />
      {open && pos && filtered.length > 0 && createPortal(
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: Math.max(pos.width, 120),
            zIndex: 200,
            maxHeight: 160,
            overflowY: 'auto',
          }}
          className="rounded-md border border-border/60 bg-popover py-1 shadow-md"
        >
          {filtered.map((t) => (
            <div
              key={t}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(t);
                setOpen(false);
              }}
              className="cursor-pointer px-2 py-1 font-mono text-[12px] text-foreground/80 hover:bg-accent/40"
            >
              {t}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export function SchemaWidget({ block, isPreview, autoFocus, onExitWidget }: SchemaWidgetProps) {
  const updateBlockData = useDocumentStore((s) => s.updateBlockData);
  const tables = block.data.tables;

  const setTables = useCallback(
    (nextTables: SchemaTable[]) => {
      updateBlockData(block.id, { tables: nextTables });
    },
    [block.id, updateBlockData],
  );

  const addTable = useCallback(() => {
    const newTable: SchemaTable = {
      id: genId(),
      name: 'new_table',
      fields: [
        { id: genId(), name: 'id', fieldType: 'uuid', constraints: 'PK' },
      ],
    };
    setTables([...tables, newTable]);
  }, [tables, setTables]);

  const updateTableName = useCallback(
    (tableId: string, name: string) => {
      setTables(tables.map((t) => (t.id === tableId ? { ...t, name } : t)));
    },
    [tables, setTables],
  );

  const removeTable = useCallback(
    (tableId: string) => {
      setTables(tables.filter((t) => t.id !== tableId));
    },
    [tables, setTables],
  );

  const addField = useCallback(
    (tableId: string) => {
      const newField: SchemaField = {
        id: genId(),
        name: 'field',
        fieldType: 'varchar',
        constraints: '',
      };
      setTables(
        tables.map((t) =>
          t.id === tableId ? { ...t, fields: [...t.fields, newField] } : t,
        ),
      );
    },
    [tables, setTables],
  );

  const updateField = useCallback(
    (
      tableId: string,
      fieldId: string,
      patch: Partial<SchemaField>,
    ) => {
      setTables(
        tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                fields: t.fields.map((f) =>
                  f.id === fieldId ? { ...f, ...patch } : f,
                ),
              }
            : t,
        ),
      );
    },
    [tables, setTables],
  );

  const removeField = useCallback(
    (tableId: string, fieldId: string) => {
      setTables(
        tables.map((t) =>
          t.id === tableId
            ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
            : t,
        ),
      );
    },
    [tables, setTables],
  );

  const handleDoubleEnter = useDoubleEnterExit(onExitWidget ?? (() => {}));

  if (isPreview) {
    return (
      <div className="flex flex-col gap-3">
        {tables.length === 0 ? (
          <p className="text-[12px] italic text-muted-foreground">
            No tables defined.
          </p>
        ) : (
          tables.map((table) => (
            <WidgetPreviewCard key={table.id} icon={Database} title={table.name}>
              {table.fields.length === 0 ? (
                <p className="text-[12px] italic text-muted-foreground">
                  No fields.
                </p>
              ) : (
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-1 text-left font-medium text-muted-foreground">
                        Field
                      </th>
                      <th className="pb-1 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="pb-1 text-left font-medium text-muted-foreground">
                        Constraints
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.fields.map((field) => (
                      <tr key={field.id} className="border-b border-border/20">
                        <td className="py-1 text-foreground/90">{field.name}</td>
                        <td className="py-1 font-mono text-foreground/70">
                          {field.fieldType}
                        </td>
                        <td className="py-1">
                          {field.constraints ? (
                            <span className="rounded bg-accent/40 px-1 text-[10px] text-muted-foreground">
                              {field.constraints}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </WidgetPreviewCard>
          ))
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 py-3"
      onKeyDown={onExitWidget ? handleDoubleEnter : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Schema
          </span>
        </div>
        <button
          type="button"
          onClick={addTable}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <p className="text-[12px] italic text-muted-foreground">
          No tables yet. Click "Add Table" to start.
        </p>
      ) : (
        tables.map((table, tableIdx) => (
          <div key={table.id} className="py-1">
            <div className="mb-1.5 flex items-center gap-2">
              <input
                type="text"
                value={table.name}
                onChange={(e) => updateTableName(table.id, e.target.value)}
                autoFocus={autoFocus && tableIdx === 0}
                className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-semibold text-foreground outline-none transition-colors hover:border-border/50 focus:border-ring/40 focus:bg-card/30"
              />
              <button
                type="button"
                onClick={() => removeTable(table.id)}
                className="flex-shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
              >
                <Minus className="h-3 w-3" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-[1fr_1fr_1fr_auto] gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Field</span>
              <span>Type</span>
              <span>Constraints</span>
              <span />
            </div>

            {table.fields.map((field) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-1 py-0.5"
              >
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) =>
                    updateField(table.id, field.id, { name: e.target.value })
                  }
                  placeholder="name"
                  className="rounded border border-transparent bg-transparent px-1.5 py-0.5 text-[12px] text-foreground outline-none transition-colors hover:border-border/50 focus:border-ring/40 focus:bg-card/30 placeholder:text-muted-foreground/40"
                />
                <TypeInput
                  value={field.fieldType}
                  onChange={(v) => updateField(table.id, field.id, { fieldType: v })}
                />
                <input
                  type="text"
                  value={field.constraints}
                  onChange={(e) =>
                    updateField(table.id, field.id, {
                      constraints: e.target.value,
                    })
                  }
                  placeholder="PK, FK, NOT NULL..."
                  className="rounded border border-transparent bg-transparent px-1.5 py-0.5 text-[12px] text-foreground outline-none transition-colors hover:border-border/50 focus:border-ring/40 focus:bg-card/30 placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => removeField(table.id, field.id)}
                  className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-destructive"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addField(table.id)}
              className="mt-1.5 flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Add Field
            </button>
          </div>
        ))
      )}
    </div>
  );
}
