import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Doc, Id } from '../../../../convex/_generated/dataModel';
import { api } from '../../../../convex/_generated/api';

/**
 * Hook for drag-and-drop functionality in dashboard
 * Handles design-to-folder drag interactions
 */
export function useDashboardDragDrop() {
  const moveToFolder = useMutation(api.newDesigns.moveToFolder);

  const [activeDesign, setActiveDesign] = useState<Doc<'newDesigns'> | null>(null);
  const [overedFolderId, setOveredFolderId] = useState<Id<'folders'> | null>(null);

  // Configure drag sensors with distance threshold to prevent click interception
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'design') {
      setActiveDesign(active.data.current.design);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.type === 'folder') {
      setOveredFolderId(over.id as Id<'folders'>);
    } else {
      setOveredFolderId(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag state
    setActiveDesign(null);
    setOveredFolderId(null);

    // Check if dropped on a folder
    if (
      over?.data.current?.type === 'folder' &&
      active.data.current?.type === 'design'
    ) {
      const design = active.data.current.design as Doc<'newDesigns'>;
      const targetFolderId = over.id as Id<'folders'>;

      // Don't move if already in that folder
      if (design.folderId === targetFolderId) {
        return;
      }

      try {
        await moveToFolder({ designId: design._id, folderId: targetFolderId });
      } catch (error) {
        console.error('Failed to move design to folder:', error);
      }
    }
  }, [moveToFolder]);

  const handleDragCancel = useCallback(() => {
    setActiveDesign(null);
    setOveredFolderId(null);
  }, []);

  return {
    sensors,
    activeDesign,
    overedFolderId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
