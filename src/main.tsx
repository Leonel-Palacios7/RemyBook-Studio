import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Los estilos globales se importan primero para que los de cada módulo los puedan sobrescribir.
import './styles/global.css';
import './styles/app.css';
import App from './App';
import { BookProvider } from './store/BookProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookProvider>
      <App />
    </BookProvider>
  </StrictMode>,
);
