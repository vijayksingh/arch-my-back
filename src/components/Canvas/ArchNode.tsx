import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
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
  Box,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ArchNode as ArchNodeType, ComponentCategory } from '@/types';
import { componentTypeMap } from '@/registry/componentTypes';

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

const categoryGlows: Record<ComponentCategory, string> = {
  Traffic: 'var(--glow-traffic)',
  Compute: 'var(--glow-compute)',
  Storage: 'var(--glow-storage)',
  Messaging: 'var(--glow-messaging)',
  Caching: 'var(--glow-caching)',
  External: 'var(--glow-external)',
};

const categoryAccents: Record<ComponentCategory, string> = {
  Traffic: '--category-traffic-accent',
  Compute: '--category-compute-accent',
  Storage: '--category-storage-accent',
  Messaging: '--category-messaging-accent',
  Caching: '--category-caching-accent',
  External: '--category-external-accent',
};

function ArchNodeComponent({ data, selected }: NodeProps<ArchNodeType>) {
  const [isHovered, setIsHovered] = useState(false);
  const typeDef = componentTypeMap.get(data.componentType);
  const IconComponent = iconMap[typeDef?.icon ?? ''] ?? Box;
  const glowColor = typeDef ? categoryGlows[typeDef.category] : categoryGlows.External;
  const accentToken = typeDef ? categoryAccents[typeDef.category] : null;
  const accentColor = accentToken
    ? `hsl(var(${accentToken}))`
    : 'var(--node-icon-color)';
  const accentBorderColor = accentToken
    ? `hsl(var(${accentToken}) / ${selected ? '0.5' : '0.34'})`
    : 'var(--node-border)';
  const surfaceBackground = selected
    ? 'var(--node-surface-selected)'
    : isHovered
      ? 'var(--node-surface-hover)'
      : 'var(--node-surface)';
  const baseBorderColor = selected
    ? accentBorderColor
    : isHovered
      ? 'var(--node-border-hover)'
      : 'var(--node-border)';
  const boxShadow = selected
    ? `var(--node-selected-shadow), 0 0 14px ${glowColor}`
    : isHovered
      ? `var(--node-hover-shadow), 0 0 10px ${glowColor}`
      : 'var(--node-shadow)';
  const transform = selected
    ? 'scale(var(--node-selected-scale))'
    : isHovered
      ? 'translateY(-1px) scale(1.01)'
      : 'scale(1)';

  return (
    <div
      className="relative flex flex-col items-center justify-center gap-2.5 rounded-xl border px-4 py-3 transition-all duration-160"
      style={{
        width: 156,
        minHeight: 96,
        background: surfaceBackground,
        borderColor: baseBorderColor,
        boxShadow,
        transform,
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3! h-3! border-2! rounded-full!"
        style={{
          backgroundColor: 'var(--node-handle)',
          borderColor: 'var(--node-handle-border)',
          boxShadow: `0 0 12px var(--node-handle-glow)`,
        }}
      />

      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'var(--node-icon-surface)',
          border: `1px solid ${accentBorderColor}`,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18)',
        }}
      >
        <IconComponent
          size={18}
          strokeWidth={2.1}
          style={{ color: accentColor }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className="px-1 text-xs font-medium leading-tight"
          style={{ color: 'var(--node-label)' }}
        >
          {data.label}
        </span>
        {typeDef && (
          <span
            className="text-[9px] font-medium uppercase tracking-[0.12em]"
            style={{ color: 'var(--node-meta)' }}
          >
            {typeDef.label}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3! h-3! border-2! rounded-full!"
        style={{
          backgroundColor: 'var(--node-handle)',
          borderColor: 'var(--node-handle-border)',
          boxShadow: `0 0 12px var(--node-handle-glow)`,
        }}
      />
    </div>
  );
}

const ArchNode = memo(ArchNodeComponent);
export default ArchNode;
