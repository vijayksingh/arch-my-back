/**
 * Export Service - Functional Core / Imperative Shell Pattern
 *
 * Separates pure configuration from side effects:
 * - Pure configuration: ExportConfig interface
 * - Side effects: ExportEffect interface for DOM/html-to-image operations
 * - Service: ExportService class orchestrates the export process
 */

import { toPng } from 'html-to-image';

// ============================================================================
// TYPES AND CONFIGURATION
// ============================================================================

/**
 * Configuration for canvas export
 */
export interface ExportConfig {
  elementId: string;
  filename: string;
  quality: number;
  pixelRatio: number;
  backgroundColor: string;
  excludeClasses: string[];
}

/**
 * Result of export operation
 */
export interface ExportResult {
  success: boolean;
  error?: string;
  dataUrl?: string;
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: Partial<ExportConfig> = {
  filename: 'architecture-design.png',
  quality: 0.95,
  pixelRatio: 2,
  excludeClasses: ['react-flow__minimap', 'react-flow__controls'],
};

// ============================================================================
// IMPERATIVE SHELL - Side effects interface
// ============================================================================

/**
 * Interface for export side effects (DOM access, file download)
 * Allows dependency injection and mocking in tests
 */
export interface ExportEffect {
  /**
   * Find DOM element by ID
   */
  findElement(elementId: string): HTMLElement | null;

  /**
   * Get computed background color from CSS variables
   */
  getBackgroundColor(): string;

  /**
   * Convert element to PNG data URL
   */
  elementToPng(
    element: HTMLElement,
    options: {
      backgroundColor: string;
      quality: number;
      pixelRatio: number;
      filter: (node: HTMLElement) => boolean;
    }
  ): Promise<string>;

  /**
   * Trigger download of data URL
   */
  downloadImage(dataUrl: string, filename: string): void;

  /**
   * Check if code is running in browser environment
   */
  isBrowser(): boolean;
}

// ============================================================================
// PRODUCTION IMPLEMENTATION
// ============================================================================

/**
 * Production implementation using real DOM and html-to-image
 */
export class DOMExportEffect implements ExportEffect {
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  findElement(elementId: string): HTMLElement | null {
    if (!this.isBrowser()) return null;
    return document.getElementById(elementId);
  }

  getBackgroundColor(): string {
    if (!this.isBrowser()) return '#0a0a0a';

    const backgroundToken = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();

    return backgroundToken ? `hsl(${backgroundToken})` : '#0a0a0a';
  }

  async elementToPng(
    element: HTMLElement,
    options: {
      backgroundColor: string;
      quality: number;
      pixelRatio: number;
      filter: (node: HTMLElement) => boolean;
    }
  ): Promise<string> {
    return await toPng(element, options);
  }

  downloadImage(dataUrl: string, filename: string): void {
    if (!this.isBrowser()) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
}

// ============================================================================
// MOCK IMPLEMENTATION - For testing
// ============================================================================

/**
 * Mock implementation for testing (no real DOM/download operations)
 */
export class MockExportEffect implements ExportEffect {
  private mockElement: HTMLElement | null = null;
  private mockBackgroundColor: string = '#0a0a0a';
  private mockDataUrl: string = 'data:image/png;base64,mock';
  private downloadedFiles: Array<{ dataUrl: string; filename: string }> = [];
  private shouldThrowError: boolean = false;

  isBrowser(): boolean {
    return true;
  }

  findElement(_elementId: string): HTMLElement | null {
    return this.mockElement;
  }

  getBackgroundColor(): string {
    return this.mockBackgroundColor;
  }

  async elementToPng(
    _element: HTMLElement,
    _options: {
      backgroundColor: string;
      quality: number;
      pixelRatio: number;
      filter: (node: HTMLElement) => boolean;
    }
  ): Promise<string> {
    if (this.shouldThrowError) {
      throw new Error('Mock export error');
    }
    return this.mockDataUrl;
  }

  downloadImage(dataUrl: string, filename: string): void {
    this.downloadedFiles.push({ dataUrl, filename });
  }

  // Test helpers
  setMockElement(element: HTMLElement | null): void {
    this.mockElement = element;
  }

  setMockBackgroundColor(color: string): void {
    this.mockBackgroundColor = color;
  }

  setMockDataUrl(dataUrl: string): void {
    this.mockDataUrl = dataUrl;
  }

  setShouldThrowError(shouldThrow: boolean): void {
    this.shouldThrowError = shouldThrow;
  }

  getDownloadedFiles(): Array<{ dataUrl: string; filename: string }> {
    return [...this.downloadedFiles];
  }

  clearDownloadedFiles(): void {
    this.downloadedFiles = [];
  }
}

// ============================================================================
// SERVICE - Orchestrates the export process
// ============================================================================

/**
 * Export service that orchestrates canvas export using injected effects
 */
export class ExportService {
  private effect: ExportEffect;
  constructor(effect: ExportEffect) {
    this.effect = effect;
  }

  /**
   * Export canvas as PNG
   */
  async exportCanvasAsPng(config: ExportConfig): Promise<ExportResult> {
    // Find element
    const element = this.effect.findElement(config.elementId);
    if (!element) {
      return {
        success: false,
        error: `Element with id "${config.elementId}" not found`,
      };
    }

    try {
      // Get background color
      const backgroundColor = this.effect.getBackgroundColor();

      // Create filter function for excluding elements
      const filter = (node: HTMLElement): boolean => {
        const classList = node.classList;
        if (!classList) return true;

        return !config.excludeClasses.some((className) =>
          classList.contains(className)
        );
      };

      // Convert to PNG
      const dataUrl = await this.effect.elementToPng(element, {
        backgroundColor,
        quality: config.quality,
        pixelRatio: config.pixelRatio,
        filter,
      });

      // Trigger download
      this.effect.downloadImage(dataUrl, config.filename);

      return {
        success: true,
        dataUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export canvas: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// ============================================================================
// FACTORY - Dependency injection
// ============================================================================

let exportEffectInstance: ExportEffect | null = null;

/**
 * Get export effect instance (singleton for production)
 */
export function getExportEffect(): ExportEffect {
  if (!exportEffectInstance) {
    exportEffectInstance = new DOMExportEffect();
  }
  return exportEffectInstance;
}

/**
 * Set export effect instance (for testing)
 */
export function setExportEffect(effect: ExportEffect): void {
  exportEffectInstance = effect;
}

/**
 * Reset export effect instance to default
 */
export function resetExportEffect(): void {
  exportEffectInstance = null;
}

/**
 * Create export service with default effect
 */
export function createExportService(effect?: ExportEffect): ExportService {
  return new ExportService(effect ?? getExportEffect());
}
