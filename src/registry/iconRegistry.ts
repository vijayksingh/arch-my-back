import type { LucideIcon } from 'lucide-react';
import Scale from 'lucide-react/dist/esm/icons/scale';
import Router from 'lucide-react/dist/esm/icons/router';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Server from 'lucide-react/dist/esm/icons/server';
import Cog from 'lucide-react/dist/esm/icons/cog';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Database from 'lucide-react/dist/esm/icons/database';
import HardDrive from 'lucide-react/dist/esm/icons/hard-drive';
import MemoryStick from 'lucide-react/dist/esm/icons/memory-stick';
import ArrowRightLeft from 'lucide-react/dist/esm/icons/arrow-right-left';
import Plug from 'lucide-react/dist/esm/icons/plug';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Box from 'lucide-react/dist/esm/icons/box';

/**
 * Centralized icon registry mapping icon names to Lucide icon components.
 * Single source of truth for all icon mappings across the application.
 */
export const iconMap: Record<string, LucideIcon> = {
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

/**
 * Get an icon component by name with a fallback to Box icon.
 * @param name - The icon name to look up
 * @returns The corresponding Lucide icon component
 */
export function getIconByName(name: string): LucideIcon {
  return iconMap[name] ?? Box;
}

/**
 * Default fallback icon when an icon name is not found.
 */
export const defaultIcon = Box;
