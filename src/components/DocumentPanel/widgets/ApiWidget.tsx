import { useCallback } from 'react';
import { Globe, Minus, Plus } from 'lucide-react';
import type { ApiEndpoint, HttpMethod, NotebookBlock } from '@/types';
import { useDocumentStore } from '@/stores/documentStore';
import { WidgetPreviewCard } from './WidgetPreviewCard';
import { useDoubleEnterExit } from './useDoubleEnterExit';

interface ApiWidgetProps {
  block: Extract<NotebookBlock, { type: 'api' }>;
  isPreview: boolean;
  autoFocus?: boolean;
  onExitWidget?: () => void;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/40',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  PATCH: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/40',
};

function genId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function ApiWidget({ block, isPreview, autoFocus, onExitWidget }: ApiWidgetProps) {
  const updateBlockData = useDocumentStore((s) => s.updateBlockData);
  const endpoints = block.data.endpoints;

  const setEndpoints = useCallback(
    (next: ApiEndpoint[]) => {
      updateBlockData(block.id, { endpoints: next });
    },
    [block.id, updateBlockData],
  );

  const addEndpoint = useCallback(() => {
    const newEndpoint: ApiEndpoint = {
      id: genId(),
      method: 'GET',
      path: '/path',
      description: '',
      requestBody: '',
      responseBody: '',
    };
    setEndpoints([...endpoints, newEndpoint]);
  }, [endpoints, setEndpoints]);

  const updateEndpoint = useCallback(
    (id: string, patch: Partial<ApiEndpoint>) => {
      setEndpoints(
        endpoints.map((ep) => (ep.id === id ? { ...ep, ...patch } : ep)),
      );
    },
    [endpoints, setEndpoints],
  );

  const removeEndpoint = useCallback(
    (id: string) => {
      setEndpoints(endpoints.filter((ep) => ep.id !== id));
    },
    [endpoints, setEndpoints],
  );

  const handleDoubleEnter = useDoubleEnterExit(onExitWidget ?? (() => {}));

  if (isPreview) {
    return (
      <WidgetPreviewCard icon={Globe} title="API Design">
        <div className="flex flex-col gap-3">
          {endpoints.length === 0 ? (
            <p className="text-[12px] italic text-muted-foreground">
              No endpoints defined.
            </p>
          ) : (
            endpoints.map((ep) => (
              <div key={ep.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${methodColors[ep.method]}`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-mono text-[12px] text-foreground/90">
                    {ep.path}
                  </code>
                </div>
                {ep.description && (
                  <p className="text-[12px] text-muted-foreground">
                    {ep.description}
                  </p>
                )}
                {ep.requestBody && (
                  <div>
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Request
                    </div>
                    <pre className="overflow-x-auto rounded bg-card/80 p-2 font-mono text-[11px] text-foreground/80">
                      {ep.requestBody}
                    </pre>
                  </div>
                )}
                {ep.responseBody && (
                  <div>
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Response
                    </div>
                    <pre className="overflow-x-auto rounded bg-card/80 p-2 font-mono text-[11px] text-foreground/80">
                      {ep.responseBody}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </WidgetPreviewCard>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 py-3"
      onKeyDown={onExitWidget ? handleDoubleEnter : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            API Design
          </span>
        </div>
        <button
          type="button"
          onClick={addEndpoint}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Add Endpoint
        </button>
      </div>

      {endpoints.length === 0 ? (
        <p className="text-[12px] italic text-muted-foreground">
          No endpoints yet.
        </p>
      ) : (
        endpoints.map((ep, epIdx) => (
          <div key={ep.id} className="py-2">
            <div className="mb-2 flex items-center gap-2">
              <select
                value={ep.method}
                onChange={(e) =>
                  updateEndpoint(ep.id, { method: e.target.value as HttpMethod })
                }
                className={`rounded border px-1.5 py-0.5 text-[11px] font-bold tracking-wider outline-none ${methodColors[ep.method]} bg-transparent cursor-pointer`}
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={ep.path}
                onChange={(e) => updateEndpoint(ep.id, { path: e.target.value })}
                placeholder="/path"
                autoFocus={autoFocus && epIdx === 0}
                className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-[12px] text-foreground outline-none transition-colors hover:border-border/50 focus:border-ring/40 focus:bg-card/30"
              />
              <button
                type="button"
                onClick={() => removeEndpoint(ep.id)}
                className="flex-shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
              >
                <Minus className="h-3 w-3" />
              </button>
            </div>

            <input
              type="text"
              value={ep.description}
              onChange={(e) =>
                updateEndpoint(ep.id, { description: e.target.value })
              }
              placeholder="Description..."
              className="mb-2 w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-[12px] text-foreground outline-none transition-colors hover:border-border/50 focus:border-ring/40 focus:bg-card/30 placeholder:text-muted-foreground/40"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Request Body
                </div>
                <textarea
                  value={ep.requestBody}
                  onChange={(e) =>
                    updateEndpoint(ep.id, { requestBody: e.target.value })
                  }
                  placeholder='{"key": "value"}'
                  rows={3}
                  className="w-full resize-none rounded border border-border/30 bg-card/40 px-2 py-1.5 font-mono text-[11px] text-foreground outline-none transition-colors focus:border-ring/40 placeholder:text-muted-foreground/40"
                />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Response Body
                </div>
                <textarea
                  value={ep.responseBody}
                  onChange={(e) =>
                    updateEndpoint(ep.id, { responseBody: e.target.value })
                  }
                  placeholder='{"result": "..."}'
                  rows={3}
                  className="w-full resize-none rounded border border-border/30 bg-card/40 px-2 py-1.5 font-mono text-[11px] text-foreground outline-none transition-colors focus:border-ring/40 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
