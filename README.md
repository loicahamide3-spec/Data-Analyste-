# Outils enquêtes XLSForm

Application web pour préparer, contrôler et exploiter des enquêtes XLSForm / KoboToolbox — **entièrement dans le navigateur**.

## Principe fondateur

- **Aucun serveur, aucune base de données.** Lecture, validation, génération et export s'exécutent en JavaScript côté navigateur.
- **Aucun fichier envoyé sur un serveur.** Les données d'enquête ne transitent jamais par un tiers.
- **Aucun appel à une IA.** Tous les contrôles sont déterministes.
- **Fonctionne hors ligne** une fois chargée (PWA) et s'héberge en statique (GitHub Pages).

## Modules

| Priorité | Module | État |
|---|---|---|
| 1 | Validateur XLSForm | ✅ disponible |
| 2 | Générateur XLSForm | à venir |
| 3 | Générateur de scripts (SPSS/Stata/R) | à venir |
| 4 | Traitement des données Kobo | à venir |

### Module 1 — Validateur XLSForm

Dépose un fichier `.xlsx` et produit un rapport classé en trois niveaux :

- 🔴 Bloquant (le formulaire serait rejeté par KoboToolbox)
- 🟠 Avertissement (fonctionnera mais posera problème)
- 🔵 Suggestion (bonne pratique)

Contrôles couverts : structure des feuilles, colonnes obligatoires, noms de variables, types XLSForm, listes de choix, références `${...}` et logique (`relevant`/`constraint`/`calculation`), qualité méthodologique (plages numériques, libellés, durée estimée). Export du rapport en PDF et vue « formulaire ».

## Stack technique

- React + Vite + TypeScript
- [SheetJS (xlsx)](https://sheetjs.com/) pour la lecture/écriture Excel
- PapaParse pour le CSV (module 4)
- jsPDF pour les exports PDF
- vite-plugin-pwa pour le fonctionnement hors ligne
- Aucun backend, aucune base de données, aucun appel réseau au runtime

## Développement

```bash
npm install
npm run dev       # serveur de développement
npm run build     # build de production (dist/)
npm run lint       # oxlint
```

## Déploiement (GitHub Pages)

Le build est statique et relatif (`base: './'`), déployable tel quel sur GitHub Pages via le workflow `.github/workflows/deploy.yml`.
