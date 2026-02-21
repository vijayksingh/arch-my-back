import {
  createExportService,
  DEFAULT_EXPORT_CONFIG,
  type ExportConfig,
  type ExportResult,
} from '@/services/exportService';

/**
 * Export canvas as PNG - backward-compatible wrapper around ExportService
 *
 * This function maintains the existing API for components while using
 * the new service layer internally for better testability and separation of concerns.
 */
export async function exportCanvasAsPng(
  elementId: string,
  filename: string = 'architecture-design.png',
): Promise<void> {
  const exportService = createExportService();

  const config: ExportConfig = {
    elementId,
    filename,
    format: 'png',
    quality: DEFAULT_EXPORT_CONFIG.quality!,
    pixelRatio: DEFAULT_EXPORT_CONFIG.pixelRatio!,
    backgroundColor: '', // Will be computed by service
    excludeClasses: DEFAULT_EXPORT_CONFIG.excludeClasses!,
  };

  const result: ExportResult = await exportService.exportCanvasAsPng(config);

  if (!result.success) {
    console.error(result.error);
  }
}

/**
 * Export canvas as SVG - wrapper around ExportService
 *
 * Provides scalable vector graphics export for high-quality output at any resolution.
 */
export async function exportCanvasAsSvg(
  elementId: string,
  filename: string = 'architecture-design.svg',
): Promise<void> {
  const exportService = createExportService();

  const config: ExportConfig = {
    elementId,
    filename,
    format: 'svg',
    quality: DEFAULT_EXPORT_CONFIG.quality!,
    pixelRatio: DEFAULT_EXPORT_CONFIG.pixelRatio!,
    backgroundColor: '', // Will be computed by service
    excludeClasses: DEFAULT_EXPORT_CONFIG.excludeClasses!,
  };

  const result: ExportResult = await exportService.exportCanvasAsSvg(config);

  if (!result.success) {
    console.error(result.error);
  }
}
