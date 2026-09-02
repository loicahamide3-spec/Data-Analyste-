import { NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Validator } from './pages/Validator';
import { Generator } from './pages/Generator';
import { ComingSoon } from './pages/ComingSoon';

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
          <Route
            path="/scripts"
            element={
              <ComingSoon
                title="Générateur de scripts d'analyse"
                description="Génération automatique des scripts SPSS, Stata et R à partir d'un XLSForm valide."
              />
            }
          />
          <Route
            path="/donnees"
            element={
              <ComingSoon
                title="Traitement des données Kobo"
                description="Nettoyage, contrôle qualité et anonymisation d'un export de collecte KoboToolbox."
              />
            }
          />
        </Routes>
      </main>
      <footer className="app-footer">
        Traitement 100% local dans votre navigateur — aucun fichier n'est envoyé sur un serveur.
      </footer>
    </>
  );
}
