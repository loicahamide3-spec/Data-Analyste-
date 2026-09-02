import { NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Validator } from './pages/Validator';
import { Generator } from './pages/Generator';
import { Scripts } from './pages/Scripts';
import { DataProcessing } from './pages/DataProcessing';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/validateur" element={<Validator />} />
          <Route path="/generateur" element={<Generator />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/donnees" element={<DataProcessing />} />
        </Routes>
      </main>
      <footer className="app-footer">
        Traitement 100% local dans votre navigateur — aucun fichier n'est envoyé sur un serveur.
      </footer>
    </>
  );
}
