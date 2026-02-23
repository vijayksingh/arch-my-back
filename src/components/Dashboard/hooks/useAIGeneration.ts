import { useAction } from 'convex/react';
import { useMutation } from 'convex/react';
import { useNavigate } from '@tanstack/react-router';
import { api } from '../../../../convex/_generated/api';
import { toCanvasNodes } from '@/dsl/canvasAdapter';
import { useCanvasStore } from '@/stores/canvasStore';

/**
 * Hook for AI-powered architecture generation
 */
export function useAIGeneration() {
  const navigate = useNavigate();
  const generateArchitecture = useAction(api.aiGeneration.generateArchitecture);
  const createDesign = useMutation(api.newDesigns.create);
  const { loadDesign } = useCanvasStore();

  const handleAIGenerate = async (prompt: string) => {
    try {
      // Call the AI generation action
      const result = await generateArchitecture({ prompt });

      // Parse the generated JSON
      const archspecDoc = JSON.parse(result.content);

      // Convert to canvas nodes/edges format
      const { nodes, edges } = toCanvasNodes(archspecDoc);

      // Create a new design with AI-generated content
      const now = new Date();
      const title = archspecDoc.metadata?.title || `AI Generated ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      const designId = await createDesign({ title });

      // Load the generated nodes/edges into the canvas store
      // Cast nodes to CanvasNode[] as toCanvasNodes returns a compatible but different type
      loadDesign(nodes as any, edges);

      // Run layout to position nodes properly
      const { autoLayout } = useCanvasStore.getState();
      await autoLayout();

      // Navigate to the new design
      navigate({ to: '/design/$designId', params: { designId } });

    } catch (error: any) {
      // Re-throw to let AIPromptBar handle error display
      throw error;
    }
  };

  return { handleAIGenerate };
}
