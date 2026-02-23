import { addEdge, type OnConnect, type Connection } from '@xyflow/react';
import type { ArchEdge } from '@/types';
import { validateArchConnection } from '@/lib/connectionRules';

export interface EdgeSlice {
  onConnect: OnConnect;
  updateEdgeData: (edgeId: string, data: Partial<ArchEdge['data']>) => void;
}

export const createEdgeSlice = (
  set: any,
  get: any
): EdgeSlice => ({
  onConnect: (connection: Connection) => {
    const nodes = get().nodes;
    const validation = validateArchConnection(nodes, connection);

    if (!validation.valid) {
      // Block the connection - show warning in console
      console.warn(`Connection blocked: ${validation.warning || 'Invalid connection'}`);
      return;
    }

    if (validation.warning) {
      // Allow connection but show warning
      console.warn(`Connection warning: ${validation.warning}`);
    }

    const newEdge: ArchEdge = {
      ...connection,
      id: `edge_${connection.source}_${connection.target}`,
      type: 'archEdge',
      data: { protocol: 'HTTPS' },
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((e: ArchEdge) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      ),
    });
  },
});
