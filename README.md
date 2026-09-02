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
| 2 | Générateur XLSForm | ✅ disponible |
| 3 | Générateur de scripts (SPSS/Stata/R) | ✅ disponible |
| 4 | Traitement des données Kobo | ✅ disponible |

### Module 1 — Validateur XLSForm

Dépose un fichier `.xlsx` et produit un rapport classé en trois niveaux :

- 🔴 Bloquant (le formulaire serait rejeté par KoboToolbox)
- 🟠 Avertissement (fonctionnera mais posera problème)
- 🔵 Suggestion (bonne pratique)

Contrôles couverts : structure des feuilles, colonnes obligatoires, noms de variables, types XLSForm, listes de choix, références `${...}` et logique (`relevant`/`constraint`/`calculation`), qualité méthodologique (plages numériques, libellés, durée estimée). Export du rapport en PDF et vue « formulaire ».

### Module 2 — Générateur XLSForm

Parcours principal : collage du questionnaire (feuilles survey/choices/settings, colonnes reconnues par leur nom quel que soit l'ordre, absences complétées à vide), aperçu, contrôle automatique via le module 1, correction en un clic des anomalies mécaniques, puis génération du `.xlsx`. Complété par une saisie/retouche manuelle et une bibliothèque de blocs réutilisables (transversaux et sectoriels), pilotée par un fichier de données (`src/data/blockLibrary.ts`), avec sauvegarde de blocs personnalisés.

### Module 3 — Générateur de scripts d'analyse

À partir d'un XLSForm valide, génère les squelettes commentés SPSS (`.sps`), Stata (`.do`) et R (`.R`) : import, libellés de variables et de modalités, nettoyage, statistiques descriptives. Décompose les `select_multiple` en colonnes binaires, signale les questions en répétition (fichier Kobo séparé), et exporte un dictionnaire des variables en PDF et Excel.

### Module 4 — Traitement des données Kobo

Importe un export KoboToolbox (`.csv` ou `.xlsx`), avec un XLSForm optionnel pour enrichir les contrôles. Calcule le taux de complétude par variable, détecte les doublons et les valeurs aberrantes (contraintes du XLSForm ou méthode interquartile), et affiche les statistiques de collecte (durée moyenne, répartition par enquêteur). Prépare les données (décomposition des choix multiples, remplacement codes/libellés, suppression des colonnes techniques Kobo, anonymisation) puis exporte le fichier nettoyé (`.csv`/`.xlsx`) et un rapport de nettoyage.

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
