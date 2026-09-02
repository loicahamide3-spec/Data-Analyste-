import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface KoboDataset {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
}

export async function importKoboFile(file: File): Promise<KoboDataset> {
  if (/\.csv$/i.test(file.name)) {
    return importCsv(file);
  }
  if (/\.xlsx$/i.test(file.name)) {
    return importXlsx(file);
  }
  throw new Error('Format non pris en charge : déposez un export .csv ou .xlsx.');
}

async function importCsv(file: File): Promise<KoboDataset> {
  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimitersToGuess: [',', ';', '\t', '|'],
  });

  const headers = result.meta.fields ?? [];
  const rows = (result.data ?? []).map((row) => {
    const clean: Record<string, string> = {};
    for (const h of headers) clean[h] = (row[h] ?? '').toString().trim();
    return clean;
  });

  return { fileName: file.name, headers, rows };
}

async function importXlsx(file: File): Promise<KoboDataset> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
  if (raw.length === 0) return { fileName: file.name, headers: [], rows: [] };

  const headers = raw[0].map((h) => String(h).trim());
  const rows = raw.slice(1).map((line) => {
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = line[idx] !== undefined && line[idx] !== null ? String(line[idx]).trim() : '';
    });
    return row;
  });

  return { fileName: file.name, headers, rows };
}
