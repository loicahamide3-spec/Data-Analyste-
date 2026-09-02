import * as XLSX from 'xlsx';
import type { SheetState } from './sheetState';
import { slugifyFileName } from '../slugify';

function sheetStateToAoa(state: SheetState): string[][] {
  const headers = state.headers;
  const body = state.rows.map((row) => headers.map((h) => row[h] ?? ''));
  return [headers, ...body];
}

/** Génère le fichier .xlsx (survey / choices / settings) et déclenche le téléchargement. */
export function downloadXlsForm(
  fileBaseName: string,
  survey: SheetState,
  choices: SheetState,
  settings: SheetState,
) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetStateToAoa(survey)), 'survey');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetStateToAoa(choices)), 'choices');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetStateToAoa(settings)), 'settings');

  XLSX.writeFile(wb, `${slugifyFileName(fileBaseName, 'formulaire')}.xlsx`);
}
