import * as XLSX from 'xlsx';
import type { ParsedSheet, ParsedWorkbook, CellValue } from './types';

/**
 * Lit un fichier .xlsx entièrement dans le navigateur (aucun envoi réseau)
 * et le transforme en structure exploitable par le validateur.
 */
export async function parseXlsxFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

  const sheets: Record<string, ParsedSheet> = {};
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const raw: CellValue[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      blankrows: true,
    });

    if (raw.length === 0) {
      sheets[sheetName] = { name: sheetName, headers: [], rows: [] };
      continue;
    }

    const headers = (raw[0] as CellValue[]).map((h) => (h === undefined || h === null ? '' : String(h).trim()));
    const rows = raw.slice(1).map((line, idx) => {
      const values: Record<string, CellValue> = {};
      headers.forEach((h, colIdx) => {
        if (!h) return;
        values[h] = (line as CellValue[])[colIdx] ?? '';
      });
      return { rowNumber: idx + 2, values };
    });

    sheets[sheetName] = { name: sheetName, headers, rows };
  }

  return {
    fileName: file.name,
    sheets,
    sheetNames: workbook.SheetNames,
  };
}
