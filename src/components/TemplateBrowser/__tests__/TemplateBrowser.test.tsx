import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateBrowser } from '../TemplateBrowser';
import { templates } from '@/templates';
import { useCanvasStore } from '@/stores/canvasStore';

// Mock the store
vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn(),
}));

describe('TemplateBrowser', () => {
  const mockLoadDesign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the useCanvasStore hook
    (useCanvasStore as any).mockImplementation((selector: any) => {
      const state = {
        loadDesign: mockLoadDesign,
      };
      return selector ? selector(state) : state;
    });
  });

  test('renders dialog when open is true', () => {
    const onOpenChange = vi.fn();
    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByText('Architecture Templates')).toBeInTheDocument();
    expect(
      screen.getByText(/Choose a template to start your architecture diagram/i)
    ).toBeInTheDocument();
  });

  test('does not render dialog when open is false', () => {
    const onOpenChange = vi.fn();
    render(<TemplateBrowser open={false} onOpenChange={onOpenChange} />);

    expect(screen.queryByText('Architecture Templates')).not.toBeInTheDocument();
  });

  test('renders all 5 template cards', () => {
    const onOpenChange = vi.fn();
    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    // Should render all templates
    templates.forEach((template) => {
      expect(screen.getByText(template.title)).toBeInTheDocument();
      expect(screen.getByText(template.description)).toBeInTheDocument();
    });
  });

  test('displays node count badge for each template', () => {
    const onOpenChange = vi.fn();
    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    // Find all badges showing node counts
    const badges = screen.getAllByText(/\d+ nodes/);
    expect(badges).toHaveLength(5);
  });

  test('loads template and closes dialog when template is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    // Find and click the first template
    const firstTemplate = templates[0];
    const templateButton = screen.getByText(firstTemplate.title);

    await user.click(templateButton);

    // Should call loadDesign with template data
    expect(mockLoadDesign).toHaveBeenCalledWith(firstTemplate.nodes, firstTemplate.edges);

    // Should close the dialog
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('loads correct template when different templates are clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    // Click the ecommerce template
    const ecommerceTemplate = templates.find((t) => t.slug === 'ecommerce');
    expect(ecommerceTemplate).toBeDefined();

    const ecommerceButton = screen.getByText(ecommerceTemplate!.title);
    await user.click(ecommerceButton);

    // Should load the ecommerce template
    expect(mockLoadDesign).toHaveBeenCalledWith(ecommerceTemplate!.nodes, ecommerceTemplate!.edges);
  });

  test('template cards have hover styles', () => {
    const onOpenChange = vi.fn();
    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    const firstTemplate = templates[0];
    const templateButton = screen.getByText(firstTemplate.title).closest('button');

    expect(templateButton).toHaveClass('hover:border-primary');
    expect(templateButton).toHaveClass('hover:bg-accent');
  });

  test('template titles have hover color transition', () => {
    const onOpenChange = vi.fn();
    render(<TemplateBrowser open={true} onOpenChange={onOpenChange} />);

    const firstTemplate = templates[0];
    const titleElement = screen.getByText(firstTemplate.title);

    expect(titleElement).toHaveClass('group-hover:text-primary');
  });
});
