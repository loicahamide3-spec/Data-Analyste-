import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { KoboDataset } from './importKobo';
import { downloadTextFile } from '../downloadTextFile';

function baseName(fileName: string): string {
  return (fileName.replace(/\.[^.]+$/, '') || 'donnees').replace(/[^a-z0-9_-]+/gi, '_');
}

export function downloadDatasetAsCsv(dataset: KoboDataset) {
  const csv = Papa.unparse({ fields: dataset.headers, data: dataset.rows.map((r) => dataset.headers.map((h) => r[h] ?? '')) });
  downloadTextFile(`${baseName(dataset.fileName)}-nettoye.csv`, csv, 'text/csv;charset=utf-8');
}

export function downloadDatasetAsXlsx(dataset: KoboDataset) {
  const aoa = [dataset.headers, ...dataset.rows.map((r) => dataset.headers.map((h) => r[h] ?? ''))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'donnees');
  XLSX.writeFile(wb, `${baseName(dataset.fileName)}-nettoye.xlsx`);
}

export function downloadCleaningReport(dataset: KoboDataset, operations: string[]) {
  const lines = [
    `Rapport de nettoyage — ${dataset.fileName}`,
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
    '',
    `Nombre d'enregistrements : ${dataset.rows.length}`,
    `Nombre de colonnes : ${dataset.headers.length}`,
    '',
    'Opérations effectuées :',
    ...(operations.length > 0 ? operations.map((o) => `- ${o}`) : ['- Aucune opération de préparation appliquée.']),
  ];
  downloadTextFile(`${baseName(dataset.fileName)}-rapport-nettoyage.txt`, lines.join('\n'));
}
