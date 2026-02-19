import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeTheme } from '@/stores/themeStore';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { convex } from '@/lib/convex';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>
);
