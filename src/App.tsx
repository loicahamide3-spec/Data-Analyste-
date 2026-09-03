import { lazy, Suspense } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';

const Validator = lazy(() => import('./pages/Validator').then((m) => ({ default: m.Validator })));
const Generator = lazy(() => import('./pages/Generator').then((m) => ({ default: m.Generator })));
const Scripts = lazy(() => import('./pages/Scripts').then((m) => ({ default: m.Scripts })));
const DataProcessing = lazy(() => import('./pages/DataProcessing').then((m) => ({ default: m.DataProcessing })));

function PageLoading() {
  return <div className="card">Chargement…</div>;
}

export function App() {
  return (
    <>
      <header className="app-header">
        <h1>Outils enquêtes XLSForm</h1>
        <nav>
          <NavLink to="/" end>
            Accueil
          </NavLink>
          <NavLink to="/validateur">Validateur</NavLink>
          <NavLink to="/generateur">Générateur</NavLink>
          <NavLink to="/scripts">Scripts</NavLink>
          <NavLink to="/donnees">Données</NavLink>
        </nav>
      </header>
      <main>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/validateur" element={<Validator />} />
            <Route path="/generateur" element={<Generator />} />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/donnees" element={<DataProcessing />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="app-footer">
        Traitement 100% local dans votre navigateur — aucun fichier n'est envoyé sur un serveur.
      </footer>
    </>
  );
}
