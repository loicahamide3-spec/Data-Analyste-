import { describe, expect, it } from 'vitest';
import { validateXlsForm, DEFAULT_OPTIONS } from './validate';
import { makeWorkbook, DEFAULT_SETTINGS } from '../../test/wbHelpers';

function surveyHeaders() {
  return ['type', 'name', 'label', 'required', 'relevant', 'constraint', 'constraint_message', 'calculation'];
}

describe('validateXlsForm — structure', () => {
  it('signale les feuilles manquantes comme bloquantes', () => {
    const wb = makeWorkbook({});
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBeGreaterThanOrEqual(3);
    expect(report.issues.some((i) => i.message.includes('survey'))).toBe(true);
    expect(report.issues.some((i) => i.message.includes('choices'))).toBe(true);
    expect(report.issues.some((i) => i.message.includes('settings'))).toBe(true);
  });

  it('signale les colonnes obligatoires manquantes', () => {
    const wb = makeWorkbook({
      survey: { headers: ['type', 'name'], rows: [] }, // pas de label
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('« label »'))).toBe(true);
  });

  it('accepte un formulaire minimal valide sans erreur bloquante', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [{ type: 'text', name: 'nom', label: 'Quel est votre nom ?' }],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBe(0);
  });
});

describe('validateXlsForm — noms de variables', () => {
  it('rejette les noms avec accents ou espaces', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'text', name: 'Nom du répondant', label: 'x' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.message.includes('caractère interdit'))).toBe(true);
  });

  it('rejette un nom commençant par un chiffre', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'text', name: '1nom', label: 'x' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('commence par un chiffre'))).toBe(true);
  });

  it('détecte les doublons de noms de variables', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [
          { type: 'text', name: 'nom', label: 'Nom' },
          { type: 'integer', name: 'nom', label: 'Autre' },
        ],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('utilisé') && i.message.includes('fois'))).toBe(true);
  });

  it('signale un mot réservé', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'text', name: 'label', label: 'x' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('mot réservé'))).toBe(true);
  });

  it('suggère de renommer les noms peu explicites', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'text', name: 'q1', label: 'x' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.severity === 'suggestion' && i.message.includes('explicite'))).toBe(true);
  });
});

describe('validateXlsForm — types et listes', () => {
  it('rejette un type inconnu', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'nombre_entier', name: 'age', label: 'Âge' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'est pas un type XLSForm reconnu"))).toBe(true);
  });

  it("rejette un select_one dont la liste n'existe pas", () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'select_one inexistante', name: 'sexe', label: 'Sexe' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'existe pas dans la feuille choices"))).toBe(true);
  });

  it('accepte un select_one dont la liste existe', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'select_one sexe', name: 'sexe', label: 'Sexe' }] },
      choices: {
        headers: ['list_name', 'name', 'label'],
        rows: [
          { list_name: 'sexe', name: '1', label: 'Homme' },
          { list_name: 'sexe', name: '2', label: 'Femme' },
        ],
      },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBe(0);
  });

  it('signale les groupes non fermés', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [
          { type: 'begin_group', name: 'grp', label: 'Groupe' },
          { type: 'text', name: 'nom', label: 'Nom' },
        ],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'est jamais fermé"))).toBe(true);
  });

  it('signale un calculate sans formule', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'calculate', name: 'calc1', label: '' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'a pas de formule"))).toBe(true);
  });
});

describe('validateXlsForm — références et logique', () => {
  it('rejette une référence ${...} vers une variable inexistante', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [{ type: 'text', name: 'nom', label: 'Nom', relevant: "${inexistant} = '1'" }],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("qui n'existe pas"))).toBe(true);
  });

  it('rejette une référence vers une variable posée après', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [
          { type: 'text', name: 'a', label: 'A', relevant: "${b} = '1'" },
          { type: 'text', name: 'b', label: 'B' },
        ],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('posée après'))).toBe(true);
  });

  it('accepte une référence vers une variable posée avant', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [
          { type: 'text', name: 'a', label: 'A' },
          { type: 'text', name: 'b', label: 'B', relevant: "${a} = '1'" },
        ],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBe(0);
  });

  it('signale les parenthèses déséquilibrées', () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [{ type: 'text', name: 'a', label: 'A', relevant: "(1 = 1" }],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('Parenthèses déséquilibrées'))).toBe(true);
  });

  it("avertit d'une constraint sans « . »", () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [{ type: 'integer', name: 'age', label: 'Âge', constraint: 'age >= 0' }],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('ne contient pas de « . »'))).toBe(true);
  });

  it("avertit d'une constraint sans constraint_message", () => {
    const wb = makeWorkbook({
      survey: {
        headers: surveyHeaders(),
        rows: [{ type: 'integer', name: 'age', label: 'Âge', constraint: '. >= 0' }],
      },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'a pas de constraint_message"))).toBe(true);
  });
});

describe('validateXlsForm — listes de choix', () => {
  it('détecte les doublons dans une même liste', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'select_one sexe', name: 'sexe', label: 'Sexe' }] },
      choices: {
        headers: ['list_name', 'name', 'label'],
        rows: [
          { list_name: 'sexe', name: '1', label: 'Homme' },
          { list_name: 'sexe', name: '1', label: 'Homme (bis)' },
        ],
      },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('doublon') && i.sheet === 'choices')).toBe(true);
  });

  it('signale un label vide', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'select_one sexe', name: 'sexe', label: 'Sexe' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [{ list_name: 'sexe', name: '1', label: '' }] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'a pas de libellé"))).toBe(true);
  });

  it('signale les listes inutilisées', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'text', name: 'nom', label: 'Nom' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [{ list_name: 'orpheline', name: '1', label: 'X' }] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes("n'est utilisée par aucune question"))).toBe(true);
  });
});

describe('validateXlsForm — qualité méthodologique', () => {
  it('avertit une question numérique sans contrainte de plage', () => {
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows: [{ type: 'integer', name: 'age', label: 'Âge' }] },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.issues.some((i) => i.message.includes('aucune contrainte de plage'))).toBe(true);
  });

  it('calcule une estimation de durée cohérente et alerte au-delà du seuil', () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({ type: 'text', name: `q${i}_libelle`, label: `Question ${i}` }));
    const wb = makeWorkbook({
      survey: { headers: surveyHeaders(), rows },
      choices: { headers: ['list_name', 'name', 'label'], rows: [] },
      settings: DEFAULT_SETTINGS,
    });
    const report = validateXlsForm(wb, DEFAULT_OPTIONS);
    expect(report.questionCount).toBe(200);
    expect(report.estimatedDurationMinutes).toBeGreaterThan(45);
    expect(report.issues.some((i) => i.message.includes('dépasse'))).toBe(true);
  });
});
