import { describe, it, expect } from 'vitest';
import {
  generateEmbedURL,
  generateFlowEmbedURL,
  parseEmbedURL,
} from '../embed/WidgetEmbed';

describe('Embed System', () => {
  describe('generateEmbedURL', () => {
    it('should generate basic embed URL', () => {
      const url = generateEmbedURL('widget-123');
      expect(url).toContain('instance=widget-123');
    });

    it('should include mode parameter when provided', () => {
      const url = generateEmbedURL('widget-123', { mode: 'panel' });
      expect(url).toContain('mode=panel');
    });

    it('should include interactive parameter when provided', () => {
      const url = generateEmbedURL('widget-123', { interactive: false });
      expect(url).toContain('interactive=false');
    });

    it('should include theme parameter when provided', () => {
      const url = generateEmbedURL('widget-123', { theme: 'dark' });
      expect(url).toContain('theme=dark');
    });

    it('should validate mode parameter and exclude invalid modes', () => {
      const url = generateEmbedURL('widget-123', {
        mode: 'invalid' as 'inline',
      });
      expect(url).not.toContain('mode=invalid');
    });

    it('should validate theme parameter and exclude invalid themes', () => {
      const url = generateEmbedURL('widget-123', {
        theme: 'invalid' as 'light',
      });
      expect(url).not.toContain('theme=invalid');
    });
  });

  describe('generateFlowEmbedURL', () => {
    it('should generate flow embed URL', () => {
      const url = generateFlowEmbedURL('flow-123');
      expect(url).toContain('flow=flow-123');
    });

    it('should include mode parameter for flows', () => {
      const url = generateFlowEmbedURL('flow-123', { mode: 'iframe' });
      expect(url).toContain('mode=iframe');
    });

    it('should include interactive parameter for flows', () => {
      const url = generateFlowEmbedURL('flow-123', { interactive: true });
      expect(url).toContain('interactive=true');
    });

    it('should validate mode parameter for flows', () => {
      const url = generateFlowEmbedURL('flow-123', {
        mode: 'invalid' as 'inline',
      });
      expect(url).not.toContain('mode=invalid');
    });
  });

  describe('parseEmbedURL', () => {
    it('should parse widget instance from URL', () => {
      const params = new URLSearchParams('instance=widget-123');
      const result = parseEmbedURL(params);

      expect(result).toBeTruthy();
      expect(result?.instanceId).toBe('widget-123');
    });

    it('should parse flow ID from URL', () => {
      const params = new URLSearchParams('flow=flow-123');
      const result = parseEmbedURL(params);

      expect(result).toBeTruthy();
      expect(result?.flowId).toBe('flow-123');
    });

    it('should return null when no instance or flow provided', () => {
      const params = new URLSearchParams('');
      const result = parseEmbedURL(params);

      expect(result).toBeNull();
    });

    it('should parse mode parameter with validation', () => {
      const params = new URLSearchParams('instance=widget-123&mode=panel');
      const result = parseEmbedURL(params);

      expect(result?.mode).toBe('panel');
    });

    it('should default to iframe mode for invalid mode', () => {
      const params = new URLSearchParams('instance=widget-123&mode=invalid');
      const result = parseEmbedURL(params);

      expect(result?.mode).toBe('iframe');
    });

    it('should parse interactive parameter', () => {
      const params = new URLSearchParams('instance=widget-123&interactive=false');
      const result = parseEmbedURL(params);

      expect(result?.interactive).toBe(false);
    });

    it('should default interactive to true', () => {
      const params = new URLSearchParams('instance=widget-123');
      const result = parseEmbedURL(params);

      expect(result?.interactive).toBe(true);
    });

    it('should parse theme parameter with validation', () => {
      const params = new URLSearchParams('instance=widget-123&theme=dark');
      const result = parseEmbedURL(params);

      expect(result?.theme).toBe('dark');
    });

    it('should return undefined for invalid theme', () => {
      const params = new URLSearchParams('instance=widget-123&theme=invalid');
      const result = parseEmbedURL(params);

      expect(result?.theme).toBeUndefined();
    });

    it('should validate light theme', () => {
      const params = new URLSearchParams('instance=widget-123&theme=light');
      const result = parseEmbedURL(params);

      expect(result?.theme).toBe('light');
    });
  });
});
