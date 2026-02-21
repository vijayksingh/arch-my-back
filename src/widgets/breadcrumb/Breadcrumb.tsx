import { useState } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  Copy,
  File,
  Folder,
  Function as FunctionIcon,
  Box,
} from 'lucide-react';

/**
 * Breadcrumb item type
 */
export type BreadcrumbItemType = 'file' | 'function' | 'class' | 'module' | 'folder';

/**
 * Individual breadcrumb item
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  type: BreadcrumbItemType;
  metadata?: Record<string, unknown>;
}

/**
 * Breadcrumb Navigator Input Schema
 */
export interface BreadcrumbInput {
  path: BreadcrumbItem[];
  currentId?: string;
}

/**
 * Breadcrumb Navigator Output Schema
 */
export interface BreadcrumbOutput {
  selectedId: string;
  path?: string;
}

/**
 * Breadcrumb Navigator Config Schema
 */
export interface BreadcrumbConfig {
  name?: string;
  maxLength?: number;
  showIcons?: boolean;
  separator?: 'chevron' | 'slash' | 'dot';
}

/**
 * Breadcrumb Navigator Widget Component
 */
export function Breadcrumb({
  instanceId,
  input,
  config,
  onOutput,
}: WidgetProps<BreadcrumbInput, BreadcrumbOutput, BreadcrumbConfig>) {
  const [hoveredId, setHoveredId] = useState<string | undefined>();

  if (!input || !input.path || input.path.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No path provided. Please provide a path array.
        </div>
      </div>
    );
  }

  const maxLength = config.maxLength || 5;
  const showIcons = config.showIcons !== false;
  const separator = config.separator || 'chevron';

  // Truncate path if too long
  const displayPath =
    input.path.length > maxLength
      ? [
          input.path[0],
          {
            id: 'ellipsis',
            label: '...',
            type: 'folder' as BreadcrumbItemType,
          },
          ...input.path.slice(-(maxLength - 2)),
        ]
      : input.path;

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.id === 'ellipsis') return;

    const pathString = input.path
      .slice(0, input.path.findIndex((i) => i.id === item.id) + 1)
      .map((i) => i.label)
      .join('/');

    onOutput?.({
      selectedId: item.id,
      path: pathString,
    });
  };

  const handleCopyPath = () => {
    const pathString = input.path.map((i) => i.label).join('/');
    navigator.clipboard.writeText(pathString);
  };

  const getIcon = (type: BreadcrumbItemType) => {
    switch (type) {
      case 'file':
        return <File className="h-3.5 w-3.5" />;
      case 'folder':
        return <Folder className="h-3.5 w-3.5" />;
      case 'function':
        return <FunctionIcon className="h-3.5 w-3.5" />;
      case 'class':
        return <Box className="h-3.5 w-3.5" />;
      case 'module':
        return <Box className="h-3.5 w-3.5" />;
      default:
        return <File className="h-3.5 w-3.5" />;
    }
  };

  const getSeparator = () => {
    switch (separator) {
      case 'slash':
        return <span className="mx-1 text-muted-foreground">/</span>;
      case 'dot':
        return <span className="mx-1 text-muted-foreground">•</span>;
      case 'chevron':
      default:
        return <ChevronRight className="mx-0.5 h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="text-sm font-medium">{config.name || 'Breadcrumb Navigator'}</div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyPath}
          title="Copy full path to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Breadcrumb trail */}
      <div className="flex flex-1 items-center overflow-x-auto px-4 py-3">
        <nav
          className="flex items-center"
          aria-label="Breadcrumb"
          role="navigation"
        >
          <ol className="flex items-center">
            {displayPath.map((item, index) => {
              const isLast = index === displayPath.length - 1;
              const isCurrent = item.id === input.currentId;
              const isEllipsis = item.id === 'ellipsis';

              return (
                <li key={item.id} className="flex items-center">
                  <button
                    className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors ${
                      isEllipsis
                        ? 'cursor-default text-muted-foreground'
                        : isCurrent
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'hover:bg-muted'
                    }`}
                    onClick={() => !isEllipsis && handleItemClick(item)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(undefined)}
                    disabled={isEllipsis}
                    aria-current={isCurrent ? 'page' : undefined}
                    title={
                      isEllipsis
                        ? `${input.path.length - maxLength + 2} hidden items`
                        : item.label
                    }
                  >
                    {showIcons && !isEllipsis && (
                      <span className="text-muted-foreground">{getIcon(item.type)}</span>
                    )}
                    <span
                      className={`whitespace-nowrap ${
                        isLast || isCurrent ? 'font-medium' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>

                  {!isLast && <span className="flex-shrink-0">{getSeparator()}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Metadata panel (shown when hovering) */}
      {hoveredId && hoveredId !== 'ellipsis' && (
        <div className="border-t border-border bg-muted/10 px-4 py-2 text-xs">
          {(() => {
            const item = input.path.find((i) => i.id === hoveredId);
            if (!item) return null;

            return (
              <div className="space-y-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-muted-foreground">Type: {item.type}</div>
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="text-muted-foreground">
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Footer with item count */}
      <div className="border-t border-border bg-muted/20 px-4 py-1 text-xs text-muted-foreground">
        {input.path.length} item{input.path.length !== 1 ? 's' : ''} in path
        {input.path.length > maxLength &&
          ` (showing ${maxLength}, ${input.path.length - maxLength} hidden)`}
      </div>
    </div>
  );
}
