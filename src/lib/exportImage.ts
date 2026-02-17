import { toPng } from 'html-to-image';

export async function exportCanvasAsPng(
  elementId: string,
  filename: string = 'architecture-design.png',
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const backgroundToken = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    const backgroundColor = backgroundToken
      ? `hsl(${backgroundToken})`
      : '#0a0a0a';

    const dataUrl = await toPng(element, {
      backgroundColor,
      quality: 0.95,
      pixelRatio: 2,
      filter: (node: HTMLElement) => {
        // Exclude minimap and controls from the export for a cleaner image
        const classList = node.classList;
        if (!classList) return true;
        return (
          !classList.contains('react-flow__minimap') &&
          !classList.contains('react-flow__controls')
        );
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas as PNG:', error);
  }
}
