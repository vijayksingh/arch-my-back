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
  Box,
} from 'lucide-react';

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
