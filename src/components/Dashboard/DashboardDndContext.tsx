import { createContext, useContext, type ReactNode } from 'react';
import type { Id } from '../../../convex/_generated/dataModel';

interface DashboardDndContextValue {
  overedFolderId: Id<'folders'> | null;
  isDropTarget: (folderId: Id<'folders'>) => boolean;
}

const DashboardDndContext = createContext<DashboardDndContextValue | null>(null);

interface DashboardDndProviderProps {
  children: ReactNode;
  overedFolderId: Id<'folders'> | null;
}

/**
 * Provides drag-and-drop state to Dashboard components
 * Eliminates prop drilling for drop target indicators
 */
export function DashboardDndProvider({ children, overedFolderId }: DashboardDndProviderProps) {
  const isDropTarget = (folderId: Id<'folders'>) => overedFolderId === folderId;

  return (
    <DashboardDndContext.Provider value={{ overedFolderId, isDropTarget }}>
      {children}
    </DashboardDndContext.Provider>
  );
}

/**
 * Hook to access Dashboard drag-and-drop state
 * @throws Error if used outside DashboardDndProvider
 */
export function useDashboardDnd() {
  const context = useContext(DashboardDndContext);
  if (!context) {
    throw new Error('useDashboardDnd must be used within DashboardDndProvider');
  }
  return context;
}
