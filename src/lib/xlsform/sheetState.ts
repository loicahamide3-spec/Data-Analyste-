// Modèle éditable (tableau de lignes) utilisé par le générateur XLSForm,
// et passerelle vers ParsedWorkbook pour réutiliser le validateur du module 1.

import type { ParsedSheet, ParsedWorkbook } from './types';

export interface SheetState {
  headers: string[];
  rows: Record<string, string>[];
}

export const SURVEY_COLUMNS = [
  'type',
  'name',
  'label',
  'hint',
  'required',
  'required_message',
  'relevant',
  'constraint',
  'constraint_message',
  'calculation',
  'appearance',
  'default',
];

export const CHOICES_COLUMNS = ['list_name', 'name', 'label'];

export const SETTINGS_COLUMNS = ['form_title', 'form_id', 'version', 'default_language'];

export function emptySheetState(canonicalColumns: string[]): SheetState {
  return { headers: [...canonicalColumns], rows: [] };
}

export function emptyRow(headers: string[]): Record<string, string> {
  const row: Record<string, string> = {};
  for (const h of headers) row[h] = '';
  return row;
}

/** Détecte le séparateur le plus probable d'un texte collé (tabulation, |, ; ou ,). */
function detectDelimiter(firstLine: string): string {
  const candidates = ['\t', '|', ';', ','];
  let best = '\t';
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

/**
 * Parse un tableau collé (presse-papiers) en en-têtes + lignes brutes.
 * Les colonnes sont identifiées par leur nom d'en-tête, pas par leur position.
 */
export function parsePastedTable(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = lines[0].split(delimiter).map((h) => h.trim());
  const headers = rawHeaders.filter((h) => h !== '');

  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(delimiter);
    const row: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      if (!h) return;
      row[h] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Fusionne un tableau collé avec la liste de colonnes canoniques attendues :
 * colonnes manquantes complétées à vide, colonnes en trop conservées à la suite,
 * quel que soit l'ordre dans lequel elles ont été collées.
 */
export function mergeWithCanonicalColumns(
  parsed: { headers: string[]; rows: Record<string, string>[] },
  canonicalColumns: string[],
): SheetState {
  const lowerCanonical = canonicalColumns.map((c) => c.toLowerCase());
  const extraHeaders = parsed.headers.filter((h) => !lowerCanonical.includes(h.toLowerCase()));
  const headers = [...canonicalColumns, ...extraHeaders];

  const rows = parsed.rows.map((r) => {
    const row: Record<string, string> = {};
    for (const h of headers) {
      // recherche insensible à la casse pour retrouver la valeur collée
      const key = Object.keys(r).find((k) => k.toLowerCase() === h.toLowerCase());
      row[h] = key ? r[key] : '';
    }
    return row;
  });

  return { headers, rows };
}

export function sheetStateToParsedSheet(name: string, state: SheetState): ParsedSheet {
  return {
    name,
    headers: state.headers,
    rows: state.rows.map((values, idx) => ({ rowNumber: idx + 2, values })),
  };
}

export function buildWorkbookFromState(
  fileName: string,
  survey: SheetState,
  choices: SheetState,
  settings: SheetState,
): ParsedWorkbook {
  return {
    fileName,
    sheetNames: ['survey', 'choices', 'settings'],
    sheets: {
      survey: sheetStateToParsedSheet('survey', survey),
      choices: sheetStateToParsedSheet('choices', choices),
      settings: sheetStateToParsedSheet('settings', settings),
    },
  };
}
