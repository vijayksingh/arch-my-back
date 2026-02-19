import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeTheme } from '@/stores/themeStore';

initializeTheme();

createRoot(document.getElementById('root')!).render(<App />);
