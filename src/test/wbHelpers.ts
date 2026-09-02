import type { ParsedWorkbook, ParsedSheet, CellValue } from '../lib/xlsform/types';

function toSheet(name: string, headers: string[], rows: Record<string, CellValue>[]): ParsedSheet {
  return {
    name,
    headers,
    rows: rows.map((values, idx) => ({ rowNumber: idx + 2, values })),
  };
}

/** Construit un ParsedWorkbook minimal (survey/choices/settings) pour les tests. */
export function makeWorkbook(input: {
  survey?: { headers: string[]; rows: Record<string, CellValue>[] };
  choices?: { headers: string[]; rows: Record<string, CellValue>[] };
  settings?: { headers: string[]; rows: Record<string, CellValue>[] };
  fileName?: string;
}): ParsedWorkbook {
  const sheets: Record<string, ParsedSheet> = {};
  const sheetNames: string[] = [];

  if (input.survey) {
    sheets.survey = toSheet('survey', input.survey.headers, input.survey.rows);
    sheetNames.push('survey');
  }
  if (input.choices) {
    sheets.choices = toSheet('choices', input.choices.headers, input.choices.rows);
    sheetNames.push('choices');
  }
  if (input.settings) {
    sheets.settings = toSheet('settings', input.settings.headers, input.settings.rows);
    sheetNames.push('settings');
  }

  return { fileName: input.fileName ?? 'test.xlsx', sheets, sheetNames };
}

export const DEFAULT_SETTINGS = {
  headers: ['form_title', 'form_id'],
  rows: [{ form_title: 'Enquête test', form_id: 'enquete_test' }],
};
