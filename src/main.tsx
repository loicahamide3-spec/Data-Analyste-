import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';

// Résout le préfixe réel du site (ex. "/Data-Analyste-/" sur GitHub Pages) à
// partir de l'URL du document plutôt que de BASE_URL, qui reste littéralement
// "./" avec une base Vite relative et casserait le basename du routeur.
const basename = new URL(import.meta.env.BASE_URL, document.baseURI).pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
