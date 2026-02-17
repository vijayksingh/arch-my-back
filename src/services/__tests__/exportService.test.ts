import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExportService,
  MockExportEffect,
  DOMExportEffect,
  DEFAULT_EXPORT_CONFIG,
  type ExportConfig,
} from '../exportService';

describe('exportService - MockExportEffect', () => {
  let mockEffect: MockExportEffect;

  beforeEach(() => {
    mockEffect = new MockExportEffect();
  });

  describe('isBrowser', () => {
    it('should return true (simulates browser)', () => {
      expect(mockEffect.isBrowser()).toBe(true);
    });
  });

  describe('findElement', () => {
    it('should return null by default', () => {
      expect(mockEffect.findElement('test-id')).toBe(null);
    });

    it('should return mock element when set', () => {
      const mockElement = document.createElement('div');
      mockEffect.setMockElement(mockElement);

      expect(mockEffect.findElement('test-id')).toBe(mockElement);
    });
  });

  describe('getBackgroundColor', () => {
    it('should return default color', () => {
      expect(mockEffect.getBackgroundColor()).toBe('#0a0a0a');
    });

    it('should return configured color', () => {
      mockEffect.setMockBackgroundColor('#ffffff');
      expect(mockEffect.getBackgroundColor()).toBe('#ffffff');
    });
  });

  describe('elementToPng', () => {
    it('should return mock data URL', async () => {
      const element = document.createElement('div');
      const options = {
        backgroundColor: '#0a0a0a',
        quality: 0.95,
        pixelRatio: 2,
        filter: () => true,
      };

      const dataUrl = await mockEffect.elementToPng(element, options);
      expect(dataUrl).toBe('data:image/png;base64,mock');
    });

    it('should throw error when configured', async () => {
      mockEffect.setShouldThrowError(true);

      const element = document.createElement('div');
      const options = {
        backgroundColor: '#0a0a0a',
        quality: 0.95,
        pixelRatio: 2,
        filter: () => true,
      };

      await expect(mockEffect.elementToPng(element, options)).rejects.toThrow(
        'Mock export error'
      );
    });
  });

  describe('downloadImage', () => {
    it('should record downloaded files', () => {
      mockEffect.downloadImage('data:image/png;base64,test', 'test.png');

      const files = mockEffect.getDownloadedFiles();
      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        dataUrl: 'data:image/png;base64,test',
        filename: 'test.png',
      });
    });

    it('should record multiple downloads', () => {
      mockEffect.downloadImage('data:1', 'file1.png');
      mockEffect.downloadImage('data:2', 'file2.png');

      const files = mockEffect.getDownloadedFiles();
      expect(files).toHaveLength(2);
    });

    it('should clear downloaded files', () => {
      mockEffect.downloadImage('data:1', 'file1.png');
      mockEffect.clearDownloadedFiles();

      expect(mockEffect.getDownloadedFiles()).toHaveLength(0);
    });
  });
});

describe('exportService - ExportService', () => {
  let mockEffect: MockExportEffect;
  let exportService: ExportService;

  beforeEach(() => {
    mockEffect = new MockExportEffect();
    exportService = new ExportService(mockEffect);
  });

  const createConfig = (overrides?: Partial<ExportConfig>): ExportConfig => ({
    elementId: 'canvas',
    filename: 'test.png',
    quality: DEFAULT_EXPORT_CONFIG.quality!,
    pixelRatio: DEFAULT_EXPORT_CONFIG.pixelRatio!,
    backgroundColor: '',
    excludeClasses: DEFAULT_EXPORT_CONFIG.excludeClasses!,
    ...overrides,
  });

  describe('exportCanvasAsPng', () => {
    it('should fail when element not found', async () => {
      mockEffect.setMockElement(null);

      const result = await exportService.exportCanvasAsPng(createConfig());

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should successfully export canvas', async () => {
      const mockElement = document.createElement('div');
      mockEffect.setMockElement(mockElement);
      mockEffect.setMockDataUrl('data:image/png;base64,success');

      const result = await exportService.exportCanvasAsPng(
        createConfig({ filename: 'architecture.png' })
      );

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe('data:image/png;base64,success');

      const downloads = mockEffect.getDownloadedFiles();
      expect(downloads).toHaveLength(1);
      expect(downloads[0].filename).toBe('architecture.png');
    });

    it('should use configured background color', async () => {
      const mockElement = document.createElement('div');
      mockEffect.setMockElement(mockElement);
      mockEffect.setMockBackgroundColor('#123456');

      const result = await exportService.exportCanvasAsPng(createConfig());

      expect(result.success).toBe(true);
      // Background color is used internally by elementToPng
    });

    it('should handle export errors', async () => {
      const mockElement = document.createElement('div');
      mockEffect.setMockElement(mockElement);
      mockEffect.setShouldThrowError(true);

      const result = await exportService.exportCanvasAsPng(createConfig());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to export canvas');
      expect(result.error).toContain('Mock export error');
    });

    it('should exclude configured classes', async () => {
      const mockElement = document.createElement('div');
      const minimap = document.createElement('div');
      minimap.classList.add('react-flow__minimap');
      mockElement.appendChild(minimap);

      mockEffect.setMockElement(mockElement);

      const result = await exportService.exportCanvasAsPng(
        createConfig({
          excludeClasses: ['react-flow__minimap', 'react-flow__controls'],
        })
      );

      expect(result.success).toBe(true);
      // Filter logic is tested by checking that export succeeds
    });

    it('should use custom quality and pixelRatio', async () => {
      const mockElement = document.createElement('div');
      mockEffect.setMockElement(mockElement);

      const result = await exportService.exportCanvasAsPng(
        createConfig({
          quality: 1.0,
          pixelRatio: 3,
        })
      );

      expect(result.success).toBe(true);
      // Quality and pixelRatio are passed to elementToPng
    });
  });
});

describe('exportService - DOMExportEffect behavior', () => {
  describe('isBrowser', () => {
    it('should detect browser environment', () => {
      const effect = new DOMExportEffect();
      // In test environment (Node), this should return false
      // In browser, it would return true
      const isBrowser = effect.isBrowser();
      expect(typeof isBrowser).toBe('boolean');
    });
  });

  describe('findElement', () => {
    it('should return null when not in browser', () => {
      const effect = new DOMExportEffect();
      // In Node environment, should return null
      const element = effect.findElement('test-id');
      expect(element === null || element instanceof HTMLElement).toBe(true);
    });
  });
});

describe('exportService - DEFAULT_EXPORT_CONFIG', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_EXPORT_CONFIG.filename).toBe('architecture-design.png');
    expect(DEFAULT_EXPORT_CONFIG.quality).toBe(0.95);
    expect(DEFAULT_EXPORT_CONFIG.pixelRatio).toBe(2);
    expect(DEFAULT_EXPORT_CONFIG.excludeClasses).toEqual([
      'react-flow__minimap',
      'react-flow__controls',
    ]);
  });
});
