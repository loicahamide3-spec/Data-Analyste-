import { Link } from 'react-router-dom';

const MODULES = [
  {
    to: '/validateur',
    title: '1. Validateur XLSForm',
    desc: 'Contrôlez votre fichier avant de le téléverser dans KoboToolbox : erreurs bloquantes, avertissements, suggestions.',
    ready: true,
  },
  {
    to: '/generateur',
    title: '2. Générateur XLSForm',
    desc: 'Construisez ou collez un questionnaire et générez un fichier XLSForm conforme.',
    ready: true,
  },
  {
    to: '/scripts',
    title: '3. Générateur de scripts',
    desc: 'Générez les scripts SPSS, Stata et R à partir d’un XLSForm valide.',
    ready: true,
  },
  {
    to: '/donnees',
    title: '4. Traitement des données Kobo',
    desc: 'Nettoyez et préparez un export de collecte KoboToolbox.',
    ready: true,
  },
];

export function Home() {
  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Outils pour enquêtes XLSForm / KoboToolbox</h2>
        <p>
          Tous les traitements se font dans votre navigateur. Aucun fichier n'est envoyé sur un serveur, aucune
          intelligence artificielle n'est utilisée : chaque contrôle est déterministe et vérifiable.
        </p>
      </div>
      <div className="module-grid">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.ready ? m.to : '#'} className={`module-card${m.ready ? '' : ' disabled'}`}>
            <span className="badge">{m.ready ? 'Disponible' : 'À venir'}</span>
            <h3 style={{ margin: '0 0 0.4rem' }}>{m.title}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
